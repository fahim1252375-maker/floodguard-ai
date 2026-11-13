import test from 'node:test';
import assert from 'node:assert/strict';
import { computeEnsembleForecast, normalCdf } from './ensembleForecast';

test('normalCdf is symmetric and anchored', () => {
  assert.ok(Math.abs(normalCdf(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(normalCdf(1.96) - 0.975) < 1e-3);
  assert.ok(Math.abs(normalCdf(-1.96) - 0.025) < 1e-3);
});

test('returns null when there is too little data', () => {
  assert.equal(computeEnsembleForecast([1, 2], { stepHours: 6, horizonHours: 24, threshold: 5 }), null);
});

test('rising series forecasts a threshold crossing', () => {
  const r = computeEnsembleForecast([8.0, 8.2, 8.4, 8.6, 8.8, 9.0], {
    stepHours: 6,
    horizonHours: 48,
    threshold: 9.5,
  })!;
  assert.ok(r);
  assert.equal(r.trend, 'rising');
  assert.ok(r.firstCrossingHour !== null && r.firstCrossingHour <= 48);
  assert.ok(r.points.every((p) => p.low <= p.mean && p.mean <= p.high));
});

test('band widens with horizon', () => {
  const r = computeEnsembleForecast([8.0, 8.25, 8.4, 8.7, 8.8, 9.1], {
    stepHours: 6,
    horizonHours: 48,
    threshold: 20,
  })!;
  const w = (i: number) => r.points[i].high - r.points[i].low;
  assert.ok(w(r.points.length - 1) > w(0));
});

test('flat series is stable with near-zero exceedance', () => {
  const r = computeEnsembleForecast([5, 5, 5, 5, 5], { stepHours: 6, horizonHours: 24, threshold: 8 })!;
  assert.equal(r.trend, 'stable');
  assert.ok(r.points[r.points.length - 1].exceedProbability < 0.01);
  assert.equal(r.firstCrossingHour, null);
});

test('falling series trends falling', () => {
  const r = computeEnsembleForecast([9, 8.7, 8.4, 8.1, 7.8], { stepHours: 6, horizonHours: 24, threshold: 9.5 })!;
  assert.equal(r.trend, 'falling');
});
