import { EvidenceRecord } from '../types';

/**
 * Calculates weighted composite quality score across evidence records.
 */
export function calculateCompositeQualityScore(records: EvidenceRecord[]): number {
  if (records.length === 0) return 0;

  // Weightings based on source credibility
  const sourceWeightMap: Record<string, number> = {
    DIRECT_SENSOR: 1.2,
    OFFICIAL_BULLETIN: 1.3,
    SATELLITE_OBSERVATION: 1.1,
    WEATHER_FORECAST: 0.9,
    COMMUNITY_REPORT: 0.8,
    MODEL_PREDICTION: 0.85,
    RULE_BASELINE: 0.75,
    SIMULATED_DEMO: 0.5,
  };

  let totalWeightedScore = 0;
  let totalWeights = 0;

  for (const record of records) {
    const weight = sourceWeightMap[record.sourceType] || 1.0;
    // Anomaly penalization
    const score = record.isAnomaly ? record.qualityScore * 0.5 : record.qualityScore;
    totalWeightedScore += score * weight;
    totalWeights += weight;
  }

  return Math.round(totalWeightedScore / totalWeights);
}

/**
 * Classifies data freshness based on timestamp or descriptive age.
 */
export function classifyFreshness(timestampDesc: string): 'FRESH' | 'AGING' | 'STALE' {
  const lower = timestampDesc.toLowerCase();
  if (lower.includes('just now') || lower.includes('min') || lower.includes('live')) {
    return 'FRESH';
  }
  if (lower.includes('1 hour') || lower.includes('2 hour') || lower.includes('3 hour') || lower.includes('6 hour')) {
    return 'AGING';
  }
  return 'STALE';
}

/**
 * Detects discrepancies between community ground reports and radar water levels.
 */
export function detectEvidenceConflicts(records: EvidenceRecord[]): {
  conflictDetected: boolean;
  conflictingRecordIds: string[];
  explanation: string;
} {
  const anomalies = records.filter((r) => r.isAnomaly || r.contradictsOtherSources);
  if (anomalies.length > 0) {
    return {
      conflictDetected: true,
      conflictingRecordIds: anomalies.map((a) => a.id),
      explanation: `${anomalies.length} anomalous or conflicting telemetry feed(s) flagged for manual verification.`,
    };
  }

  return {
    conflictDetected: false,
    conflictingRecordIds: [],
    explanation: 'No flags were found in the supplied demonstration records. This does not establish cross-source agreement, verification, or a statistical confidence interval.',
  };
}
