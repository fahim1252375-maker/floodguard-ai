import fs from 'fs';
import path from 'path';
import { CommunityReport, AlertItem } from '../types';
import { INITIAL_REPORTS, INITIAL_ALERTS } from '../data/mockData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');

// Writes to a given JSON file are serialized to avoid concurrent atomic-renames
// reordering two submissions made close together.
const writeQueues = new Map<string, Promise<void>>();

// In-memory rate limiting map: ip -> array of timestamps (ms)
const ipReportTimestamps = new Map<string, number[]>();
export const RATE_LIMIT_MAX_REPORTS = 5;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Ensures the data directory exists
 */
export function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Writes data atomically to target JSON file via a temporary file and rename
 */
export async function writeAtomicJson(filePath: string, data: unknown): Promise<void> {
  ensureDataDirectory();
  const previous = writeQueues.get(filePath) ?? Promise.resolve();
  const nextWrite = previous.catch(() => undefined).then(async () => {
    const tempPath = `${filePath}.tmp.${process.pid}.${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const jsonContent = JSON.stringify(data, null, 2);
    try {
      await fs.promises.writeFile(tempPath, jsonContent, 'utf-8');
      await fs.promises.rename(tempPath, filePath);
    } catch (error) {
      await fs.promises.rm(tempPath, { force: true }).catch(() => undefined);
      throw error;
    }
  }).finally(() => {
    if (writeQueues.get(filePath) === nextWrite) writeQueues.delete(filePath);
  });
  writeQueues.set(filePath, nextWrite);
  await nextWrite;
}

const SEED_FILE = path.join(DATA_DIR, 'seed.example.json');

/**
 * Loads reports from disk or initializes with seed.example.json
 */
export async function loadReports(): Promise<CommunityReport[]> {
  ensureDataDirectory();
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const raw = await fs.promises.readFile(REPORTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading reports.json, using defaults:', err);
  }

  // Load from clean seed.example.json if present
  try {
    if (fs.existsSync(SEED_FILE)) {
      const rawSeed = await fs.promises.readFile(SEED_FILE, 'utf-8');
      const parsedSeed = JSON.parse(rawSeed);
      if (Array.isArray(parsedSeed) && parsedSeed.length > 0) {
        await writeAtomicJson(REPORTS_FILE, parsedSeed);
        return parsedSeed;
      }
    }
  } catch (seedErr) {
    console.warn('Error reading seed.example.json:', seedErr);
  }

  // Seed default reports
  await writeAtomicJson(REPORTS_FILE, INITIAL_REPORTS);
  return [...INITIAL_REPORTS];
}

/**
 * Saves reports to disk atomically
 */
export async function saveReports(reports: CommunityReport[]): Promise<void> {
  await writeAtomicJson(REPORTS_FILE, reports);
}

/**
 * Loads alerts from disk or initializes with initial mock data
 */
export async function loadAlerts(): Promise<AlertItem[]> {
  ensureDataDirectory();
  try {
    if (fs.existsSync(ALERTS_FILE)) {
      const raw = await fs.promises.readFile(ALERTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading alerts.json, using defaults:', err);
  }

  // Seed default alerts
  await writeAtomicJson(ALERTS_FILE, INITIAL_ALERTS);
  return [...INITIAL_ALERTS];
}

/**
 * Saves alerts to disk atomically
 */
export async function saveAlerts(alerts: AlertItem[]): Promise<void> {
  await writeAtomicJson(ALERTS_FILE, alerts);
}

const REPORT_DISTRICTS = ['Sylhet', 'Sunamganj'] as const;
const WATER_TRENDS = ['rapidly_rising', 'slowly_rising', 'stable', 'receding'] as const;
const ROAD_CONDITIONS = ['passable', 'waterlogged', 'inundated', 'completely_submerged'] as const;
const ELECTRICITY_STATUSES = ['normal', 'intermittent', 'cut_off'] as const;
const DEPTH_UNITS = ['ft', 'cm'] as const;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Trims, strips control characters and angle brackets, and caps length.
 * Non-strings become an empty string.
 */
export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS, '').replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function oneOf<T extends readonly string[]>(list: T, value: unknown): value is T[number] {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

function isHttpsUrl(value: unknown, maxLength: number): value is string {
  if (typeof value !== 'string' || value.length > maxLength) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates a community report submission against the shape the form actually sends.
 * Consent is mandatory because reports can include a name and a contact number.
 */
export function validateReportInput(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid report data payload.' };
  }

  if (data.consent !== true) {
    return { valid: false, error: 'Consent is required: please confirm you agree to the report being stored for verification.' };
  }

  const reporterName = cleanText(data.reporterName, 200);
  if (reporterName.length < 2 || reporterName.length > 80) {
    return { valid: false, error: 'Reporter name must be between 2 and 80 characters.' };
  }

  const villageOrArea = cleanText(data.villageOrArea, 200);
  if (villageOrArea.length < 2 || villageOrArea.length > 120) {
    return { valid: false, error: 'Village or area must be between 2 and 120 characters.' };
  }

  const description = cleanText(data.description, 5000);
  if (description.length < 5 || description.length > 600) {
    return { valid: false, error: 'Description must be between 5 and 600 characters.' };
  }

  if (!oneOf(REPORT_DISTRICTS, data.district)) {
    return { valid: false, error: 'District must be Sylhet or Sunamganj.' };
  }

  const upazila = cleanText(data.upazilaEn, 200);
  if (upazila.length < 2 || upazila.length > 60) {
    return { valid: false, error: 'A valid Upazila selection is required.' };
  }

  if (!oneOf(DEPTH_UNITS, data.waterDepthUnit)) {
    return { valid: false, error: 'Water depth unit must be "ft" or "cm".' };
  }

  const maxDepth = data.waterDepthUnit === 'cm' ? 1200 : 40;
  if (typeof data.waterDepthValue !== 'number' || !Number.isFinite(data.waterDepthValue) || data.waterDepthValue < 0 || data.waterDepthValue > maxDepth) {
    return { valid: false, error: `Water depth must be a number between 0 and ${maxDepth} ${data.waterDepthUnit}.` };
  }

  if (!oneOf(WATER_TRENDS, data.waterTrend)) {
    return { valid: false, error: 'Invalid water trend value.' };
  }
  if (!oneOf(ROAD_CONDITIONS, data.roadCondition)) {
    return { valid: false, error: 'Invalid road condition value.' };
  }
  if (!oneOf(ELECTRICITY_STATUSES, data.electricityStatus)) {
    return { valid: false, error: 'Invalid electricity status value.' };
  }

  if (data.phoneOrContact !== undefined && data.phoneOrContact !== null && data.phoneOrContact !== '') {
    if (typeof data.phoneOrContact !== 'string' || cleanText(data.phoneOrContact, 500).length > 60) {
      return { valid: false, error: 'Contact must be at most 60 characters.' };
    }
  }

  if (data.photoUrl !== undefined && data.photoUrl !== null && data.photoUrl !== '' && !isHttpsUrl(data.photoUrl, 500)) {
    return { valid: false, error: 'Photo URL must be an https link of at most 500 characters.' };
  }

  return { valid: true };
}

/**
 * Builds the stored report from a validated payload using an explicit whitelist,
 * so unexpected client fields (status, verifiedBy, ...) can never be persisted.
 * Call validateReportInput first.
 */
export function sanitizeReportInput(data: any): Omit<CommunityReport, 'id' | 'timestamp' | 'status'> {
  const upazilaEn = cleanText(data.upazilaEn, 60);
  const phone = cleanText(data.phoneOrContact, 60);
  const photoUrl = isHttpsUrl(data.photoUrl, 500) ? data.photoUrl : undefined;

  return {
    reporterName: cleanText(data.reporterName, 80),
    ...(phone ? { phoneOrContact: phone } : {}),
    district: data.district,
    upazilaEn,
    upazilaBn: cleanText(data.upazilaBn, 60) || upazilaEn,
    villageOrArea: cleanText(data.villageOrArea, 120),
    waterDepthValue: data.waterDepthValue,
    waterDepthUnit: data.waterDepthUnit,
    waterTrend: data.waterTrend,
    roadCondition: data.roadCondition,
    electricityStatus: data.electricityStatus,
    description: cleanText(data.description, 600),
    ...(photoUrl ? { photoUrl } : {}),
    consentedAt: new Date().toISOString(),
  };
}

/**
 * Public view of a report: the reporter's contact number is never returned by the public API.
 */
export function toPublicReport(report: CommunityReport): Omit<CommunityReport, 'phoneOrContact'> {
  const { phoneOrContact: _omitted, ...rest } = report;
  return rest;
}

/**
 * Checks and records rate limit for an IP address
 * Max 5 submissions per 10 minutes
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const cleanIp = ip || 'anonymous';
  const history = ipReportTimestamps.get(cleanIp) || [];

  // Filter out timestamps outside the active window
  const activeWindowTimestamps = history.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (activeWindowTimestamps.length >= RATE_LIMIT_MAX_REPORTS) {
    const oldest = activeWindowTimestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  // Record this attempt
  activeWindowTimestamps.push(now);
  ipReportTimestamps.set(cleanIp, activeWindowTimestamps);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REPORTS - activeWindowTimestamps.length,
  };
}

/**
 * Clears rate limiter (primarily for unit testing)
 */
export function resetRateLimits(): void {
  ipReportTimestamps.clear();
}
