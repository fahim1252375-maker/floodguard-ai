import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from './db';
import * as repo from './repo';
import { runCycle, seedDemoHistory, COOLDOWN_MS } from './engine';
import { validateCheckin, validateSubscriber } from './validate';
import { makeLimiter } from './limiter';
import { computeEnsembleForecast } from '../src/utils/ensembleForecast';
import { INITIAL_LOCATIONS } from '../src/data/mockData';

const IDS = INITIAL_LOCATIONS.map((l) => l.id);
const hot = INITIAL_LOCATIONS.map((l) =>
  l.id === 'gowainghat' ? { ...l, currentWaterLevel: l.dangerLevel + 0.3, riskScore: 90 } : l
);

test('a cycle records one reading per station and creates alert events', () => {
  const db = openDb(':memory:');
  const out = runCycle(db, hot, { now: new Date('2026-07-01T00:00:00Z') });
  assert.equal(out.readings, hot.length);
  assert.equal(repo.countReadings(db).total, hot.length);
  assert.ok(out.newEvents.some((e) => e.station_id === 'gowainghat' && e.severity === 'emergency'));
});


test('live weather enrichment is not labelled as a live river-gauge observation', () => {
  const db = openDb(':memory:');
  const now = new Date('2026-07-01T00:00:00Z');
  runCycle(db, INITIAL_LOCATIONS, { source: 'weather_enriched', now });
  const rows = repo.getReadings(db, 'kanaighat', '2026-06-30T23:59:00.000Z');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source, 'weather_enriched');
});

test('same condition does not re-fire inside the cooldown, fires again after it', () => {
  const db = openDb(':memory:');
  const t0 = new Date('2026-07-01T00:00:00Z');
  const first = runCycle(db, hot, { now: t0 });
  const again = runCycle(db, hot, { now: new Date(t0.getTime() + 15 * 60000) });
  assert.ok(first.newEvents.length > 0);
  assert.equal(again.newEvents.length, 0);
  const later = runCycle(db, hot, { now: new Date(t0.getTime() + COOLDOWN_MS + 60000) });
  assert.ok(later.newEvents.length > 0);
});

test('escalation re-fires even inside the cooldown', () => {
  const db = openDb(':memory:');
  const t0 = new Date('2026-07-01T00:00:00Z');
  const calm = INITIAL_LOCATIONS.map((l) => ({ ...l, riskScore: 10, currentWaterLevel: l.dangerLevel - 3, rainfall24h: 0, waterLevelChange24h: 0 }));
  const watch = calm.map((l, i) => (i === 0 ? { ...l, rainfall24h: 200 } : l));
  runCycle(db, calm, { now: t0 });
  const a = runCycle(db, watch, { now: new Date(t0.getTime() + 60000) });
  assert.equal(a.newEvents.length, 1);
  assert.equal(a.newEvents[0].severity, 'watch');
  const rules = [{ id: 'r-rain', locationId: 'ALL', metric: 'rainfall_24h', threshold: 150, severity: 'emergency', enabled: true }] as any;
  const b = runCycle(db, watch, { now: new Date(t0.getTime() + 120000), rules });
  assert.equal(b.newEvents.length, 1);
  assert.equal(b.newEvents[0].severity, 'emergency');
});

test('SMS subscribers are queued in their language and honour min severity; web subscribers are not queued', () => {
  const db = openDb(':memory:');
  const bn = repo.createSubscriber(db, { location_id: 'gowainghat', channel: 'sms', contact: '+8801700000000', language: 'bn', min_severity: 'warning' });
  repo.createSubscriber(db, { location_id: 'gowainghat', channel: 'web', contact: null, language: 'en', min_severity: 'watch' });
  const strict = repo.createSubscriber(db, { location_id: 'gowainghat', channel: 'sms', contact: '+8801711111111', language: 'en', min_severity: 'emergency' });
  runCycle(db, hot, { now: new Date('2026-07-01T00:00:00Z') });
  const outbox = repo.listOutbox(db, 'queued');
  assert.ok(outbox.length >= 2);
  assert.ok(outbox.every((o) => o.channel === 'sms'));
  const forBn = outbox.filter((o) => o.contact === '+8801700000000');
  assert.ok(forBn.length > 0 && forBn.every((o) => /[\u0980-\u09FF]/.test(o.body)));
  assert.ok(outbox.some((o) => o.contact === '+8801711111111'));
  // marking sent removes from queue
  assert.ok(repo.markNotification(db, outbox[0].id, 'sent'));
  assert.equal(repo.listOutbox(db, 'queued').length, outbox.length - 1);
  // deleting a subscriber cascades to their notifications
  assert.ok(repo.deleteSubscriberByToken(db, bn.token));
  assert.ok(repo.listOutbox(db, 'queued').every((o) => o.contact !== '+8801700000000'));
  assert.ok(strict.id > 0);
});

test('demo seed gives enough hourly history for the recorded-data forecast and is labelled', () => {
  const db = openDb(':memory:');
  const now = new Date('2026-07-01T12:00:00Z');
  assert.ok(seedDemoHistory(db, INITIAL_LOCATIONS, now) > 0);
  assert.equal(seedDemoHistory(db, INITIAL_LOCATIONS, now), 0, 'second seed is a no-op');
  const series = repo.hourlySeries(db, 'kanaighat', new Date(now.getTime() - 48 * 3600000).toISOString());
  assert.ok(series.length >= 40);
  assert.ok(series.every((s) => s.source === 'demo_seed'));
  const f = computeEnsembleForecast(series.map((s) => s.level_m), { stepHours: 1, horizonHours: 24, threshold: 12.75 });
  assert.ok(f && f.points.length === 24);
});

test('check-in summary is aggregate-only, hides resolved, and supports erasure', () => {
  const db = openDb(':memory:');
  const a = repo.createCheckin(db, { location_id: 'chhatak', status: 'need_help', people: 4, note: 'roof', contact: '+8801700000000' });
  repo.createCheckin(db, { location_id: 'chhatak', status: 'safe', people: 2, note: null, contact: null });
  const since = new Date(Date.now() - 3600000).toISOString();
  const sum = repo.checkinSummary(db, since);
  assert.equal(sum.find((r) => r.status === 'need_help')!.people, 4);
  assert.ok(!JSON.stringify(sum).includes('+88017'), 'contact never appears in public summary');
  assert.ok(repo.resolveCheckinByToken(db, a.token));
  assert.equal(repo.checkinSummary(db, since).find((r) => r.status === 'need_help'), undefined);
  assert.ok(repo.deleteCheckinByToken(db, a.token));
  assert.equal(repo.deleteCheckinByToken(db, a.token), false);
});

test('validation rejects bad input and requires consent', () => {
  const ok = { locationId: 'chhatak', status: 'safe', people: 3, consent: true };
  assert.equal(validateCheckin(ok, IDS).ok, true);
  assert.equal(validateCheckin({ ...ok, consent: false }, IDS).ok, false);
  assert.equal(validateCheckin({ ...ok, locationId: 'mars' }, IDS).ok, false);
  assert.equal(validateCheckin({ ...ok, people: 0 }, IDS).ok, false);
  assert.equal(validateCheckin({ ...ok, people: 2.5 }, IDS).ok, false);
  assert.equal(validateCheckin({ ...ok, status: 'hacked' }, IDS).ok, false);
  assert.equal(validateCheckin({ ...ok, contact: 'abc' }, IDS).ok, false);
  const r = validateCheckin({ ...ok, note: 'x'.repeat(999) }, IDS);
  assert.ok(r.ok && r.value.note!.length === 280);
  assert.equal(validateSubscriber({ locationId: 'chhatak', channel: 'sms', consent: true }, IDS).ok, false);
  assert.equal(validateSubscriber({ locationId: 'chhatak', channel: 'sms', contact: '+8801700000000', consent: true }, IDS).ok, true);
  assert.equal(validateSubscriber({ locationId: 'chhatak', channel: 'web', consent: false }, IDS).ok, false);
});

test('SQL injection strings are stored as data, not executed', () => {
  const db = openDb(':memory:');
  repo.createCheckin(db, { location_id: 'chhatak', status: 'safe', people: 1, note: "x'); DROP TABLE checkins;--", contact: null });
  assert.equal((db.prepare('SELECT COUNT(*) AS n FROM checkins').get() as any).n, 1);
});

test('rate limiter blocks after max and recovers after the window', () => {
  const lim = makeLimiter(2, 1000);
  assert.ok(lim('ip', 0).allowed && lim('ip', 10).allowed);
  const blocked = lim('ip', 20);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);
  assert.ok(lim('ip', 1500).allowed);
  assert.ok(lim('other', 20).allowed);
});


test('station threshold overrides persist in SQLite and update across reads', () => {
  const db = openDb(':memory:');
  const saved = repo.saveStationThreshold(db, 'gowainghat', 10.25, 10.75, 'test-admin');
  assert.equal(saved.warning_level, 10.25);
  assert.equal(saved.danger_level, 10.75);
  assert.equal(repo.getStationThreshold(db, 'gowainghat')?.updated_by, 'test-admin');
  repo.saveStationThreshold(db, 'gowainghat', 10.4, 10.9, 'test-admin');
  assert.equal(repo.listStationThresholds(db).length, 1);
  assert.equal(repo.getStationThreshold(db, 'gowainghat')?.danger_level, 10.9);
});
