/** Data-access layer. Every query is parameterised; no string-built SQL. */
import crypto from 'crypto';
import type { Db } from './db';

export type Severity = 'watch' | 'warning' | 'emergency';
export const SEVERITY_RANK: Record<Severity, number> = { watch: 1, warning: 2, emergency: 3 };

const nowIso = () => new Date().toISOString();
const newToken = () => crypto.randomBytes(18).toString('hex');


// ---------------- station threshold calibration ----------------
export interface StationThresholdRow {
  station_id: string;
  warning_level: number;
  danger_level: number;
  updated_at: string;
  updated_by: string;
}

export function getStationThreshold(db: Db, stationId: string): StationThresholdRow | undefined {
  return db.prepare('SELECT station_id, warning_level, danger_level, updated_at, updated_by FROM station_thresholds WHERE station_id = ?').get(stationId) as StationThresholdRow | undefined;
}

export function listStationThresholds(db: Db): StationThresholdRow[] {
  return db.prepare('SELECT station_id, warning_level, danger_level, updated_at, updated_by FROM station_thresholds ORDER BY station_id').all() as unknown as StationThresholdRow[];
}

export function saveStationThreshold(db: Db, stationId: string, warningLevel: number, dangerLevel: number, actor: string): StationThresholdRow {
  const updatedAt = nowIso();
  db.prepare(`INSERT INTO station_thresholds (station_id, warning_level, danger_level, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(station_id) DO UPDATE SET warning_level = excluded.warning_level, danger_level = excluded.danger_level, updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
    .run(stationId, warningLevel, dangerLevel, updatedAt, actor);
  return getStationThreshold(db, stationId)!;
}

// ---------------- readings ----------------
export interface ReadingRow {
  station_id: string;
  level_m: number;
  rainfall_mm: number;
  risk_score: number;
  source: 'weather_enriched' | 'fallback' | 'demo_seed';
  recorded_at?: string;
}

export function insertReadings(db: Db, rows: ReadingRow[]): void {
  const stmt = db.prepare(
    'INSERT INTO readings (station_id, level_m, rainfall_mm, risk_score, source, recorded_at) VALUES (?,?,?,?,?,?)'
  );
  db.exec('BEGIN');
  try {
    for (const r of rows) {
      stmt.run(r.station_id, r.level_m, r.rainfall_mm, r.risk_score, r.source, r.recorded_at ?? nowIso());
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function countReadings(db: Db): { total: number; since: string | null } {
  const r = db.prepare('SELECT COUNT(*) AS n, MIN(recorded_at) AS since FROM readings').get() as any;
  return { total: Number(r.n), since: r.since ?? null };
}

export function getReadings(db: Db, stationId: string, sinceIso: string, limit = 500) {
  return db
    .prepare(
      'SELECT level_m, rainfall_mm, risk_score, source, recorded_at FROM readings WHERE station_id = ? AND recorded_at >= ? ORDER BY recorded_at ASC LIMIT ?'
    )
    .all(stationId, sinceIso, limit) as {
    level_m: number;
    rainfall_mm: number;
    risk_score: number;
    source: string;
    recorded_at: string;
  }[];
}

/** One reading per clock hour (the latest in that hour), oldest first. */
export function hourlySeries(db: Db, stationId: string, sinceIso: string) {
  return db
    .prepare(
      `SELECT level_m, MAX(recorded_at) AS recorded_at, source
         FROM readings
        WHERE station_id = ? AND recorded_at >= ?
        GROUP BY strftime('%Y-%m-%d %H', recorded_at)
        ORDER BY recorded_at ASC`
    )
    .all(stationId, sinceIso) as { level_m: number; recorded_at: string; source: string }[];
}

export function pruneReadings(db: Db, olderThanIso: string): number {
  return Number(db.prepare('DELETE FROM readings WHERE recorded_at < ?').run(olderThanIso).changes);
}

// ---------------- alert events ----------------
export interface EventInput {
  station_id: string;
  rule_id: string;
  metric: string;
  severity: Severity;
  value: number;
  threshold: number;
  message_en: string;
  message_bn: string;
  created_at?: string;
}
export interface EventRow extends Required<Omit<EventInput, 'created_at'>> {
  id: number;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

export function insertEvent(db: Db, e: EventInput): EventRow {
  const created = e.created_at ?? nowIso();
  const res = db
    .prepare(
      'INSERT INTO alert_events (station_id, rule_id, metric, severity, value, threshold, message_en, message_bn, created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    )
    .run(e.station_id, e.rule_id, e.metric, e.severity, e.value, e.threshold, e.message_en, e.message_bn, created);
  return getEvent(db, Number(res.lastInsertRowid))!;
}

export function getEvent(db: Db, id: number): EventRow | undefined {
  return db.prepare('SELECT * FROM alert_events WHERE id = ?').get(id) as unknown as EventRow | undefined;
}

export function lastEventFor(db: Db, stationId: string, ruleId: string): EventRow | undefined {
  return db
    .prepare('SELECT * FROM alert_events WHERE station_id = ? AND rule_id = ? ORDER BY created_at DESC, id DESC LIMIT 1')
    .get(stationId, ruleId) as unknown as EventRow | undefined;
}

export function listEvents(db: Db, limit = 50): EventRow[] {
  return db
    .prepare('SELECT * FROM alert_events ORDER BY created_at DESC, id DESC LIMIT ?')
    .all(Math.min(Math.max(1, limit), 200)) as unknown as EventRow[];
}

export function acknowledgeEvent(db: Db, id: number, actor: string): boolean {
  return (
    Number(
      db
        .prepare('UPDATE alert_events SET acknowledged_at = ?, acknowledged_by = ? WHERE id = ? AND acknowledged_at IS NULL')
        .run(nowIso(), actor, id).changes
    ) > 0
  );
}

// ---------------- subscribers & outbox ----------------
export interface SubscriberInput {
  location_id: string;
  channel: 'web' | 'sms';
  contact: string | null;
  language: 'en' | 'bn';
  min_severity: Severity;
}
export interface SubscriberRow extends SubscriberInput {
  id: number;
  token: string;
  consent_at: string;
  created_at: string;
}

export function createSubscriber(db: Db, s: SubscriberInput): SubscriberRow {
  const token = newToken();
  const ts = nowIso();
  const res = db
    .prepare(
      'INSERT INTO subscribers (token, location_id, channel, contact, language, min_severity, consent_at, created_at) VALUES (?,?,?,?,?,?,?,?)'
    )
    .run(token, s.location_id, s.channel, s.contact, s.language, s.min_severity, ts, ts);
  return db.prepare('SELECT * FROM subscribers WHERE id = ?').get(Number(res.lastInsertRowid)) as unknown as SubscriberRow;
}

export function getSubscriberByToken(db: Db, token: string): SubscriberRow | undefined {
  return db.prepare('SELECT * FROM subscribers WHERE token = ?').get(token) as unknown as SubscriberRow | undefined;
}

/** Deletes the subscriber and (via ON DELETE CASCADE) its queued notifications. */
export function deleteSubscriberByToken(db: Db, token: string): boolean {
  return Number(db.prepare('DELETE FROM subscribers WHERE token = ?').run(token).changes) > 0;
}

export function subscribersFor(db: Db, locationId: string, severity: Severity): SubscriberRow[] {
  const rows = db.prepare('SELECT * FROM subscribers WHERE location_id = ?').all(locationId) as unknown as SubscriberRow[];
  return rows.filter((r) => SEVERITY_RANK[severity] >= SEVERITY_RANK[r.min_severity]);
}

export function subscriberCounts(db: Db) {
  return db
    .prepare('SELECT location_id, channel, COUNT(*) AS n FROM subscribers GROUP BY location_id, channel')
    .all() as { location_id: string; channel: string; n: number }[];
}

export function enqueueNotification(db: Db, subscriberId: number, eventId: number, body: string): void {
  db.prepare('INSERT INTO notifications (subscriber_id, event_id, body, created_at) VALUES (?,?,?,?)').run(
    subscriberId,
    eventId,
    body,
    nowIso()
  );
}

export function listOutbox(db: Db, status: 'queued' | 'sent' | 'failed' = 'queued', limit = 100) {
  return db
    .prepare(
      `SELECT n.id, n.body, n.status, n.created_at, n.sent_at, s.channel, s.contact, s.location_id, s.language
         FROM notifications n JOIN subscribers s ON s.id = n.subscriber_id
        WHERE n.status = ? ORDER BY n.id ASC LIMIT ?`
    )
    .all(status, limit) as {
    id: number;
    body: string;
    status: string;
    created_at: string;
    sent_at: string | null;
    channel: string;
    contact: string | null;
    location_id: string;
    language: string;
  }[];
}

export function markNotification(db: Db, id: number, status: 'sent' | 'failed'): boolean {
  return (
    Number(
      db.prepare('UPDATE notifications SET status = ?, sent_at = ? WHERE id = ? AND status = ?').run(
        status,
        nowIso(),
        id,
        'queued'
      ).changes
    ) > 0
  );
}

// ---------------- check-ins ----------------
export interface CheckinInput {
  location_id: string;
  status: 'safe' | 'need_help' | 'evacuating';
  people: number;
  note: string | null;
  contact: string | null;
}

export function createCheckin(db: Db, c: CheckinInput) {
  const token = newToken();
  const ts = nowIso();
  const res = db
    .prepare(
      'INSERT INTO checkins (token, location_id, status, people, note, contact, consent_at, created_at) VALUES (?,?,?,?,?,?,?,?)'
    )
    .run(token, c.location_id, c.status, c.people, c.note, c.contact, ts, ts);
  return { id: Number(res.lastInsertRowid), token, created_at: ts };
}

/** Public aggregate: only unresolved check-ins from the last `hours` hours; never contact or notes. */
export function checkinSummary(db: Db, sinceIso: string) {
  const rows = db
    .prepare(
      `SELECT location_id, status, COUNT(*) AS reports, SUM(people) AS people, MAX(created_at) AS latest
         FROM checkins WHERE resolved_at IS NULL AND created_at >= ?
        GROUP BY location_id, status`
    )
    .all(sinceIso) as { location_id: string; status: string; reports: number; people: number; latest: string }[];
  return rows.map((r) => ({ ...r, reports: Number(r.reports), people: Number(r.people) }));
}

export function listCheckinsAdmin(db: Db, sinceIso: string, limit = 200) {
  return db
    .prepare(
      `SELECT id, location_id, status, people, note, contact, created_at, resolved_at, resolved_by
         FROM checkins WHERE created_at >= ?
        ORDER BY (resolved_at IS NULL) DESC, (status = 'need_help') DESC, created_at DESC LIMIT ?`
    )
    .all(sinceIso, limit) as any[];
}

export function resolveCheckinById(db: Db, id: number, actor: string): boolean {
  return (
    Number(
      db.prepare('UPDATE checkins SET resolved_at = ?, resolved_by = ? WHERE id = ? AND resolved_at IS NULL').run(
        nowIso(),
        actor,
        id
      ).changes
    ) > 0
  );
}

export function resolveCheckinByToken(db: Db, token: string): boolean {
  return (
    Number(
      db.prepare("UPDATE checkins SET resolved_at = ?, resolved_by = 'self' WHERE token = ? AND resolved_at IS NULL").run(
        nowIso(),
        token
      ).changes
    ) > 0
  );
}

/** Removes the person's own check-in (right to erasure). */
export function deleteCheckinByToken(db: Db, token: string): boolean {
  return Number(db.prepare('DELETE FROM checkins WHERE token = ?').run(token).changes) > 0;
}

// ---------------- sitreps & audit ----------------
export function saveSitrep(db: Db, language: string, body: string, actor: string) {
  const res = db
    .prepare('INSERT INTO sitreps (language, body, created_by, created_at) VALUES (?,?,?,?)')
    .run(language, body, actor, nowIso());
  return Number(res.lastInsertRowid);
}

export function listSitreps(db: Db, limit = 20) {
  return db
    .prepare('SELECT id, language, body, created_by, created_at FROM sitreps ORDER BY id DESC LIMIT ?')
    .all(limit) as { id: number; language: string; body: string; created_by: string; created_at: string }[];
}

export function audit(db: Db, actor: string, action: string, detail?: string): void {
  db.prepare('INSERT INTO audit_log (actor, action, detail, created_at) VALUES (?,?,?,?)').run(
    actor,
    action,
    detail ?? null,
    nowIso()
  );
}

export function listAudit(db: Db, limit = 50) {
  return db.prepare('SELECT id, actor, action, detail, created_at FROM audit_log ORDER BY id DESC LIMIT ?').all(limit) as {
    id: number;
    actor: string;
    action: string;
    detail: string | null;
    created_at: string;
  }[];
}
