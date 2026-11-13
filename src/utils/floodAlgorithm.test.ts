import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFloodRisk } from './floodAlgorithm';

const mockSylhetStation = {
  id: 'sylhet-sadar',
  nameEn: 'Sylhet Sadar',
  nameBn: 'সিলেট সদর',
  district: 'Sylhet' as const,
  upazilaEn: 'Sylhet Sadar',
  upazilaBn: 'সিলেট সদর',
  riverNameEn: 'Surma River',
  riverNameBn: 'সুরমা নদী',
  stationName: 'Sylhet (SW267)',
  coordinates: [24.8949, 91.8687] as [number, number],
  currentWaterLevel: 8.5,
  dangerLevel: 10.80,
  warningLevel: 10.30,
  waterLevelChange24h: 0.05,
  rainfall24h: 15,
  rainfallTrend: 'steady' as const,
  riskLevel: 'LOW' as const,
  riskScore: 22,
  soilSaturationPercent: 40,
  upstreamRainfallMm: 25,
  populationExposed: 48000,
  sheltersCount: 42,
  historicalMaxM: 12.44,
  lastUpdated: '10 mins ago',
  isSimulated: true,
};

test('normal low-rainfall condition yields LOW risk', () => {
  const result = calculateFloodRisk(
    {
      locationId: 'sylhet-sadar',
      rainfallMm: 12,
      waterLevelM: 8.4,
      waterLevelChangeM: 0.05,
      rainfallTrend: 'steady',
      durationHours: 12,
      upstreamRainfallMm: 20,
    },
    mockSylhetStation
  );

  assert.equal(result.riskLevel, 'LOW');
  assert.ok(result.riskScore < 35, `Risk score ${result.riskScore} should be < 35 for low conditions`);
  assert.equal(result.factors.length, 4);
  assert.ok(result.actionsEn.length > 0);
  assert.ok(result.explanationEn.includes('LOWER MODEL INDICATOR'));
});

test('heavy rainfall and rising river approaching warning level yields MODERATE or HIGH risk', () => {
  const result = calculateFloodRisk(
    {
      locationId: 'sylhet-sadar',
      rainfallMm: 85,
      waterLevelM: 10.4,
      waterLevelChangeM: 0.35,
      rainfallTrend: 'rising',
      durationHours: 24,
      upstreamRainfallMm: 110,
    },
    mockSylhetStation
  );

  assert.ok(['MODERATE', 'HIGH'].includes(result.riskLevel), `Risk level was ${result.riskLevel}`);
  assert.ok(result.riskScore >= 35);
});

test('breaching danger level with upstream deluge yields CRITICAL risk', () => {
  const result = calculateFloodRisk(
    {
      locationId: 'sylhet-sadar',
      rainfallMm: 240,
      waterLevelM: 11.45, // 0.65m above danger level (10.80)
      waterLevelChangeM: 0.95,
      rainfallTrend: 'rising',
      durationHours: 48,
      upstreamRainfallMm: 350,
    },
    mockSylhetStation
  );

  assert.equal(result.riskLevel, 'CRITICAL');
  assert.ok(result.riskScore >= 78);
  assert.ok(result.scenarioStage24hM > 11.45);
  assert.ok(result.actionsEn.some((a) => a.includes('evacuation')));
  assert.ok(result.explanationBn.includes('গুরুতর মডেল সূচক'));
});

test('input coverage reports supplied values rather than statistical confidence', () => {
  const withUpstream = calculateFloodRisk(
    {
      locationId: 'sylhet-sadar',
      rainfallMm: 50,
      waterLevelM: 9.5,
      waterLevelChangeM: 0.1,
      rainfallTrend: 'steady',
      durationHours: 24,
      upstreamRainfallMm: 60,
    },
    mockSylhetStation
  );

  assert.equal(withUpstream.inputCoveragePercent, 100);

  const withoutUpstream = calculateFloodRisk(
    {
      locationId: 'sylhet-sadar',
      rainfallMm: 50,
      waterLevelM: 9.5,
      waterLevelChangeM: 0.1,
      rainfallTrend: 'steady',
      durationHours: 24,
    },
    mockSylhetStation
  );

  assert.equal(withoutUpstream.inputCoveragePercent, 80);
});

test('dischargeRatio amplifies risk score and appends GloFAS factor', () => {
  const normalDischarge = calculateFloodRisk(
    {
      locationId: 'sylhet-sadar',
      rainfallMm: 50,
      waterLevelM: 10.1,
      waterLevelChangeM: 0.2,
      rainfallTrend: 'rising',
      durationHours: 24,
      dischargeRatio: 1.0,
    },
    mockSylhetStation
  );

  const surgingDischarge = calculateFloodRisk(
    {
      locationId: 'sylhet-sadar',
      rainfallMm: 50,
      waterLevelM: 10.1,
      waterLevelChangeM: 0.2,
      rainfallTrend: 'rising',
      durationHours: 24,
      dischargeRatio: 1.85,
    },
    mockSylhetStation
  );

  assert.ok(surgingDischarge.riskScore > normalDischarge.riskScore);
  assert.equal(surgingDischarge.factors.length, 5);
  const glofasFactor = surgingDischarge.factors.find((f) => f.factor.includes('GloFAS'));
  assert.ok(glofasFactor);
  assert.equal(glofasFactor?.impact, 'critical');
});
