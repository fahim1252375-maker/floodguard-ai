/**
 * SQLite persistence for the Operations Center, using Node's built-in `node:sqlite`
 * (no native add-on to compile; requires Node 22.13+).
 */
import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS readings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id  TEXT NOT NULL,
  level_m     REAL NOT NULL,
  rainfall_mm REAL NOT NULL,
  risk_score  INTEGER NOT NULL,
  source      TEXT NOT NULL DEFAULT 'fallback',  -- weather_enriched (live rainfall + demo stage) | fallback | demo_seed
  recorded_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_readings_station_time ON readings(station_id, recorded_at);
-- Earlier builds labelled readings 'live' whenever the weather API was live, even though
-- water levels were demo inputs. Preserve the data while correcting its provenance.
UPDATE readings SET source = 'weather_enriched' WHERE source = 'live';

CREATE TABLE IF NOT EXISTS alert_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id  TEXT NOT NULL,
  rule_id     TEXT NOT NULL,
  metric      TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('watch','warning','emergency')),
  value       REAL NOT NULL,
  threshold   REAL NOT NULL,
  message_en  TEXT NOT NULL,
  message_bn  TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  acknowledged_at TEXT,
  acknowledged_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_station_rule ON alert_events(station_id, rule_id, created_at);

CREATE TABLE IF NOT EXISTS subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  token       TEXT NOT NULL UNIQUE,
  location_id TEXT NOT NULL,
  channel     TEXT NOT NULL CHECK (channel IN ('web','sms')),
  contact     TEXT,
  language    TEXT NOT NULL CHECK (language IN ('en','bn')),
  min_severity TEXT NOT NULL CHECK (min_severity IN ('watch','warning','emergency')),
  consent_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  event_id      INTEGER NOT NULL REFERENCES alert_events(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  created_at    TEXT NOT NULL,
  sent_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

CREATE TABLE IF NOT EXISTS checkins (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  token       TEXT NOT NULL UNIQUE,
  location_id TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('safe','need_help','evacuating')),
  people      INTEGER NOT NULL CHECK (people BETWEEN 1 AND 50),
  note        TEXT,
  contact     TEXT,
  consent_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  resolved_at TEXT,
  resolved_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_checkins_loc ON checkins(location_id, created_at);

CREATE TABLE IF NOT EXISTS sitreps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  language   TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS station_thresholds (
  station_id TEXT PRIMARY KEY,
  warning_level REAL NOT NULL,
  danger_level REAL NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TEXT NOT NULL
);
`;

export function openDb(file: string): Db {
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}
