/** Strict whitelist validation for public write endpoints. */
import type { CheckinInput, SubscriberInput, Severity } from './repo';

const PHONE_RE = /^[+0-9()\-\s]{6,20}$/;
const CHECKIN_STATUS = ['safe', 'need_help', 'evacuating'] as const;
const SEVERITIES: Severity[] = ['watch', 'warning', 'emergency'];

// Both fields exist on both branches so access type-checks even without strictNullChecks narrowing.
type Result<T> = { ok: true; value: T; error?: undefined } | { ok: false; error: string; value?: undefined };

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

export function validateCheckin(body: any, knownLocationIds: string[]): Result<CheckinInput> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body.' };
  if (!knownLocationIds.includes(body.locationId)) return { ok: false, error: 'Unknown area.' };
  if (!CHECKIN_STATUS.includes(body.status)) return { ok: false, error: 'Status must be safe, need_help or evacuating.' };
  const people = Number(body.people);
  if (!Number.isInteger(people) || people < 1 || people > 50) {
    return { ok: false, error: 'People must be a whole number from 1 to 50.' };
  }
  const contact = clean(body.contact, 20);
  if (contact && !PHONE_RE.test(contact)) return { ok: false, error: 'Contact number looks invalid.' };
  if (body.consent !== true) return { ok: false, error: 'Consent to share this check-in is required.' };
  return {
    ok: true,
    value: {
      location_id: body.locationId,
      status: body.status,
      people,
      note: clean(body.note, 280) || null,
      contact: contact || null,
    },
  };
}

export function validateSubscriber(body: any, knownLocationIds: string[]): Result<SubscriberInput> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body.' };
  if (!knownLocationIds.includes(body.locationId)) return { ok: false, error: 'Unknown area.' };
  const channel = body.channel === 'sms' ? 'sms' : body.channel === 'web' ? 'web' : null;
  if (!channel) return { ok: false, error: 'Channel must be web or sms.' };
  const language = body.language === 'bn' ? 'bn' : 'en';
  const min = SEVERITIES.includes(body.minSeverity) ? (body.minSeverity as Severity) : 'warning';
  const contact = clean(body.contact, 20);
  if (channel === 'sms' && !PHONE_RE.test(contact)) return { ok: false, error: 'A valid phone number is required for SMS alerts.' };
  if (body.consent !== true) return { ok: false, error: 'Consent to receive alerts is required.' };
  return {
    ok: true,
    value: {
      location_id: body.locationId,
      channel,
      contact: channel === 'sms' ? contact : null,
      language,
      min_severity: min,
    },
  };
}

export const maskContact = (c: string | null): string | null =>
  c ? `${c.slice(0, 3)}${'*'.repeat(Math.max(0, c.length - 5))}${c.slice(-2)}` : null;
