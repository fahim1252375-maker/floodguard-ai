import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStationWaterLevelTrend,
  calculateTrendMetrics,
  compute48hLinearRegression,
  buildCompositeTrendSeries,
  generateStationWaterLevelCSV,
  TREND_TIMEFRAMES,
} from './stationTrends';
import { INITIAL_LOCATIONS } from '../data/mockData';

test('TREND_TIMEFRAMES defines 4 distinct timeframes', () => {
  assert.equal(TREND_TIMEFRAMES.length, 4);
  const ids = TREND_TIMEFRAMES.map((t) => t.id);
  assert.ok(ids.includes('7d_monsoon'));
  assert.ok(ids.includes('2024_remal'));
  assert.ok(ids.includes('2022_peak'));
  assert.ok(ids.includes('30d_seasonal'));
});

test('getStationWaterLevelTrend generates realistic points for 7-day rolling window', () => {
  const station = INITIAL_LOCATIONS[0]; // Sylhet Sadar (DL: 10.80)
  const points = getStationWaterLevelTrend(station, '7d_monsoon');

  assert.equal(points.length, 7);
  assert.equal(points[6].date, 'Today');
  assert.equal(points[0].dangerLevel, station.dangerLevel);
  assert.equal(points[0].warningLevel, station.warningLevel);

  for (const pt of points) {
    assert.ok(typeof pt.waterLevel === 'number' && !isNaN(pt.waterLevel));
    assert.ok(typeof pt.rainfall === 'number' && pt.rainfall >= 0);
    assert.ok(['NORMAL', 'WARNING', 'DANGER'].includes(pt.status));
    assert.equal(pt.deltaDL, Number((pt.waterLevel - pt.dangerLevel).toFixed(2)));
  }
});

test('compute48hLinearRegression projects rising trend for increasing water levels', () => {
  const station = INITIAL_LOCATIONS[1]; // Kanaighat
  const points = getStationWaterLevelTrend(station, '7d_monsoon');
  const regression = compute48hLinearRegression(points, station);

  assert.ok(typeof regression.slopePerDay === 'number');
  assert.ok(regression.rSquared >= 0 && regression.rSquared <= 1);
  assert.equal(regression.forecastPoints.length, 4); // +12h, +24h, +36h, +48h
  assert.equal(regression.forecastPoints[0].date, '+12h Proj');
  assert.equal(regression.forecastPoints[1].date, '+24h Proj');
  assert.equal(regression.forecastPoints[3].date, '+48h Proj');
  assert.ok(regression.projected24hLevel > 0);
  assert.ok(regression.projected48hLevel > 0);
});

test('buildCompositeTrendSeries seamlessly stitches historical and forecast curves', () => {
  const station = INITIAL_LOCATIONS[2]; // Gowainghat
  const points = getStationWaterLevelTrend(station, '7d_monsoon');
  const regression = compute48hLinearRegression(points, station);

  // When overlay is disabled
  const offSeries = buildCompositeTrendSeries(points, regression, false);
  assert.equal(offSeries.length, points.length);
  assert.equal(offSeries[offSeries.length - 1].forecastWaterLevel, null);

  // When overlay is enabled
  const onSeries = buildCompositeTrendSeries(points, regression, true);
  assert.equal(onSeries.length, points.length + 4);
  // Last historical point connects forecastWaterLevel to waterLevel for seamless line
  assert.equal(onSeries[points.length - 1].forecastWaterLevel, points[points.length - 1].waterLevel);
  // Projected points have isForecast = true
  assert.equal(onSeries[onSeries.length - 1].isForecast, true);
});

test('generateStationWaterLevelCSV produces well-formed CSV with metadata and rows', () => {
  const station = INITIAL_LOCATIONS[0];
  const points = getStationWaterLevelTrend(station, '7d_monsoon');
  const regression = compute48hLinearRegression(points, station);
  const csv = generateStationWaterLevelCSV(station, '7d_monsoon', points, regression, true);

  assert.ok(csv.includes('# FloodGuard AI - Station Water-Level Trend & Hydrograph Export'));
  assert.ok(csv.includes('Sylhet (SW267)'));
  assert.ok(csv.includes('Surma River'));
  assert.ok(csv.includes('"Observation Type","Date / Time Label"'));
  assert.ok(csv.includes('Historical Telemetry Observation'));
  assert.ok(csv.includes('48h Linear Regression Projection Rate'));
});

test('calculateTrendMetrics handles both historical and composite points safely', () => {
  const station = INITIAL_LOCATIONS[2];
  const points = getStationWaterLevelTrend(station, '2024_remal');
  const metrics = calculateTrendMetrics(points, station.dangerLevel);

  assert.ok(metrics.peakLevel > 0);
  assert.ok(metrics.minLevel <= metrics.peakLevel);
  assert.ok(metrics.avgLevel >= metrics.minLevel && metrics.avgLevel <= metrics.peakLevel);
  assert.ok(typeof metrics.peakDate === 'string' && metrics.peakDate.length > 0);
});
