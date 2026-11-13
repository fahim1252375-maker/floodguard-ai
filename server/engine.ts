/**
 * Monitoring engine: records a reading for every station, evaluates alert rules,
 * stores new alert events (with a cooldown so the same condition does not spam),
 * and queues notifications for matching subscribers.
 */
import { EventEmitter } from 'events';
import type { Db } from './db';
import type { LocationData } from '../src/types';
import { DEFAULT_RULES, evaluateRules, type AlertRule } from '../src/utils/alertRules';
import {
  countReadings,
  enqueueNotification,
  insertEvent,
  insertReadings,
  lastEventFor,
  listOutbox,
  markNotification,
  pruneReadings,
  subscribersFor,
  SEVERITY_RANK,
  type EventRow,
  type ReadingRow,
} from './repo';

export const bus = new EventEmitter();
bus.setMaxListeners(300);

export const COOLDOWN_MS = 6 * 60 * 60 * 1000;
export const RETENTION_DAYS = 30;

export interface CycleResult {
  readings: number;
  newEvents: EventRow[];
  queued: number;
}

export function runCycle(
  db: Db,
  locations: LocationData[],
  opts: { source?: ReadingRow['source']; now?: Date; rules?: AlertRule[] } = {}
): CycleResult {
  const now = opts.now ?? new Date();
  const source = opts.source ?? 'fallback';

  insertReadings(
    db,
    locations.map((l) => ({
      station_id: l.id,
      level_m: l.currentWaterLevel,
      rainfall_mm: l.rainfall24h,
      risk_score: l.riskScore,
      source,
      recorded_at: now.toISOString(),
    }))
  );

  const newEvents: EventRow[] = [];
  let queued = 0;

  for (const hit of evaluateRules(opts.rules ?? DEFAULT_RULES, locations)) {
    const last = lastEventFor(db, hit.locationId, hit.ruleId);
    const escalated = last ? SEVERITY_RANK[hit.severity] > SEVERITY_RANK[last.severity] : false;
    const cooledDown = last ? now.getTime() - Date.parse(last.created_at) >= COOLDOWN_MS : true;
    if (last && !escalated && !cooledDown) continue;

    const event = insertEvent(db, {
      station_id: hit.locationId,
      rule_id: hit.ruleId,
      metric: hit.metric,
      severity: hit.severity,
      value: hit.value,
      threshold: hit.threshold,
      message_en: hit.messageEn,
      message_bn: hit.messageBn,
      created_at: now.toISOString(),
    });
    newEvents.push(event);

    for (const sub of subscribersFor(db, hit.locationId, hit.severity)) {
      if (sub.channel !== 'sms') continue; // web subscribers receive the live stream instead
      const text = sub.language === 'bn' ? hit.messageBn : hit.messageEn;
      enqueueNotification(db, sub.id, event.id, `FloodGuard ${hit.severity.toUpperCase()}: ${text} Emergency: 999 / 16263.`);
      queued++;
    }
    bus.emit('event', event);
  }

  pruneReadings(db, new Date(now.getTime() - RETENTION_DAYS * 86400000).toISOString());
  return { readings: locations.length, newEvents, queued };
}

/**
 * Seeds ~48h of clearly-labelled demo history (source = 'demo_seed') so the recorded-data
 * forecast works on a fresh install. It is reconstructed from each station's current level
 * and 24h change, so it is NOT observed data and is flagged as such in every API response.
 */
export function seedDemoHistory(db: Db, locations: LocationData[], now = new Date()): number {
  if (countReadings(db).total > 0) return 0;
  const rows: ReadingRow[] = [];
  for (const l of locations) {
    const perHour = l.waterLevelChange24h / 24;
    for (let h = 48; h >= 1; h--) {
      const wobble = Math.sin((h + l.coordinates[0]) * 1.7) * 0.015;
      rows.push({
        station_id: l.id,
        level_m: Number((l.currentWaterLevel - perHour * h + wobble).toFixed(3)),
        rainfall_mm: l.rainfall24h,
        risk_score: l.riskScore,
        source: 'demo_seed',
        recorded_at: new Date(now.getTime() - h * 3600000).toISOString(),
      });
    }
  }
  insertReadings(db, rows);
  return rows.length;
}

/**
 * Optional delivery hook: if NOTIFY_WEBHOOK_URL is set, queued SMS notifications are POSTed
 * there (e.g. to an SMS gateway adapter). Without it they stay in the outbox for a responder
 * to send manually. No messages are ever sent by this server on its own.
 */
export async function flushOutboxToWebhook(db: Db, url: string | undefined, fetchImpl: typeof fetch = fetch): Promise<number> {
  if (!url) return 0;
  const batch = listOutbox(db, 'queued', 50);
  if (batch.length === 0) return 0;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: batch.map((b) => ({ id: b.id, to: b.contact, body: b.body, language: b.language })) }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`webhook status ${res.status}`);
    for (const b of batch) markNotification(db, b.id, 'sent');
    return batch.length;
  } catch (err: any) {
    console.warn('[Ops] Webhook delivery failed; messages remain queued:', err?.message);
    return 0;
  }
}
