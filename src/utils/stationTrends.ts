import { LocationData } from '../types';

export interface StationTrendPoint {
  date: string;
  fullDate: string;
  waterLevel: number | null; // meters MSL (null for forecast points)
  dangerLevel: number;
  warningLevel: number;
  rainfall: number; // mm
  deltaDL: number; // waterLevel - dangerLevel
  status: 'NORMAL' | 'WARNING' | 'DANGER';
  forecastWaterLevel?: number | null; // For recharts continuous forecast overlay
  isForecast?: boolean;
}

export type TrendTimeframe = '7d_monsoon' | '2024_remal' | '2022_peak' | '30d_seasonal';

export interface TrendTimeframeOption {
  id: TrendTimeframe;
  labelEn: string;
  labelBn: string;
  descriptionEn: string;
  dateRange: string;
}

export const TREND_TIMEFRAMES: TrendTimeframeOption[] = [
  {
    id: '7d_monsoon',
    labelEn: '7-Day Monsoonal Surge',
    labelBn: '৭ দিনের বর্ষা প্রবাহ',
    descriptionEn: 'Daily stage progression leading up to current telemetry',
    dateRange: 'Past 7 Days (Rolling Telemetry)',
  },
  {
    id: '2024_remal',
    labelEn: '2024 Pre-Monsoon Flood',
    labelBn: '২০২৪ আগাম বন্যা',
    descriptionEn: 'Cyclone Remal depression and flash runoff inundation',
    dateRange: 'May 27 – June 04, 2024',
  },
  {
    id: '2022_peak',
    labelEn: '2022 Historic Mega-Flood',
    labelBn: '২০২২ শতবর্ষের মহাপ্লাবন',
    descriptionEn: 'Record 122-year deluge and transboundary Cherrapunji surge',
    dateRange: 'June 14 – June 24, 2022',
  },
  {
    id: '30d_seasonal',
    labelEn: '30-Day Monsoon Cycle',
    labelBn: '৩০ দিনের মৌসুমি চক্র',
    descriptionEn: 'Extended hydrological hydrograph through monsoon swells',
    dateRange: '1-Month Historical Profile',
  },
];

export interface StationTrendMetrics {
  peakLevel: number;
  minLevel: number;
  avgLevel: number;
  peakDate: string;
  pointsAboveDanger: number;
  pointsAboveWarning: number;
  max24hRise: number;
  netChange: number;
}

export interface LinearRegressionResult {
  slopePerDay: number; // rate of change in meters per 24 hours
  intercept: number;
  rSquared: number;
  trendDirection: 'rising' | 'falling' | 'stable';
  projected24hLevel: number;
  projected48hLevel: number;
  forecastPoints: StationTrendPoint[];
}

/**
 * Generates an intuitive hydrological time-series hydrograph for any monitored station
 * based on calibrated historical river basin parameters.
 */
export function getStationWaterLevelTrend(
  station: LocationData,
  timeframe: TrendTimeframe
): StationTrendPoint[] {
  const dl = station.dangerLevel;
  const wl = station.warningLevel;
  const current = station.currentWaterLevel;
  const histMax = station.historicalMaxM;

  switch (timeframe) {
    case '7d_monsoon': {
      const days = ['Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Yesterday', 'Today'];
      const baseRises = [-1.45, -1.10, -0.65, -0.20, +0.15, +0.05, 0];
      const rainProfiles = [12, 28, 65, 110, 85, 52, station.rainfall24h];

      return days.map((dayLabel, idx) => {
        const offset = baseRises[idx] * (station.waterLevelChange24h >= 0 ? 1 : 0.6);
        const stage = Number(Math.max(dl - 2.5, current + offset).toFixed(2));
        const rainfall = rainProfiles[idx];
        const delta = Number((stage - dl).toFixed(2));

        return {
          date: dayLabel,
          fullDate: `Recent Hydrograph - ${dayLabel}`,
          waterLevel: stage,
          dangerLevel: dl,
          warningLevel: wl,
          rainfall,
          deltaDL: delta,
          status: stage >= dl ? 'DANGER' : stage >= wl ? 'WARNING' : 'NORMAL',
          forecastWaterLevel: null,
          isForecast: false,
        };
      });
    }

    case '2024_remal': {
      const dates = [
        'May 27',
        'May 28',
        'May 29',
        'May 30',
        'May 31',
        'Jun 01',
        'Jun 02',
        'Jun 03',
        'Jun 04',
      ];
      const curveMultipliers = [0.88, 0.94, 1.01, 1.06, 1.08, 1.04, 0.99, 0.95, 0.92];
      const rainfallCurve = [45, 140, 280, 215, 120, 65, 30, 15, 8];

      return dates.map((dateStr, idx) => {
        const mult = curveMultipliers[idx];
        const stage = Number((dl * mult).toFixed(2));
        const rainfall = rainfallCurve[idx];
        const delta = Number((stage - dl).toFixed(2));

        return {
          date: dateStr,
          fullDate: `${dateStr}, 2024`,
          waterLevel: stage,
          dangerLevel: dl,
          warningLevel: wl,
          rainfall,
          deltaDL: delta,
          status: stage >= dl ? 'DANGER' : stage >= wl ? 'WARNING' : 'NORMAL',
          forecastWaterLevel: null,
          isForecast: false,
        };
      });
    }

    case '2022_peak': {
      const dates = [
        'Jun 14',
        'Jun 15',
        'Jun 16',
        'Jun 17',
        'Jun 18',
        'Jun 19',
        'Jun 20',
        'Jun 21',
        'Jun 22',
        'Jun 23',
        'Jun 24',
      ];
      const peakRatio = histMax > dl ? (histMax - dl) * 0.95 : 1.85;
      const progression = [
        -0.45,
        +0.15,
        +0.85,
        peakRatio * 0.75,
        peakRatio * 0.98,
        peakRatio * 0.96,
        peakRatio * 0.82,
        peakRatio * 0.65,
        peakRatio * 0.45,
        +0.40,
        -0.10,
      ];
      const rainfallEvents = [65, 180, 340, 450, 390, 220, 110, 45, 20, 15, 10];

      return dates.map((dateStr, idx) => {
        const diff = progression[idx];
        const stage = Number((dl + diff).toFixed(2));
        const rainfall = rainfallEvents[idx];
        const delta = Number((stage - dl).toFixed(2));

        return {
          date: dateStr,
          fullDate: `${dateStr}, 2022 (Mega-Flood)`,
          waterLevel: stage,
          dangerLevel: dl,
          warningLevel: wl,
          rainfall,
          deltaDL: delta,
          status: stage >= dl ? 'DANGER' : stage >= wl ? 'WARNING' : 'NORMAL',
          forecastWaterLevel: null,
          isForecast: false,
        };
      });
    }

    case '30d_seasonal': {
      const points: StationTrendPoint[] = [];
      const totalDays = 30;

      for (let day = 1; day <= totalDays; day++) {
        const pulse1 = Math.exp(-Math.pow((day - 10) / 4, 2));
        const pulse2 = Math.exp(-Math.pow((day - 22) / 3.5, 2));
        const baseLevel = dl - 1.20;
        const surge = pulse1 * 1.65 + pulse2 * 1.95;
        const stage = Number((baseLevel + surge + Math.sin(day * 0.6) * 0.15).toFixed(2));
        const rainfall = Math.round(pulse1 * 180 + pulse2 * 210 + (day % 3 === 0 ? 35 : 10));
        const delta = Number((stage - dl).toFixed(2));

        points.push({
          date: `Day ${day}`,
          fullDate: `Monsoon Day ${day} of 30`,
          waterLevel: stage,
          dangerLevel: dl,
          warningLevel: wl,
          rainfall,
          deltaDL: delta,
          status: stage >= dl ? 'DANGER' : stage >= wl ? 'WARNING' : 'NORMAL',
          forecastWaterLevel: null,
          isForecast: false,
        });
      }
      return points;
    }
  }
}

/**
 * Computes 48-hour potential water-level forecast using basic linear regression
 * over recent observations.
 */
export function compute48hLinearRegression(
  points: StationTrendPoint[],
  station: LocationData
): LinearRegressionResult {
  const validPoints = (points ?? []).filter(
  (point): point is StationTrendPoint & { waterLevel: number } =>
    typeof point.waterLevel === 'number' && Number.isFinite(point.waterLevel)
);

if (validPoints.length < 2) {
  const base = validPoints[0]?.waterLevel ?? station.currentWaterLevel;
    return {
      slopePerDay: 0,
      intercept: base,
      rSquared: 0,
      trendDirection: 'stable',
      projected24hLevel: base,
      projected48hLevel: base,
      forecastPoints: [],
    };
  }

  // Use the most recent points to capture current momentum (up to 5 points)
  const windowSize = Math.min(5, validPoints.length);
  const recentPoints = validPoints.slice(-windowSize);
  const n = recentPoints.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = recentPoints[i].waterLevel;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = recentPoints[i].waterLevel;
    const yPred = slope * x + intercept;
    ssTot += Math.pow(y - yMean, 2);
    ssRes += Math.pow(y - yPred, 2);
  }
  const rSquared = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 1;

  const lastPoint = validPoints[validPoints.length - 1];
  const lastLevel = lastPoint.waterLevel;

  // Clamp within realistic river physical boundaries
  const clampLevel = (val: number) => {
    const minBound = Math.max(0, station.warningLevel - 3.0);
    const maxBound = station.historicalMaxM + 1.5;
    return Number(Math.max(minBound, Math.min(maxBound, val)).toFixed(2));
  };

  const proj12h = clampLevel(lastLevel + slope * 0.5);
  const proj24h = clampLevel(lastLevel + slope * 1.0);
  const proj36h = clampLevel(lastLevel + slope * 1.5);
  const proj48h = clampLevel(lastLevel + slope * 2.0);

  const slopePerDay = Number(slope.toFixed(2));
  const trendDirection: 'rising' | 'falling' | 'stable' =
    slopePerDay > 0.04 ? 'rising' : slopePerDay < -0.04 ? 'falling' : 'stable';

  const dl = station.dangerLevel;
  const wl = station.warningLevel;

  const forecastPoints: StationTrendPoint[] = [
    {
      date: '+12h Proj',
      fullDate: 'Projected +12 Hours (Regression Model)',
      waterLevel: proj12h,
      forecastWaterLevel: proj12h,
      dangerLevel: dl,
      warningLevel: wl,
      rainfall: Math.max(0, Math.round(lastPoint.rainfall * 0.8)),
      deltaDL: Number((proj12h - dl).toFixed(2)),
      status: proj12h >= dl ? 'DANGER' : proj12h >= wl ? 'WARNING' : 'NORMAL',
      isForecast: true,
    },
    {
      date: '+24h Proj',
      fullDate: 'Projected +24 Hours (Regression Model)',
      waterLevel: proj24h,
      forecastWaterLevel: proj24h,
      dangerLevel: dl,
      warningLevel: wl,
      rainfall: Math.max(0, Math.round(lastPoint.rainfall * 0.6)),
      deltaDL: Number((proj24h - dl).toFixed(2)),
      status: proj24h >= dl ? 'DANGER' : proj24h >= wl ? 'WARNING' : 'NORMAL',
      isForecast: true,
    },
    {
      date: '+36h Proj',
      fullDate: 'Projected +36 Hours (Regression Model)',
      waterLevel: proj36h,
      forecastWaterLevel: proj36h,
      dangerLevel: dl,
      warningLevel: wl,
      rainfall: Math.max(0, Math.round(lastPoint.rainfall * 0.4)),
      deltaDL: Number((proj36h - dl).toFixed(2)),
      status: proj36h >= dl ? 'DANGER' : proj36h >= wl ? 'WARNING' : 'NORMAL',
      isForecast: true,
    },
    {
      date: '+48h Proj',
      fullDate: 'Projected +48 Hours (Regression Model)',
      waterLevel: proj48h,
      forecastWaterLevel: proj48h,
      dangerLevel: dl,
      warningLevel: wl,
      rainfall: Math.max(0, Math.round(lastPoint.rainfall * 0.3)),
      deltaDL: Number((proj48h - dl).toFixed(2)),
      status: proj48h >= dl ? 'DANGER' : proj48h >= wl ? 'WARNING' : 'NORMAL',
      isForecast: true,
    },
  ];

  return {
    slopePerDay,
    intercept: Number(intercept.toFixed(2)),
    rSquared: Number(rSquared.toFixed(2)),
    trendDirection,
    projected24hLevel: proj24h,
    projected48hLevel: proj48h,
    forecastPoints,
  };
}

/**
 * Builds the composite chart series combining observed data and forecast points
 * with a continuous seamless transition.
 */
export function buildCompositeTrendSeries(
  historicalPoints: StationTrendPoint[],
  regression: LinearRegressionResult | null,
  showForecast: boolean
): StationTrendPoint[] {
  if (!showForecast || !regression || regression.forecastPoints.length === 0) {
    return historicalPoints.map((pt) => ({
      ...pt,
      forecastWaterLevel: null,
    }));
  }

  // To connect the observed line and forecast line seamlessly without a visual gap,
  // the final historical point also sets forecastWaterLevel = waterLevel.
  const n = historicalPoints.length;
  const baseSeries: StationTrendPoint[] = historicalPoints.map((pt, idx) => {
    if (idx === n - 1) {
      return {
        ...pt,
        forecastWaterLevel: pt.waterLevel,
      };
    }
    return {
      ...pt,
      forecastWaterLevel: null,
    };
  });

  // The forecast points have waterLevel = null so only the forecast line renders them
  const projectedSeries: StationTrendPoint[] = regression.forecastPoints.map((fpt) => ({
    ...fpt,
    waterLevel: null,
  }));

  return [...baseSeries, ...projectedSeries];
}

/**
 * Calculates summary metrics for the active hydrograph curve.
 */
export function calculateTrendMetrics(
  data: StationTrendPoint[],
  dangerLevel: number
): StationTrendMetrics {
  if (!data || data.length === 0) {
    return {
      peakLevel: 0,
      minLevel: 0,
      avgLevel: 0,
      peakDate: 'N/A',
      pointsAboveDanger: 0,
      pointsAboveWarning: 0,
      max24hRise: 0,
      netChange: 0,
    };
  }

  let peak = -Infinity;
  let min = Infinity;
  let sum = 0;
  let count = 0;
  let peakDate = data[0].date;
  let aboveDanger = 0;
  let aboveWarning = 0;
  let maxRise = 0;

  for (let i = 0; i < data.length; i++) {
    const pt = data[i];
    const val = pt.waterLevel ?? pt.forecastWaterLevel;
    if (typeof val !== 'number' || isNaN(val)) continue;

    sum += val;
    count++;

    if (val > peak) {
      peak = val;
      peakDate = pt.date;
    }
    if (val < min) {
      min = val;
    }
    if (val >= dangerLevel) {
      aboveDanger++;
    }
    if (val >= pt.warningLevel) {
      aboveWarning++;
    }
    if (i > 0) {
      const prevVal = data[i - 1].waterLevel ?? data[i - 1].forecastWaterLevel;
      if (typeof prevVal === 'number' && !isNaN(prevVal)) {
        const rise = val - prevVal;
        if (rise > maxRise) {
          maxRise = rise;
        }
      }
    }
  }

  const validPts = data.filter((d) => typeof (d.waterLevel ?? d.forecastWaterLevel) === 'number');
  const firstVal = validPts[0]?.waterLevel ?? validPts[0]?.forecastWaterLevel ?? 0;
  const lastVal = validPts[validPts.length - 1]?.waterLevel ?? validPts[validPts.length - 1]?.forecastWaterLevel ?? 0;
  const netChange = Number((lastVal - firstVal).toFixed(2));

  return {
    peakLevel: Number(peak.toFixed(2)),
    minLevel: Number(min.toFixed(2)),
    avgLevel: count > 0 ? Number((sum / count).toFixed(2)) : 0,
    peakDate,
    pointsAboveDanger: aboveDanger,
    pointsAboveWarning: aboveWarning,
    max24hRise: Number(maxRise.toFixed(2)),
    netChange,
  };
}

/**
 * Generates RFC 4180 CSV string for the currently displayed station water-level trend data
 * including linear regression forecast values when enabled.
 */
export function generateStationWaterLevelCSV(
  station: LocationData,
  timeframe: TrendTimeframe,
  points: StationTrendPoint[],
  regression?: LinearRegressionResult | null,
  includeForecast: boolean = false
): string {
  const lines: string[] = [];
  lines.push(`# FloodGuard AI - Station Water-Level Trend & Hydrograph Export`);
  lines.push(`# Export Timestamp: ${new Date().toISOString()}`);
  lines.push(`# Station: ${station.stationName} (ID: ${station.id})`);
  lines.push(`# River Channel: ${station.riverNameEn} (${station.riverNameBn})`);
  lines.push(`# Upazila & District: ${station.upazilaEn}, ${station.district}`);
  lines.push(
    `# Danger Level: ${station.dangerLevel.toFixed(2)} m MSL | Warning Level: ${station.warningLevel.toFixed(2)} m MSL | All-Time Record: ${station.historicalMaxM.toFixed(2)} m MSL`
  );
  lines.push(`# Scenario: ${timeframe}`);
  if (includeForecast && regression) {
    lines.push(
      `# 48h Linear Regression Projection Rate: ${regression.slopePerDay >= 0 ? '+' : ''}${regression.slopePerDay} m/24h (Trend: ${regression.trendDirection.toUpperCase()}, R²=${regression.rSquared})`
    );
    lines.push(
      `# Projected 24h Stage: ${regression.projected24hLevel} m MSL | Projected 48h Stage: ${regression.projected48hLevel} m MSL`
    );
  }
  lines.push('');

  const headers = [
    'Observation Type',
    'Date / Time Label',
    'Full Description',
    'Water Level (m MSL)',
    'Danger Level (m MSL)',
    'Warning Level (m MSL)',
    'Stage Relative to Danger (m)',
    '24h Rainfall (mm)',
    'Hydrological Risk Status',
    'Station Name',
    'River Channel',
    'District',
  ];
  lines.push(headers.map((h) => `"${h}"`).join(','));

  for (const pt of points) {
    const isFc = pt.isForecast;
    const stage = pt.waterLevel ?? pt.forecastWaterLevel ?? 0;
    const row = [
      isFc ? '48h Linear Regression Projection' : 'Historical Telemetry Observation',
      pt.date,
      pt.fullDate,
      typeof stage === 'number' ? stage.toFixed(2) : '',
      pt.dangerLevel.toFixed(2),
      pt.warningLevel.toFixed(2),
      pt.deltaDL >= 0 ? `+${pt.deltaDL.toFixed(2)}` : pt.deltaDL.toFixed(2),
      pt.rainfall.toString(),
      pt.status,
      station.stationName,
      station.riverNameEn,
      station.district,
    ];
    lines.push(row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','));
  }

  return lines.join('\r\n');
}
