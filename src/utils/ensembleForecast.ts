/**
 * Ensemble water-level forecast with an uncertainty band.
 *
 * Three simple, transparent statistical members are run on the same observed series:
 *   1. OLS linear trend over the most recent window
 *   2. Holt's linear (double exponential smoothing) trend
 *   3. Damped Holt trend (momentum fades with horizon)
 * The ensemble mean is the average of the members. The band combines member
 * disagreement with in-sample one-step residual error, so it widens with horizon.
 *
 * This is a statistical extrapolation of recent gauge readings, NOT a hydrodynamic
 * model. It cannot anticipate new rainfall, dam releases or embankment failures.
 */

export interface EnsemblePoint {
  hour: number; // hours ahead of the last observation
  mean: number;
  low: number; // ~80% band
  high: number;
  members: { ols: number; holt: number; damped: number };
  exceedProbability: number; // P(level >= threshold) under a normal approximation
}

export interface EnsembleResult {
  points: EnsemblePoint[];
  residualStd: number;
  trend: 'rising' | 'falling' | 'stable';
  slopePerHour: number; // ensemble mean slope over the first step
  firstCrossingHour: number | null; // first hour where mean >= threshold
  likelyCrossingHour: number | null; // first hour where P(exceed) >= 0.5
  watchCrossingHour: number | null; // first hour where P(exceed) >= 0.2
  agreement: 'high' | 'medium' | 'low'; // how closely the three members agree at the horizon
}

export interface EnsembleOptions {
  stepHours: number; // spacing of the observed series
  horizonHours: number;
  threshold: number; // e.g. danger level in metres
  olsWindow?: number;
  alpha?: number;
  beta?: number;
  phi?: number;
}

const Z80 = 1.2816; // z-score for a two-sided 80% interval

/** Abramowitz-Stegun approximation of the standard normal CDF. */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z >= 0 ? 1 - p : p;
}

function olsSlope(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: meanY - slope * meanX };
}

interface HoltState {
  level: number;
  trend: number;
  residuals: number[];
}

function fitHolt(values: number[], alpha: number, beta: number): HoltState {
  let level = values[0];
  let trend = values.length > 1 ? values[1] - values[0] : 0;
  const residuals: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const predicted = level + trend;
    residuals.push(values[i] - predicted);
    const newLevel = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (newLevel - level) + (1 - beta) * trend;
    level = newLevel;
  }
  return { level, trend, residuals };
}

function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

/** Returns null when there is not enough data (fewer than 3 observations). */
export function computeEnsembleForecast(
  observed: number[],
  opts: EnsembleOptions
): EnsembleResult | null {
  const series = observed.filter((v) => Number.isFinite(v));
  if (series.length < 3 || opts.stepHours <= 0 || opts.horizonHours <= 0) return null;

  const { stepHours, horizonHours, threshold } = opts;
  const window = Math.min(opts.olsWindow ?? 6, series.length);
  const alpha = opts.alpha ?? 0.5;
  const beta = opts.beta ?? 0.3;
  const phi = opts.phi ?? 0.85;

  const recent = series.slice(-window);
  const ols = olsSlope(recent);
  const olsLast = ols.intercept + ols.slope * (recent.length - 1);
  const holt = fitHolt(series, alpha, beta);

  const residualStd = Math.max(
    stdDev(holt.residuals),
    // floor: gauge reading noise of ~1 cm so the band never collapses to zero
    0.01
  );

  const points: EnsemblePoint[] = [];
  const steps = Math.ceil(horizonHours / stepHours);
  for (let k = 1; k <= steps; k++) {
    const hour = k * stepHours;
    const olsVal = olsLast + ols.slope * k;
    const holtVal = holt.level + holt.trend * k;
    let dampSum = 0;
    for (let j = 1; j <= k; j++) dampSum += phi ** j;
    const dampedVal = holt.level + holt.trend * dampSum;

    const vals = [olsVal, holtVal, dampedVal];
    const mean = (olsVal + holtVal + dampedVal) / 3;
    const memberSpread = Math.max(...vals) - Math.min(...vals);
    const sigma = Math.sqrt(residualStd ** 2 * k + (memberSpread / 2) ** 2);
    const exceed = 1 - normalCdf((threshold - mean) / sigma);

    points.push({
      hour,
      mean,
      low: mean - Z80 * sigma,
      high: mean + Z80 * sigma,
      members: { ols: olsVal, holt: holtVal, damped: dampedVal },
      exceedProbability: Math.min(1, Math.max(0, exceed)),
    });
  }

  const slopePerHour = (points[0].mean - series[series.length - 1]) / stepHours;
  const perDayAbs = Math.abs(slopePerHour) * 24;
  const trend: EnsembleResult['trend'] =
    perDayAbs < 0.05 ? 'stable' : slopePerHour > 0 ? 'rising' : 'falling';

  const last = points[points.length - 1];
  const spreadAtEnd =
    Math.max(last.members.ols, last.members.holt, last.members.damped) -
    Math.min(last.members.ols, last.members.holt, last.members.damped);
  const agreement: EnsembleResult['agreement'] =
    spreadAtEnd < 0.15 ? 'high' : spreadAtEnd < 0.5 ? 'medium' : 'low';

  return {
    points,
    residualStd,
    trend,
    slopePerHour,
    firstCrossingHour: points.find((p) => p.mean >= threshold)?.hour ?? null,
    likelyCrossingHour: points.find((p) => p.exceedProbability >= 0.5)?.hour ?? null,
    watchCrossingHour: points.find((p) => p.exceedProbability >= 0.2)?.hour ?? null,
    agreement,
  };
}
