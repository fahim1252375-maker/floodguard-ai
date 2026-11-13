/** Typed client for the /api/ops backend. Every call fails soft so the UI can fall back offline. */

export type Severity = 'watch' | 'warning' | 'emergency';
export const SEVERITY_ORDER: Record<Severity, number> = { watch: 1, warning: 2, emergency: 3 };
export type CheckinStatus = 'safe' | 'need_help' | 'evacuating';

export interface OpsEvent {
  id: number;
  station_id: string;
  rule_id: string;
  metric: string;
  severity: Severity;
  value: number;
  threshold: number;
  message_en: string;
  message_bn: string;
  created_at: string;
  acknowledged_at: string | null;
}

export type CheckinSummary = Record<string, Partial<Record<CheckinStatus, { reports: number; people: number }>> & { latest?: string }>;

export interface OpsOverview {
  ok: boolean;
  readings: { total: number; since: string | null };
  latestEvents: OpsEvent[];
  checkins: CheckinSummary;
}

export interface ServerForecast {
  available: boolean;
  readingsAvailable?: number;
  readingsNeeded?: number;
  basis?: 'recorded_readings';
  includesDemoSeed?: boolean;
  observed?: { at: string; level: number }[];
  dangerLevel?: number;
  result?: import('./ensembleForecast').EnsembleResult | null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit & { token?: string; pin?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...(init.headers as Record<string, string>) };
  if (init.body) headers['Content-Type'] = 'application/json';
  if (init.token) headers['x-ops-token'] = init.token;
  if (init.pin) headers['x-admin-pin'] = init.pin;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`/api/ops${path}`, { ...init, headers, signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, (data as any)?.error || `Request failed (${res.status})`);
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

export const opsApi = {
  overview: () => request<OpsOverview>('/overview'),
  events: (limit = 30) => request<{ events: OpsEvent[] }>(`/events?limit=${limit}`),
  forecast: (stationId: string, horizon: number) =>
    request<ServerForecast>(`/forecast/${encodeURIComponent(stationId)}?horizon=${horizon}`),
  checkinSummary: () => request<{ areas: CheckinSummary }>('/checkins/summary'),
  createCheckin: (body: {
    locationId: string;
    status: CheckinStatus;
    people: number;
    note?: string;
    contact?: string;
    consent: boolean;
  }) => request<{ id: number; token: string }>('/checkins', { method: 'POST', body: JSON.stringify(body) }),
  resolveMyCheckin: (token: string) => request<{ success: boolean }>('/checkins/mine/resolve', { method: 'POST', token }),
  deleteMyCheckin: (token: string) => request<{ success: boolean }>('/checkins/mine', { method: 'DELETE', token }),
  subscribe: (body: {
    locationId: string;
    channel: 'web' | 'sms';
    contact?: string;
    language: 'en' | 'bn';
    minSeverity: Severity;
    consent: boolean;
  }) => request<{ token: string }>('/subscribers', { method: 'POST', body: JSON.stringify(body) }),
  mySubscription: (token: string) =>
    request<{ locationId: string; channel: string; language: string; minSeverity: Severity; contact: string | null }>(
      '/subscribers/me',
      { token }
    ),
  unsubscribe: (token: string) => request<{ success: boolean }>('/subscribers/me', { method: 'DELETE', token }),

  // responder (PIN) endpoints
  adminCheckins: (pin: string) => request<{ checkins: AdminCheckin[] }>('/checkins', { pin }),
  resolveCheckin: (pin: string, id: number) => request('/checkins/' + id + '/resolve', { method: 'POST', pin }),
  outbox: (pin: string) => request<{ queued: OutboxItem[]; webhookConfigured: boolean }>('/outbox', { pin }),
  markSent: (pin: string, id: number) => request('/outbox/' + id + '/sent', { method: 'POST', pin }),
  flushOutbox: (pin: string) => request<{ sent: number }>('/outbox/flush', { method: 'POST', pin }),
  ackEvent: (pin: string, id: number) => request('/events/' + id + '/ack', { method: 'POST', pin }),
  runCycle: (pin: string) => request<{ newEvents: number; queued: number }>('/cycle', { method: 'POST', pin }),
  saveSitrep: (pin: string, body: string, language: 'en' | 'bn') =>
    request<{ id: number }>('/sitreps', { method: 'POST', pin, body: JSON.stringify({ body, language }) }),
  sitreps: (pin: string) =>
    request<{ sitreps: { id: number; language: string; body: string; created_at: string }[] }>('/sitreps', { pin }),
  audit: (pin: string) =>
    request<{ audit: { id: number; actor: string; action: string; detail: string | null; created_at: string }[] }>('/audit', { pin }),
};

export interface AdminCheckin {
  id: number;
  location_id: string;
  status: CheckinStatus;
  people: number;
  note: string | null;
  contact: string | null;
  created_at: string;
  resolved_at: string | null;
}
export interface OutboxItem {
  id: number;
  body: string;
  contact: string | null;
  location_id: string;
  language: string;
  created_at: string;
}

export function timeAgo(iso: string, bn: boolean, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (mins < 1) return bn ? 'এইমাত্র' : 'just now';
  if (mins < 60) return bn ? `${mins} মিনিট আগে` : `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return bn ? `${h} ঘণ্টা আগে` : `${h} h ago`;
  const d = Math.round(h / 24);
  return bn ? `${d} দিন আগে` : `${d} d ago`;
}
