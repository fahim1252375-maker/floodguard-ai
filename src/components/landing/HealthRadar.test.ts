import { describe, it, expect } from 'vitest';
import { SCHEMATIC_COORDINATES } from './HealthRadar';
import { INITIAL_LOCATIONS } from '../../data/mockData';
import { computeHealthRisk, computeHealthRiskProjection } from '../../utils/healthRisk';

describe('HealthRadar Coordinate Table & Layer Logic', () => {
  it('has valid coordinates for key Surma and Kushiyara corridor nodes', () => {
    expect(SCHEMATIC_COORDINATES['loc-1']).toBeDefined(); // Gowainghat
    expect(SCHEMATIC_COORDINATES['loc-1'].corridor).toBe('surma');
    expect(SCHEMATIC_COORDINATES['loc-7'].corridor).toBe('kushiyara'); // Zakiganj
    expect(SCHEMATIC_COORDINATES['loc-9'].corridor).toBe('haor'); // Derai
  });

  it('correctly maps flood risk score into distinct severity categories', () => {
    const loc = INITIAL_LOCATIONS[0];
    const risk = computeHealthRisk({
      district: loc.district,
      upazilaEn: loc.nameEn,
      upazilaBn: loc.nameBn,
      floodRiskScore: 85,
      waterLevel: 11.5,
      dangerLevel: 10.8,
    });
    expect(risk.overallTier).toBe('SEVERE');
  });

  it('generates 48-hour timeline projection using rate of rise', () => {
    const loc = INITIAL_LOCATIONS[0];
    const projection = computeHealthRiskProjection({
      district: loc.district,
      nameEn: loc.nameEn,
      nameBn: loc.nameBn,
      currentWaterLevel: 10.5,
      dangerLevel: 10.8,
      warningLevel: 10.3,
      riskScore: 60,
      rateOfRise24h: 0.35,
    });

    expect(projection.timeline.length).toBeGreaterThanOrEqual(4);
    // Water level in future points should reflect rise
    const futurePoint = projection.timeline[projection.timeline.length - 1];
    expect(futurePoint.projectedWaterLevel).toBeGreaterThan(10.5);
  });

  it('handles calm / missing boundary data without throwing errors', () => {
    const risk = computeHealthRisk({
      district: 'Sylhet',
      upazilaEn: 'Test',
      upazilaBn: 'টেস্ট',
      floodRiskScore: 0,
      waterLevel: 5.0,
      dangerLevel: 10.0,
      standingWaterDays: 0,
      displacedPopulation: 0,
      shelterCrowdingRatio: 0,
    });

    expect(risk.overallScore).toBeLessThan(35);
    expect(risk.overallTier).toBe('LOW');
  });
});
