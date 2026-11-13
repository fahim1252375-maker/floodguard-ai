import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRules, ruleFires, metricValue, DEFAULT_RULES, AlertRule } from './alertRules';
import type { LocationData } from '../types';

const loc = (over: Partial<LocationData> = {}): LocationData =>
  ({
    id: 'l1',
    nameEn: 'Test',
    nameBn: 'টেস্ট',
    currentWaterLevel: 10,
    dangerLevel: 10.5,
    waterLevelChange24h: 0.1,
    rainfall24h: 20,
    riskScore: 30,
    ...over,
  }) as LocationData;

test('margin rule fires at or below threshold, others at or above', () => {
  assert.equal(ruleFires('margin_to_danger', 0.5, 0.5), true);
  assert.equal(ruleFires('margin_to_danger', 0.6, 0.5), false);
  assert.equal(ruleFires('rise_24h', 0.4, 0.4), true);
  assert.equal(ruleFires('risk_score', 79, 80), false);
});

test('margin metric is negative above danger level', () => {
  assert.equal(metricValue(loc({ currentWaterLevel: 11 }), 'margin_to_danger'), -0.5);
});

test('evaluateRules sorts by severity and respects enabled/target', () => {
  const rules: AlertRule[] = [
    { id: 'a', locationId: 'l1', metric: 'margin_to_danger', threshold: 0.5, severity: 'warning', enabled: true },
    { id: 'b', locationId: 'l1', metric: 'risk_score', threshold: 20, severity: 'emergency', enabled: true },
    { id: 'c', locationId: 'l1', metric: 'rainfall_24h', threshold: 1, severity: 'watch', enabled: false },
    { id: 'd', locationId: 'other', metric: 'rainfall_24h', threshold: 1, severity: 'watch', enabled: true },
  ];
  const hits = evaluateRules(rules, [loc()]);
  assert.deepEqual(hits.map((h) => h.ruleId), ['b', 'a']);
});

test('default rules stay quiet on a calm station', () => {
  assert.equal(evaluateRules(DEFAULT_RULES, [loc({ currentWaterLevel: 5 })]).length, 0);
});
