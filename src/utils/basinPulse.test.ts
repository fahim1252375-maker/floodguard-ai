import { describe, it, expect } from 'vitest';
import { computeSignal, SurgeImpactInfo } from './basinPulse';
import { LocationData } from '../types';

describe('basinPulse - computeSignal', () => {
  const dummyLocations: LocationData[] = [
    {
      id: 'loc-1',
      nameEn: 'Gowainghat',
      nameBn: 'গোয়াইনঘাট',
      district: 'Sylhet',
      upazilaEn: 'Gowainghat',
      upazilaBn: 'গোয়াইনঘাট',
      riverNameEn: 'Sari-Gowain',
      riverNameBn: 'সারি-গোয়াইন',
      stationName: 'Sarighat Gauge',
      coordinates: [25.08, 92.05],
      currentWaterLevel: 10.2,
      dangerLevel: 10.8,
      warningLevel: 10.3,
      waterLevelChange24h: 0.1,
      rainfall24h: 20,
      rainfallTrend: 'steady',
      riskLevel: 'LOW',
      riskScore: 25,
      soilSaturationPercent: 40,
      upstreamRainfallMm: 30,
      populationExposed: 5000,
      sheltersCount: 38,
      historicalMaxM: 14.2,
      lastUpdated: '2026-11-06T12:00:00Z',
      isSimulated: false,
    },
  ];

  it('Prioritizes CRITICAL or HIGH river breach over other signals', () => {
    const breachedLocations: LocationData[] = [
      {
        ...dummyLocations[0],
        currentWaterLevel: 11.4, // +0.6m above DL (10.8)
        riskLevel: 'CRITICAL',
        riskScore: 88,
      },
    ];

    const signal = computeSignal(breachedLocations, null, null);
    expect(signal.priority).toBe('CRITICAL_RIVER_BREACH');
    expect(signal.status).toBe('critical');
    expect(signal.headlineEn).toContain('Gowainghat');
    expect(signal.headlineEn).toContain('+0.60m above Danger Mark');
  });

  it('Prioritizes upstream surge in transit when no station is breached', () => {
    const surge: SurgeImpactInfo = {
      surgePressureIndex: 65,
      estimatedSurgeArrivalHours: 8,
      criticalUpstreamSources: ['Cherrapunji Runoff', 'Jadukata Headwaters'],
    };

    const signal = computeSignal(dummyLocations, null, surge);
    expect(signal.priority).toBe('UPSTREAM_SURGE_IN_TRANSIT');
    expect(signal.status).toBe('warning');
    expect(signal.headlineEn).toContain('ETA ~8h');
    expect(signal.etaHours).toBe(8);
  });

  it('Returns calm monitoring state when no breach and no surge', () => {
    const signal = computeSignal(
      dummyLocations,
      {
        fetchedAt: '2026-11-06T12:00:00Z',
        isLive: true,
        source: 'OPEN_METEO_API',
        regions: {
          cherrapunji: {
            past24hTotalMm: 0.0,
            next24hTotalMm: 0.0,
            dailyPrecipitationMm: [0, 0, 0, 0, 0, 0, 0],
          },
        },
      } as any,
      null
    );

    expect(signal.priority).toBe('CALM_MONITORING');
    expect(signal.status).toBe('normal');
    expect(signal.isDrySpell).toBe(true);
    expect(signal.headlineEn).toContain('Basin calm');
  });
});
