import test from 'node:test';
import assert from 'node:assert';
import {
  computeHealthRisk,
  computeHealthRiskProjection,
  estimateStandingWaterDays,
  estimateDisplacedPopulation,
  SAMPLE_SHELTER_MEDICAL_BOARD,
} from './healthRisk';

test('estimateStandingWaterDays returns graduated days based on water level delta', () => {
  assert.strictEqual(estimateStandingWaterDays(12.5, 11.0), 6);
  assert.strictEqual(estimateStandingWaterDays(11.8, 11.0), 4);
  assert.strictEqual(estimateStandingWaterDays(11.2, 11.0), 2);
  assert.strictEqual(estimateStandingWaterDays(10.7, 11.0), 1);
  assert.strictEqual(estimateStandingWaterDays(9.5, 11.0), 0);
});

test('estimateDisplacedPopulation calculates realistic estimates based on risk score', () => {
  const low = estimateDisplacedPopulation(20);
  const med = estimateDisplacedPopulation(50);
  const high = estimateDisplacedPopulation(75);
  const severe = estimateDisplacedPopulation(90);

  assert.ok(low < med);
  assert.ok(med < high);
  assert.ok(high < severe);
  assert.ok(severe > 18000);
});

test('computeHealthRisk outputs LOW risk when flood conditions are calm', () => {
  const result = computeHealthRisk({
    district: 'Sylhet',
    upazilaEn: 'Sylhet Sadar',
    upazilaBn: 'সিলেট সদর',
    floodRiskScore: 15,
    waterLevel: 8.5,
    dangerLevel: 10.5,
    standingWaterDays: 0,
    displacedPopulation: 100,
    shelterCrowdingRatio: 0.1,
  });

  assert.strictEqual(result.overallTier, 'LOW');
  assert.ok(result.overallScore < 35);
  assert.strictEqual(result.diseaseBreakdown.length, 4);
  assert.strictEqual(result.topFactorsEn.length, 3);
  assert.strictEqual(result.recommendedActionsEn.length, 3);
});

test('computeHealthRisk outputs SEVERE risk when river breaches danger mark with standing water & crowding', () => {
  const result = computeHealthRisk({
    district: 'Sunamganj',
    upazilaEn: 'Tahirpur',
    upazilaBn: 'তাহিরপুর',
    floodRiskScore: 92,
    waterLevel: 12.8,
    dangerLevel: 11.2,
    standingWaterDays: 5,
    displacedPopulation: 25000,
    shelterCrowdingRatio: 1.3,
  });

  assert.strictEqual(result.overallTier, 'SEVERE');
  assert.ok(result.overallScore >= 75);

  const cholera = result.diseaseBreakdown.find((d) => d.id === 'diarrhoea_cholera');
  assert.ok(cholera != null);
  assert.strictEqual(cholera?.tier, 'SEVERE');

  const snakebite = result.diseaseBreakdown.find((d) => d.id === 'snakebite');
  assert.ok(snakebite != null);
  assert.ok(snakebite.score >= 50);
});

test('SAMPLE_SHELTER_MEDICAL_BOARD contains realistic inventory and shortage flags', () => {
  assert.ok(SAMPLE_SHELTER_MEDICAL_BOARD.length >= 4);
  const flagged = SAMPLE_SHELTER_MEDICAL_BOARD.filter((s) => s.shortageFlag);
  assert.ok(flagged.length >= 2, 'Should have flagged shelters with supply shortages');

  const cutOff = SAMPLE_SHELTER_MEDICAL_BOARD.find((s) => s.clinicAccessStatus === 'CUT_OFF');
  assert.ok(cutOff != null, 'Should have at least one cut-off clinic route');
});

test('computeHealthRiskProjection projects 48h trajectory and detects peak risk', () => {
  const loc = {
    district: 'Sylhet',
    nameEn: 'Gowainghat',
    nameBn: 'গোয়াইনঘাট',
    currentWaterLevel: 12.8,
    dangerLevel: 12.0,
    warningLevel: 11.5,
    riskScore: 78,
    rateOfRise24h: 0.40,
  };

  const projection = computeHealthRiskProjection(loc);

  assert.strictEqual(projection.timeline.length, 5);
  assert.deepStrictEqual(
    projection.timeline.map((p: any) => p.hourLabel),
    ['+0h', '+12h', '+24h', '+36h', '+48h']
  );

  // Monotonic increase or non-decreasing risk as water rises and standing days accumulate
  const scores = projection.timeline.map((p: any) => p.overallHealthScore);
  assert.ok(scores[4] >= scores[0], 'Risk score should increase or stay severe as water rises');

  // Boundaries: all scores between 0 and 100
  projection.timeline.forEach((pt: any) => {
    assert.ok(pt.overallHealthScore >= 0 && pt.overallHealthScore <= 100);
    assert.ok(pt.choleraScore >= 0 && pt.choleraScore <= 100);
    assert.ok(pt.typhoidScore >= 0 && pt.typhoidScore <= 100);
    assert.ok(pt.skinScore >= 0 && pt.skinScore <= 100);
    assert.ok(pt.snakebiteScore >= 0 && pt.snakebiteScore <= 100);
  });

  assert.ok(projection.peakScore >= scores[0]);
  assert.ok(projection.peakSummaryEn.length > 0);
  assert.ok(projection.peakSummaryBn.length > 0);
});
