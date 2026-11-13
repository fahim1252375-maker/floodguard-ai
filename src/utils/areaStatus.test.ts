import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAreaStatus } from './areaStatus';
import type { LocationData } from '../types';

const loc = (o: Partial<LocationData>) =>
  ({ dangerLevel: 10, currentWaterLevel: 8, riskLevel: 'LOW', waterLevelChange24h: 0, ...o }) as LocationData;

test('green when well below danger and low risk', () => {
  assert.equal(computeAreaStatus(loc({})).level, 'green');
});
test('amber when within 0.5 m of danger level', () => {
  assert.equal(computeAreaStatus(loc({ currentWaterLevel: 9.6 })).level, 'amber');
});
test('amber when risk is HIGH even with margin', () => {
  assert.equal(computeAreaStatus(loc({ riskLevel: 'HIGH' })).level, 'amber');
});
test('red when at/above danger level or CRITICAL', () => {
  assert.equal(computeAreaStatus(loc({ currentWaterLevel: 10.1 })).level, 'red');
  assert.equal(computeAreaStatus(loc({ riskLevel: 'CRITICAL' })).level, 'red');
});
test('every level has equal-length bilingual steps', () => {
  for (const l of [loc({}), loc({ currentWaterLevel: 9.6 }), loc({ riskLevel: 'CRITICAL' })]) {
    const s = computeAreaStatus(l);
    assert.equal(s.stepsEn.length, s.stepsBn.length);
    assert.ok(s.stepsEn.length >= 3);
  }
});
