import test from 'node:test';
import assert from 'node:assert';
import {
  computeRolling24h,
  runJune2022Backtest,
  generateJune2022FallbackDataset,
} from './june2022Backtest';

test('computeRolling24h calculates moving window sum correctly', () => {
  const hourly = new Array(30).fill(10);
  const rolling = computeRolling24h(hourly);

  assert.strictEqual(rolling[0], 10);
  assert.strictEqual(rolling[1], 20);
  assert.strictEqual(rolling[23], 240);
  assert.strictEqual(rolling[24], 240); // 24-hour window stabilizes at 24 * 10 = 240
  assert.strictEqual(rolling[29], 240);
});

test('runJune2022Backtest records scenario threshold intervals before its modelled peak', () => {
  const dataset = generateJune2022FallbackDataset();
  const summary = runJune2022Backtest(
    dataset.times,
    dataset.sylhetPrecip,
    dataset.cherraPrecip,
    false
  );

  assert.strictEqual(summary.success, true);
  assert.ok(summary.timeline.length > 0);
  assert.ok(summary.warningTriggeredAt !== null, 'Warning rule should be triggered');
  assert.ok(summary.dangerTriggeredAt !== null, 'Danger rule should be triggered');
  assert.ok(
    summary.warningScenarioIntervalHours > 24,
    `Warning scenario interval (${summary.warningScenarioIntervalHours}h) should exceed 24 hours in this deterministic demo scenario`
  );
  assert.ok(
    summary.dangerScenarioIntervalHours > 12,
    `Danger scenario interval (${summary.dangerScenarioIntervalHours}h) should exceed 12 hours in this deterministic demo scenario`
  );
  assert.ok(summary.peakWaterLevelM > summary.dangerLevelM, 'Peak water level should exceed danger level');
});
