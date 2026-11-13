import test from 'node:test';
import assert from 'node:assert';
import {
  classifySurgeStatus,
  parseOpenMeteoFlood,
  generateFallbackRiverData,
} from './riverDischarge';

test('classifySurgeStatus correctly classifies discharge ratios', () => {
  assert.strictEqual(classifySurgeStatus(0.9), 'NORMAL');
  assert.strictEqual(classifySurgeStatus(1.1), 'NORMAL');
  assert.strictEqual(classifySurgeStatus(1.2), 'ELEVATED');
  assert.strictEqual(classifySurgeStatus(1.5), 'SURGING');
  assert.strictEqual(classifySurgeStatus(2.3), 'CRITICAL');
});

test('parseOpenMeteoFlood handles valid daily time series and calculates ratios', () => {
  const mockApiJson = {
    daily: {
      time: ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'],
      river_discharge: [300, 450, 600, 750],
      river_discharge_mean: [400, 400, 400, 400],
      river_discharge_max: [900, 900, 900, 900],
    },
  };

  const parsed = parseOpenMeteoFlood(
    'sylhet',
    'Surma Basin',
    'Surma River',
    [24.8949, 91.8687],
    mockApiJson
  );

  assert.strictEqual(parsed.stationId, 'sylhet');
  assert.strictEqual(parsed.timeline.length, 4);
  assert.strictEqual(parsed.timeline[0].dischargeRatio, 0.75);
  assert.strictEqual(parsed.timeline[2].dischargeRatio, 1.5);
  assert.strictEqual(parsed.timeline[3].dischargeRatio, 1.88);
});

test('generateFallbackRiverData produces consistent 15-day timeline for both Sylhet and Sunamganj', () => {
  const fallback = generateFallbackRiverData();
  assert.strictEqual(fallback.isLive, false);
  assert.strictEqual(fallback.source, 'SIMULATED_GLOFAS_FALLBACK');
  assert.ok(fallback.regions.sylhet.timeline.length >= 14);
  assert.ok(fallback.regions.sunamganj.timeline.length >= 14);
  assert.ok(fallback.regions.sylhet.currentDischargeM3s > 0);
  assert.ok(fallback.regions.sunamganj.meanDischargeM3s > 0);
});


test('missing GloFAS values remain missing instead of being replaced with invented discharge numbers', () => {
  const parsed = parseOpenMeteoFlood('sylhet', 'Surma Basin', 'Surma River', [24.8949, 91.8687], {
    daily: {
      time: ['2026-11-08', '2026-11-09', '2026-11-10'],
      river_discharge: [null, 420, null],
      river_discharge_mean: [400, null, 410],
      river_discharge_max: [900, null, 920],
    },
  });
  assert.equal(parsed.timeline.length, 1);
  assert.equal(parsed.timeline[0].dischargeM3s, 420);
  assert.equal(parsed.timeline[0].meanDischargeM3s, null);
  assert.equal(parsed.dataAvailable, true);
  assert.equal(parsed.surgeStatus, 'UNKNOWN');
  assert.equal(parsed.dataDate, '2026-11-09');
});

test('GloFAS parser reports no data when the API only returns missing values', () => {
  const parsed = parseOpenMeteoFlood('sylhet', 'Surma Basin', 'Surma River', [24.8949, 91.8687], {
    daily: { time: ['2026-11-10'], river_discharge: [null], river_discharge_mean: [null], river_discharge_max: [null] },
  });
  assert.equal(parsed.dataAvailable, false);
  assert.equal(parsed.dataDate, null);
  assert.equal(parsed.surgeStatus, 'UNKNOWN');
  assert.equal(parsed.timeline.length, 0);
});
