/** Express router mounted at /api/ops. Public reads, rate-limited public writes, PIN-protected admin routes. */
import { Router, Request, Response } from 'express';
import type { Db } from './db';
import type { LocationData } from '../src/types';
import { adminAuthMiddleware } from '../src/utils/adminAuth';
import { computeEnsembleForecast } from '../src/utils/ensembleForecast';
import { bus, runCycle, flushOutboxToWebhook } from './engine';
import { makeLimiter } from './limiter';
import { maskContact, validateCheckin, validateSubscriber } from './validate';
import * as repo from './repo';

const ACTOR = 'responder';
const hoursAgoIso = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
const intParam = (v: unknown, def: number, min: number, max: number) => {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const tokenFrom = (req: Request): string => {
  const h = req.headers['x-ops-token'];
  return (Array.isArray(h) ? h[0] : h) ?? '';
};

export function createOpsRouter(
  db: Db,
  stations: LocationData[],
  getLiveLocations: () => Promise<{ locations: LocationData[]; isLive: boolean }>
): Router {
  const router = Router();
  const ids = stations.map((s) => s.id);
  const checkinLimit = makeLimiter(6, 10 * 60 * 1000);
  const subscribeLimit = makeLimiter(5, 60 * 60 * 1000);
  const clientIp = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown';
  const tooMany = (res: Response, s: number) =>
    res.status(429).json({ error: `Too many requests. Try again in ${s}s.`, retryAfterSeconds: s });

  // ---------- overview ----------
  router.get('/overview', (_req, res) => {
    const readings = repo.countReadings(db);
    res.json({
      ok: true,
      readings,
      latestEvents: repo.listEvents(db, 5),
      checkins: summariseCheckins(),
      serverTime: new Date().toISOString(),
    });
  });

  // ---------- recorded readings & forecast ----------
  router.get('/readings/:stationId', (req, res) => {
    if (!ids.includes(req.params.stationId)) return res.status(404).json({ error: 'Unknown station.' });
    const hours = intParam(req.query.hours, 48, 1, 24 * 14);
    res.json({ stationId: req.params.stationId, readings: repo.getReadings(db, req.params.stationId, hoursAgoIso(hours)) });
  });

  router.get('/forecast/:stationId', (req, res) => {
    const station = stations.find((s) => s.id === req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Unknown station.' });
    const horizon = intParam(req.query.horizon, 48, 6, 72);
    const savedThreshold = repo.getStationThreshold(db, station.id);
    const dangerLevel = savedThreshold?.danger_level ?? station.dangerLevel;
    const series = repo.hourlySeries(db, station.id, hoursAgoIso(48));
    const needed = 5;
    if (series.length < needed) {
      return res.json({ available: false, readingsAvailable: series.length, readingsNeeded: needed });
    }
    const result = computeEnsembleForecast(
      series.map((s) => s.level_m),
      { stepHours: 1, horizonHours: horizon, threshold: dangerLevel }
    );
    res.json({
      available: Boolean(result),
      basis: 'recorded_readings',
      includesDemoSeed: series.some((s) => s.source === 'demo_seed'),
      observed: series.map((s) => ({ at: s.recorded_at, level: s.level_m })),
      dangerLevel,
      result,
    });
  });

  // ---------- alert events ----------
  router.get('/events', (req, res) => {
    res.json({ events: repo.listEvents(db, intParam(req.query.limit, 50, 1, 200)) });
  });

  router.post('/events/:id/ack', adminAuthMiddleware, (req, res) => {
    const id = Number(req.params.id);
    const ok = Number.isInteger(id) && repo.acknowledgeEvent(db, id, ACTOR);
    if (!ok) return res.status(404).json({ error: 'Event not found or already acknowledged.' });
    repo.audit(db, ACTOR, 'event.ack', String(id));
    res.json({ success: true });
  });

  // ---------- subscribers ----------
  router.post('/subscribers', (req, res) => {
    const rl = subscribeLimit(clientIp(req));
    if (!rl.allowed) return tooMany(res, rl.retryAfterSeconds);
    const v = validateSubscriber(req.body, ids);
    if (!v.ok) return res.status(400).json({ error: v.error });
    const sub = repo.createSubscriber(db, v.value);
    res.status(201).json({ success: true, token: sub.token, locationId: sub.location_id, channel: sub.channel });
  });

  router.get('/subscribers/me', (req, res) => {
    const sub = repo.getSubscriberByToken(db, tokenFrom(req));
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });
    res.json({
      locationId: sub.location_id,
      channel: sub.channel,
      language: sub.language,
      minSeverity: sub.min_severity,
      contact: maskContact(sub.contact),
    });
  });

  router.delete('/subscribers/me', (req, res) => {
    const ok = repo.deleteSubscriberByToken(db, tokenFrom(req));
    if (!ok) return res.status(404).json({ error: 'Subscription not found.' });
    res.json({ success: true, deleted: true });
  });

  router.get('/subscribers', adminAuthMiddleware, (_req, res) => {
    res.json({ counts: repo.subscriberCounts(db) });
  });

  // ---------- check-ins ----------
  function summariseCheckins() {
    const rows = repo.checkinSummary(db, hoursAgoIso(24));
    const byArea: Record<string, Record<string, { reports: number; people: number }> & { latest?: any }> = {};
    for (const r of rows) {
      byArea[r.location_id] ??= {} as any;
      (byArea[r.location_id] as any)[r.status] = { reports: r.reports, people: r.people };
      const cur = (byArea[r.location_id] as any).latest as string | undefined;
      if (!cur || r.latest > cur) (byArea[r.location_id] as any).latest = r.latest;
    }
    return byArea;
  }

  router.get('/checkins/summary', (_req, res) => res.json({ windowHours: 24, areas: summariseCheckins() }));

  router.post('/checkins', (req, res) => {
    const rl = checkinLimit(clientIp(req));
    if (!rl.allowed) return tooMany(res, rl.retryAfterSeconds);
    const v = validateCheckin(req.body, ids);
    if (!v.ok) return res.status(400).json({ error: v.error });
    const made = repo.createCheckin(db, v.value);
    bus.emit('checkin', { locationId: v.value.location_id, status: v.value.status });
    res.status(201).json({ success: true, id: made.id, token: made.token });
  });

  router.post('/checkins/mine/resolve', (req, res) => {
    if (!repo.resolveCheckinByToken(db, tokenFrom(req))) return res.status(404).json({ error: 'Check-in not found.' });
    bus.emit('checkin', {});
    res.json({ success: true });
  });

  router.delete('/checkins/mine', (req, res) => {
    if (!repo.deleteCheckinByToken(db, tokenFrom(req))) return res.status(404).json({ error: 'Check-in not found.' });
    bus.emit('checkin', {});
    res.json({ success: true, deleted: true });
  });

  router.get('/checkins', adminAuthMiddleware, (req, res) => {
    res.json({ checkins: repo.listCheckinsAdmin(db, hoursAgoIso(intParam(req.query.hours, 48, 1, 24 * 14))) });
  });

  router.post('/checkins/:id/resolve', adminAuthMiddleware, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || !repo.resolveCheckinById(db, id, ACTOR)) {
      return res.status(404).json({ error: 'Check-in not found or already resolved.' });
    }
    repo.audit(db, ACTOR, 'checkin.resolve', String(id));
    bus.emit('checkin', {});
    res.json({ success: true });
  });

  // ---------- outbox (SMS queue) ----------
  router.get('/outbox', adminAuthMiddleware, (_req, res) => {
    res.json({ queued: repo.listOutbox(db, 'queued'), webhookConfigured: Boolean(process.env.NOTIFY_WEBHOOK_URL) });
  });

  router.post('/outbox/:id/sent', adminAuthMiddleware, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || !repo.markNotification(db, id, 'sent')) {
      return res.status(404).json({ error: 'Queued message not found.' });
    }
    repo.audit(db, ACTOR, 'outbox.sent', String(id));
    res.json({ success: true });
  });

  router.post('/outbox/flush', adminAuthMiddleware, async (_req, res) => {
    const sent = await flushOutboxToWebhook(db, process.env.NOTIFY_WEBHOOK_URL);
    repo.audit(db, ACTOR, 'outbox.flush', String(sent));
    res.json({ success: true, sent });
  });

  // ---------- sitreps, audit, manual cycle ----------
  router.post('/sitreps', adminAuthMiddleware, (req, res) => {
    const body = typeof req.body?.body === 'string' ? req.body.body.slice(0, 20000) : '';
    const language = req.body?.language === 'bn' ? 'bn' : 'en';
    if (body.length < 20) return res.status(400).json({ error: 'SitRep body is too short.' });
    const id = repo.saveSitrep(db, language, body, ACTOR);
    repo.audit(db, ACTOR, 'sitrep.save', String(id));
    res.status(201).json({ success: true, id });
  });

  router.get('/sitreps', adminAuthMiddleware, (_req, res) => res.json({ sitreps: repo.listSitreps(db) }));
  router.get('/audit', adminAuthMiddleware, (_req, res) => res.json({ audit: repo.listAudit(db) }));

  router.post('/cycle', adminAuthMiddleware, async (_req, res) => {
    const live = await getLiveLocations();
    const out = runCycle(db, live.locations, { source: live.isLive ? 'weather_enriched' : 'fallback' });
    repo.audit(db, ACTOR, 'cycle.manual', `events=${out.newEvents.length}`);
    res.json({ success: true, readings: out.readings, newEvents: out.newEvents.length, queued: out.queued });
  });

  // ---------- live stream (Server-Sent Events) ----------
  let clients = 0;
  router.get('/stream', (req: Request, res: Response) => {
    if (clients >= 300) return res.status(503).json({ error: 'Too many live connections.' });
    clients++;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 5000\n\n');
    res.write(`event: hello\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
    const onEvent = (e: unknown) => res.write(`event: alert\ndata: ${JSON.stringify(e)}\n\n`);
    const onCheckin = () => res.write(`event: checkin\ndata: ${JSON.stringify(summariseCheckins())}\n\n`);
    bus.on('event', onEvent);
    bus.on('checkin', onCheckin);
    const beat = setInterval(() => res.write(': keep-alive\n\n'), 25000);
    req.on('close', () => {
      clearInterval(beat);
      bus.off('event', onEvent);
      bus.off('checkin', onCheckin);
      clients--;
    });
  });

  return router;
}
