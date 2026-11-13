/**
 * User-defined alert rules evaluated against live station data.
 * Pure functions only; persistence and browser notifications live in the view.
 */
import { LocationData } from '../types';

export type RuleMetric = 'margin_to_danger' | 'rise_24h' | 'rainfall_24h' | 'risk_score';
export type RuleSeverity = 'watch' | 'warning' | 'emergency';

export interface AlertRule {
  id: string;
  locationId: string | 'ALL';
  metric: RuleMetric;
  threshold: number;
  severity: RuleSeverity;
  enabled: boolean;
}

export interface RuleHit {
  ruleId: string;
  locationId: string;
  locationName: string;
  severity: RuleSeverity;
  metric: RuleMetric;
  value: number;
  threshold: number;
  messageEn: string;
  messageBn: string;
}

export const METRIC_META: Record<
  RuleMetric,
  { labelEn: string; labelBn: string; unit: string; hintEn: string; hintBn: string }
> = {
  margin_to_danger: {
    labelEn: 'Margin below danger level',
    labelBn: 'বিপৎসীমার নিচে ব্যবধান',
    unit: 'm',
    hintEn: 'Fires when the gauge is within this many metres of the danger level (or above it).',
    hintBn: 'গেজ বিপৎসীমার এত মিটারের মধ্যে এলে (বা ছাড়ালে) সতর্ক করবে।',
  },
  rise_24h: {
    labelEn: '24h water rise',
    labelBn: '২৪ ঘণ্টায় পানি বৃদ্ধি',
    unit: 'm',
    hintEn: 'Fires when the 24-hour rise is at or above this value.',
    hintBn: '২৪ ঘণ্টার বৃদ্ধি এই মান বা বেশি হলে সতর্ক করবে।',
  },
  rainfall_24h: {
    labelEn: '24h rainfall',
    labelBn: '২৪ ঘণ্টার বৃষ্টিপাত',
    unit: 'mm',
    hintEn: 'Fires when local 24-hour rainfall is at or above this value.',
    hintBn: 'স্থানীয় ২৪ ঘণ্টার বৃষ্টিপাত এই মান বা বেশি হলে সতর্ক করবে।',
  },
  risk_score: {
    labelEn: 'Flood risk score',
    labelBn: 'বন্যা ঝুঁকি স্কোর',
    unit: '/100',
    hintEn: 'Fires when the composite risk score is at or above this value.',
    hintBn: 'সমন্বিত ঝুঁকি স্কোর এই মান বা বেশি হলে সতর্ক করবে।',
  },
};

export const DEFAULT_RULES: AlertRule[] = [
  { id: 'r-margin', locationId: 'ALL', metric: 'margin_to_danger', threshold: 0.5, severity: 'warning', enabled: true },
  { id: 'r-rise', locationId: 'ALL', metric: 'rise_24h', threshold: 0.4, severity: 'watch', enabled: true },
  { id: 'r-rain', locationId: 'ALL', metric: 'rainfall_24h', threshold: 150, severity: 'watch', enabled: true },
  { id: 'r-risk', locationId: 'ALL', metric: 'risk_score', threshold: 80, severity: 'emergency', enabled: true },
];

export function metricValue(loc: LocationData, metric: RuleMetric): number {
  switch (metric) {
    case 'margin_to_danger':
      // positive = still below danger level, negative = above it
      return Number((loc.dangerLevel - loc.currentWaterLevel).toFixed(2));
    case 'rise_24h':
      return loc.waterLevelChange24h;
    case 'rainfall_24h':
      return loc.rainfall24h;
    case 'risk_score':
      return loc.riskScore;
  }
}

/** margin_to_danger fires when the margin is at or BELOW the threshold; others at or above. */
export function ruleFires(metric: RuleMetric, value: number, threshold: number): boolean {
  return metric === 'margin_to_danger' ? value <= threshold : value >= threshold;
}

const SEVERITY_RANK: Record<RuleSeverity, number> = { watch: 1, warning: 2, emergency: 3 };

export function evaluateRules(rules: AlertRule[], locations: LocationData[]): RuleHit[] {
  const hits: RuleHit[] = [];
  for (const rule of rules) {
    if (!rule.enabled || !Number.isFinite(rule.threshold)) continue;
    const targets =
      rule.locationId === 'ALL' ? locations : locations.filter((l) => l.id === rule.locationId);
    for (const loc of targets) {
      const value = metricValue(loc, rule.metric);
      if (!ruleFires(rule.metric, value, rule.threshold)) continue;
      const meta = METRIC_META[rule.metric];
      hits.push({
        ruleId: rule.id,
        locationId: loc.id,
        locationName: loc.nameEn,
        severity: rule.severity,
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        messageEn: `${loc.nameEn}: ${meta.labelEn} is ${value}${meta.unit} (rule threshold ${rule.threshold}${meta.unit}).`,
        messageBn: `${loc.nameBn}: ${meta.labelBn} ${value}${meta.unit} (নির্ধারিত সীমা ${rule.threshold}${meta.unit})।`,
      });
    }
  }
  return hits.sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.locationName.localeCompare(b.locationName)
  );
}

/** Stable key so the same hit does not re-notify on every refresh. */
export function hitKey(hit: RuleHit): string {
  return `${hit.ruleId}:${hit.locationId}`;
}
