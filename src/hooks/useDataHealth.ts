import { useState, useEffect, useCallback } from 'react';
import { LiveWeatherPayload } from '../utils/weatherTransform';
import { LiveRiverPayload } from '../utils/riverDischarge';

export type HealthStatus = 'loading' | 'live' | 'stale' | 'offline' | 'simulated';
export type OverallHealth = 'all_live' | 'partial' | 'offline';

export interface DataSourceItem {
  id: string;
  nameEn: string;
  nameBn: string;
  endpoint: string;
  type: 'live_api' | 'simulated_benchmark';
  status: HealthStatus;
  lastSynced: Date | null;
  detailsEn: string;
  detailsBn: string;
  provenance: 'LIVE' | 'STALE' | 'SIMULATED' | 'OFFLINE' | 'LOADING';
}

export interface DataHealthState {
  overall: OverallHealth;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  cherrapunjiRainfall24h: number | null;
  past24hTotalMm: number | null;
  next24hTotalMm: number | null;
  daily7Days: number[];
  source: string | null;
  fetchedAt: string | null;
  sources: DataSourceItem[];
  refresh: () => Promise<void>;
}

// Cache freshness thresholds (weather cached 10m on server, river 30m)
export const WEATHER_STALE_MS = 12 * 60 * 1000;
export const RIVER_STALE_MS = 35 * 60 * 1000;

/**
 * Pure function to derive source status from raw API response attributes and elapsed time
 */
export function deriveSourceStatus(params: {
  hasError: boolean;
  isLive?: boolean;
  source?: string;
  lastSynced: Date | null;
  staleThresholdMs: number;
  nowMs?: number;
}): HealthStatus {
  const { hasError, isLive, source, lastSynced, staleThresholdMs, nowMs = Date.now() } = params;

  if (hasError) {
    return 'offline';
  }

  if (lastSynced === null) {
    return 'loading';
  }

  if (source === 'SIMULATED_FALLBACK' || isLive === false) {
    return 'simulated';
  }

  if (nowMs - lastSynced.getTime() > staleThresholdMs) {
    return 'stale';
  }

  return 'live';
}

/**
 * Pure function to derive overall system health strictly from live API feeds.
 * Simulated benchmarks (e.g. station gauge calibration) MUST NOT determine live API health.
 */
export function deriveOverall(sources: Array<{ status: HealthStatus; type: 'live_api' | 'simulated_benchmark' }>): OverallHealth {
  const liveApiSources = sources.filter((s) => s.type === 'live_api');
  if (liveApiSources.length === 0) return 'partial';

  const allOffline = liveApiSources.every((s) => s.status === 'offline');
  if (allOffline) return 'offline';

  const allLive = liveApiSources.every((s) => s.status === 'live');
  if (allLive) return 'all_live';

  return 'partial';
}

export function useDataHealth(): DataHealthState {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initial rainfall must be null (never default to 184.2!)
  const [cherrapunjiRainfall24h, setCherrapunjiRainfall24h] = useState<number | null>(null);
  const [past24hTotalMm, setPast24hTotalMm] = useState<number | null>(null);
  const [next24hTotalMm, setNext24hTotalMm] = useState<number | null>(null);
  const [daily7Days, setDaily7Days] = useState<number[]>([]);
  const [weatherSource, setWeatherSource] = useState<string | null>(null);
  const [weatherFetchedAt, setWeatherFetchedAt] = useState<string | null>(null);

  // Initial status must be loading and lastSynced must be null
  const [weatherStatus, setWeatherStatus] = useState<HealthStatus>('loading');
  const [weatherLastSync, setWeatherLastSync] = useState<Date | null>(null);
  const [weatherIsLive, setWeatherIsLive] = useState<boolean | undefined>(undefined);

  const [riverStatus, setRiverStatus] = useState<HealthStatus>('loading');
  const [riverLastSync, setRiverLastSync] = useState<Date | null>(null);
  const [riverIsLive, setRiverIsLive] = useState<boolean | undefined>(undefined);
  const [riverSource, setRiverSource] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsRefreshing(true);
    const now = new Date();

    // 1. Fetch live weather
    try {
      const res = await fetch('/api/weather/live');
      if (res.ok) {
        const data: LiveWeatherPayload = await res.json();
        const syncDate = data.fetchedAt ? new Date(data.fetchedAt) : now;
        setWeatherLastSync(syncDate);
        setWeatherIsLive(data.isLive);
        setWeatherSource(data.source || (data.isLive ? 'OPEN_METEO_API' : 'SIMULATED_FALLBACK'));
        setWeatherFetchedAt(data.fetchedAt || syncDate.toISOString());

        const derived = deriveSourceStatus({
          hasError: false,
          isLive: data.isLive,
          source: data.source,
          lastSynced: syncDate,
          staleThresholdMs: WEATHER_STALE_MS,
          nowMs: Date.now(),
        });
        setWeatherStatus(derived);

        if (data.regions?.cherrapunji?.past24hTotalMm != null) {
          setCherrapunjiRainfall24h(data.regions.cherrapunji.past24hTotalMm);
          setPast24hTotalMm(data.regions.cherrapunji.past24hTotalMm);
        }
        if (data.regions?.cherrapunji?.next24hTotalMm != null) {
          setNext24hTotalMm(data.regions.cherrapunji.next24hTotalMm);
        }
        if (Array.isArray(data.regions?.cherrapunji?.daily7Days)) {
          setDaily7Days(data.regions.cherrapunji.daily7Days.map((d) => d.precipitationMm));
        }
      } else {
        setWeatherStatus('offline');
      }
    } catch {
      setWeatherStatus('offline');
    }

    // 2. Fetch live river discharge
    try {
      const res = await fetch('/api/river/live');
      if (res.ok) {
        const data: LiveRiverPayload = await res.json();
        const syncDate = data.fetchedAt ? new Date(data.fetchedAt) : now;
        setRiverLastSync(syncDate);
        setRiverIsLive(data.isLive);
        setRiverSource(data.source || (data.isLive ? 'OPEN_METEO_GLOFAS' : 'SIMULATED_FALLBACK'));

        const derived = deriveSourceStatus({
          hasError: false,
          isLive: data.isLive,
          source: data.source,
          lastSynced: syncDate,
          staleThresholdMs: RIVER_STALE_MS,
          nowMs: Date.now(),
        });
        setRiverStatus(derived);
      } else {
        setRiverStatus('offline');
      }
    } catch {
      setRiverStatus('offline');
    }

    setLastUpdated(now);
    setIsRefreshing(false);
  }, []);

  // Poll every 5 minutes and on window focus
  useEffect(() => {
    fetchHealth();

    const interval = setInterval(fetchHealth, 5 * 60 * 1000);

    const onFocus = () => {
      fetchHealth();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchHealth]);

  // Recalculate effective statuses based on elapsed time
  const nowMs = Date.now();
  const effectiveWeatherStatus: HealthStatus = deriveSourceStatus({
    hasError: weatherStatus === 'offline',
    isLive: weatherIsLive,
    source: weatherSource || undefined,
    lastSynced: weatherLastSync,
    staleThresholdMs: WEATHER_STALE_MS,
    nowMs,
  });

  const effectiveRiverStatus: HealthStatus = deriveSourceStatus({
    hasError: riverStatus === 'offline',
    isLive: riverIsLive,
    source: riverSource || undefined,
    lastSynced: riverLastSync,
    staleThresholdMs: RIVER_STALE_MS,
    nowMs,
  });

  const sources: DataSourceItem[] = [
    {
      id: 'open-meteo-weather',
      nameEn: 'Open-Meteo Weather API',
      nameBn: 'ওপেন-মেটিও আবহাওয়া এপিআই',
      endpoint: '/api/weather/live',
      type: 'live_api',
      status: effectiveWeatherStatus,
      lastSynced: weatherLastSync,
      detailsEn: 'Hourly precipitation & 7-day forecast for Sylhet, Sunamganj, Cherrapunji',
      detailsBn: 'সিলেট, সুনামগঞ্জ ও চেরাপুঞ্জির ঘণ্টার বৃষ্টিপাত ও ৭ দিনের পূর্বাভাস',
      provenance:
        effectiveWeatherStatus === 'live'
          ? 'LIVE'
          : effectiveWeatherStatus === 'stale'
          ? 'STALE'
          : effectiveWeatherStatus === 'simulated'
          ? 'SIMULATED'
          : effectiveWeatherStatus === 'loading'
          ? 'LOADING'
          : 'OFFLINE',
    },
    {
      id: 'open-meteo-flood',
      nameEn: 'Open-Meteo GloFAS Flood API',
      nameBn: 'ওপেন-মেটিও গ্লোফাস প্লাবন এপিআই',
      endpoint: '/api/river/live',
      type: 'live_api',
      status: effectiveRiverStatus,
      lastSynced: riverLastSync,
      detailsEn: 'Real daily river discharge and seasonal mean ratios for Surma basin',
      detailsBn: 'সুরমা অববাহিকার নদী প্রবাহ ও মৌসুমি গড়ের তুলনা',
      provenance:
        effectiveRiverStatus === 'live'
          ? 'LIVE'
          : effectiveRiverStatus === 'stale'
          ? 'STALE'
          : effectiveRiverStatus === 'simulated'
          ? 'SIMULATED'
          : effectiveRiverStatus === 'loading'
          ? 'LOADING'
          : 'OFFLINE',
    },
    {
      id: 'bwdb-gauges',
      nameEn: 'BWDB Hydrological Gauges',
      nameBn: 'পানি উন্নয়ন বোর্ড রিভার গেজ',
      endpoint: 'Local telemetry engine',
      type: 'simulated_benchmark',
      // Station gauge row MUST be simulated, never green LIVE
      status: 'simulated',
      lastSynced: lastUpdated,
      detailsEn: 'Calibrated to official 2022/2024 BWDB station danger & warning marks',
      detailsBn: '২০২২/২০২৪ সালের পাউবো বিপদসীমা ও সতর্কসীমার ভিত্তিতে ক্যালিব্রেটেড',
      provenance: 'SIMULATED',
    },
  ];

  const overall = deriveOverall(sources);

  return {
    overall,
    isRefreshing,
    lastUpdated,
    cherrapunjiRainfall24h,
    past24hTotalMm,
    next24hTotalMm,
    daily7Days,
    source: weatherSource,
    fetchedAt: weatherFetchedAt,
    sources,
    refresh: fetchHealth,
  };
}
