import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCompositeQualityScore,
  classifyFreshness,
  detectEvidenceConflicts,
} from './evidenceFusion';
import { EVIDENCE_RECORDS } from '../data/globalIntelligenceData';

test('calculateCompositeQualityScore produces a deterministic demo score for bundled sample records', () => {
  const compositeScore = calculateCompositeQualityScore(EVIDENCE_RECORDS);
  assert.ok(compositeScore >= 0 && compositeScore <= 100, `Expected a bounded score, got ${compositeScore}`);
});

test('classifyFreshness accurately tags relative timestamps', () => {
  assert.equal(classifyFreshness('5 mins ago'), 'FRESH');
  assert.equal(classifyFreshness('Live 5m Sync'), 'FRESH');
  assert.equal(classifyFreshness('2 hours ago'), 'AGING');
  assert.equal(classifyFreshness('Yesterday at 14:00'), 'STALE');
});

test('detectEvidenceConflicts passes when no anomalous sources exist', () => {
  const result = detectEvidenceConflicts(EVIDENCE_RECORDS);
  assert.equal(result.conflictDetected, false);
  assert.equal(result.conflictingRecordIds.length, 0);
  assert.match(result.explanation, /demonstration records/i);
  assert.match(result.explanation, /does not establish cross-source agreement/i);
  assert.doesNotMatch(result.explanation, /95% confidence/i);
});

test('detectEvidenceConflicts detects anomalies when flagged records exist', () => {
  const tamperedRecords = [
    ...EVIDENCE_RECORDS,
    {
      id: 'ev-anom',
      sourceId: 'TEST-TAMPERED',
      sourceOrganization: 'Test Mock',
      sourceType: 'DIRECT_SENSOR' as const,
      stationOrArea: 'Test Station',
      parameterName: 'Stage',
      observedValue: 99.9,
      unit: 'm',
      observationTimestamp: '1 min ago',
      retrievalTimestamp: 'Live',
      qualityScore: 20,
      freshnessStatus: 'FRESH' as const,
      isAnomaly: true,
      contradictsOtherSources: true,
      notes: 'Sudden unrealistic jump',
    },
  ];

  const result = detectEvidenceConflicts(tamperedRecords);
  assert.equal(result.conflictDetected, true);
  assert.ok(result.conflictingRecordIds.includes('ev-anom'));
});
