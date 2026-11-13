import { describe, it, expect } from 'vitest';
import {
  deriveSourceStatus,
  deriveOverall,
  WEATHER_STALE_MS,
  RIVER_STALE_MS,
  DataSourceItem,
} from './useDataHealth';

describe('useDataHealth - deriveSourceStatus', () => {
  const baseTime = 1700000000000;

  it('returns offline when hasError is true', () => {
    const status = deriveSourceStatus({
      hasError: true,
      isLive: true,
      lastSynced: new Date(baseTime),
      staleThresholdMs: WEATHER_STALE_MS,
      nowMs: baseTime,
    });
    expect(status).toBe('offline');
  });

  it('returns loading when lastSynced is null and no error', () => {
    const status = deriveSourceStatus({
      hasError: false,
      isLive: true,
      lastSynced: null,
      staleThresholdMs: WEATHER_STALE_MS,
      nowMs: baseTime,
    });
    expect(status).toBe('loading');
  });

  it('returns simulated when source is SIMULATED_FALLBACK or isLive is false', () => {
    const status1 = deriveSourceStatus({
      hasError: false,
      isLive: false,
      source: 'SIMULATED_FALLBACK',
      lastSynced: new Date(baseTime),
      staleThresholdMs: WEATHER_STALE_MS,
      nowMs: baseTime,
    });
    expect(status1).toBe('simulated');

    const status2 = deriveSourceStatus({
      hasError: false,
      isLive: false,
      lastSynced: new Date(baseTime),
      staleThresholdMs: WEATHER_STALE_MS,
      nowMs: baseTime,
    });
    expect(status2).toBe('simulated');
  });

  it('returns stale when elapsed time exceeds stale threshold', () => {
    const status = deriveSourceStatus({
      hasError: false,
      isLive: true,
      source: 'OPEN_METEO_API',
      lastSynced: new Date(baseTime - WEATHER_STALE_MS - 5000),
      staleThresholdMs: WEATHER_STALE_MS,
      nowMs: baseTime,
    });
    expect(status).toBe('stale');
  });

  it('returns live when data is fresh, live, and within threshold', () => {
    const status = deriveSourceStatus({
      hasError: false,
      isLive: true,
      source: 'OPEN_METEO_API',
      lastSynced: new Date(baseTime - 60000), // 1 min ago
      staleThresholdMs: WEATHER_STALE_MS,
      nowMs: baseTime,
    });
    expect(status).toBe('live');
  });
});

describe('useDataHealth - deriveOverall', () => {
  it('returns all_live when all live_api feeds are live, ignoring simulated benchmarks', () => {
    const sources: Array<{ status: any; type: 'live_api' | 'simulated_benchmark' }> = [
      { status: 'live', type: 'live_api' },
      { status: 'live', type: 'live_api' },
      { status: 'simulated', type: 'simulated_benchmark' }, // BWDB simulated gauge should not degrade overall
    ];
    expect(deriveOverall(sources)).toBe('all_live');
  });

  it('returns offline when all live_api feeds are offline', () => {
    const sources: Array<{ status: any; type: 'live_api' | 'simulated_benchmark' }> = [
      { status: 'offline', type: 'live_api' },
      { status: 'offline', type: 'live_api' },
      { status: 'simulated', type: 'simulated_benchmark' },
    ];
    expect(deriveOverall(sources)).toBe('offline');
  });

  it('returns partial when some live_api feeds are stale or offline or loading', () => {
    const mixed1: Array<{ status: any; type: 'live_api' | 'simulated_benchmark' }> = [
      { status: 'live', type: 'live_api' },
      { status: 'stale', type: 'live_api' },
      { status: 'simulated', type: 'simulated_benchmark' },
    ];
    expect(deriveOverall(mixed1)).toBe('partial');

    const mixed2: Array<{ status: any; type: 'live_api' | 'simulated_benchmark' }> = [
      { status: 'loading', type: 'live_api' },
      { status: 'loading', type: 'live_api' },
    ];
    expect(deriveOverall(mixed2)).toBe('partial');
  });
});
