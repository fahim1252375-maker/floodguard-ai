import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckinSummary, OpsEvent, opsApi } from '../utils/opsApi';

export interface OpsLive {
  online: boolean; // backend reachable
  streaming: boolean; // SSE connected
  events: OpsEvent[];
  checkins: CheckinSummary;
  readingsTotal: number;
  since: string | null;
  latestNew: OpsEvent | null; // most recent event pushed over the stream
  refresh: () => Promise<void>;
}

/** Loads backend state once, then keeps it fresh through a Server-Sent Events stream. */
export function useOpsLive(): OpsLive {
  const [online, setOnline] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [events, setEvents] = useState<OpsEvent[]>([]);
  const [checkins, setCheckins] = useState<CheckinSummary>({});
  const [readingsTotal, setReadingsTotal] = useState(0);
  const [since, setSince] = useState<string | null>(null);
  const [latestNew, setLatestNew] = useState<OpsEvent | null>(null);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [ov, ev] = await Promise.all([opsApi.overview(), opsApi.events(40)]);
      if (!alive.current) return;
      setOnline(true);
      setEvents(ev.events);
      setCheckins(ov.checkins);
      setReadingsTotal(ov.readings.total);
      setSince(ov.readings.since);
    } catch {
      if (alive.current) setOnline(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    refresh();
    const poll = setInterval(refresh, 60000); // safety net if the stream is blocked by a proxy
    let source: EventSource | null = null;
    if (typeof EventSource !== 'undefined') {
      source = new EventSource('/api/ops/stream');
      source.addEventListener('hello', () => setStreaming(true));
      source.addEventListener('alert', (e) => {
        try {
          const ev = JSON.parse((e as MessageEvent).data) as OpsEvent;
          setEvents((prev) => [ev, ...prev.filter((p) => p.id !== ev.id)].slice(0, 60));
          setLatestNew(ev);
        } catch {
          /* ignore malformed frame */
        }
      });
      source.addEventListener('checkin', (e) => {
        try {
          setCheckins(JSON.parse((e as MessageEvent).data));
        } catch {
          /* ignore */
        }
      });
      source.onerror = () => setStreaming(false);
    }
    return () => {
      alive.current = false;
      clearInterval(poll);
      source?.close();
    };
  }, [refresh]);

  return { online, streaming, events, checkins, readingsTotal, since, latestNew, refresh };
}
