import { calculateFloodRisk } from './floodAlgorithm';
import { LocationData, RiskLevel } from '../types';

export interface BacktestHourlyPoint {
  time: string; // ISO or formatted date "YYYY-MM-DD HH:00"
  timestamp: number;
  hourIndex: number;
  sylhetRain1hMm: number;
  cherraRain1hMm: number;
  sylhetRain24hMm: number;
  cherraRain24hMm: number;
  waterLevelM: number;
  dangerLevelM: number;
  warningLevelM: number;
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface BacktestSummary {
  success: boolean;
  isLiveArchiveData: boolean;
  eventName: string;
  startDate: string;
  endDate: string;
  peakDate: string;
  peakWaterLevelM: number;
  dangerLevelM: number;
  warningLevelM: number;
  warningTriggeredAt: string | null;
  warningScenarioIntervalHours: number;
  dangerTriggeredAt: string | null;
  dangerScenarioIntervalHours: number;
  totalSylhetRainfallMm: number;
  totalCherrapunjiRainfallMm: number;
  max24hCherrapunjiRainfallMm: number;
  methodologyDescription: string;
  timeline: BacktestHourlyPoint[];
}

const SYLHET_STATION_TEMPLATE: LocationData = {
  id: 'sylhet-sadar',
  nameEn: 'Sylhet Sadar',
  nameBn: 'সিলেট সদর',
  district: 'Sylhet',
  upazilaEn: 'Sylhet Sadar',
  upazilaBn: 'সিলেট সদর',
  riverNameEn: 'Surma River',
  riverNameBn: 'সুরমা নদী',
  stationName: 'Sylhet (SW267)',
  coordinates: [24.8949, 91.8687],
  currentWaterLevel: 9.6,
  dangerLevel: 10.8,
  warningLevel: 10.3,
  waterLevelChange24h: 0.1,
  rainfall24h: 30,
  rainfallTrend: 'rising',
  riskLevel: 'LOW',
  riskScore: 20,
  soilSaturationPercent: 65,
  upstreamRainfallMm: 120,
  populationExposed: 480000,
  sheltersCount: 42,
  historicalMaxM: 12.02,
  lastUpdated: 'Historical Backtest',
  isSimulated: false,
};

/**
 * Computes rolling 24-hour sum for an hourly array
 */
export function computeRolling24h(arr: number[]): number[] {
  const result: number[] = new Array(arr.length).fill(0);
  let currentSum = 0;
  for (let i = 0; i < arr.length; i++) {
    currentSum += arr[i] || 0;
    if (i >= 24) {
      currentSum -= arr[i - 24] || 0;
    }
    result[i] = Number(Math.max(0, currentSum).toFixed(1));
  }
  return result;
}

/**
 * Executes the hour-by-hour flood algorithm on June 2022 rainfall series
 */
export function runJune2022Backtest(
  times: string[],
  sylhetPrecip: number[],
  cherraPrecip: number[],
  isLiveArchiveData: boolean = true
): BacktestSummary {
  const n = Math.min(times.length, sylhetPrecip.length, cherraPrecip.length);
  const sylhet24h = computeRolling24h(sylhetPrecip.slice(0, n));
  const cherra24h = computeRolling24h(cherraPrecip.slice(0, n));

  const timeline: BacktestHourlyPoint[] = [];

  // Simplified illustrative river-stage response. It is not a calibrated or validated
  // hydrodynamic reconstruction and must not be interpreted as observed BWDB stage data..
  let currentWaterLevel = 9.55;
  let previousWaterLevel = 9.55;

  let warningTriggeredAt: string | null = null;
  let warningHourIndex: number | null = null;

  let dangerTriggeredAt: string | null = null;
  let dangerHourIndex: number | null = null;

  let peakWaterLevel = 9.55;
  let peakHourIndex = 0;
  let peakDate = times[0] || '2022-06-18T12:00';

  for (let i = 0; i < n; i++) {
    const timeStr = times[i];
    const sRain1h = sylhetPrecip[i] || 0;
    const cRain1h = cherraPrecip[i] || 0;
    const s24h = sylhet24h[i] || 0;
    const c24h = cherra24h[i] || 0;

    // Upstream delayed runoff inflow (Meghalaya steep slope to Surma river channel)
    // Cherrapunji received extreme 500-900mm pulses June 14-17
    const upstreamInflowWeight = (c24h / 500) * 0.038;
    const localRainInflow = (s24h / 200) * 0.018;
    const drainageOutflow = Math.max(0.005, (currentWaterLevel - 9.2) * 0.006);

    const deltaHour = (upstreamInflowWeight + localRainInflow - drainageOutflow);
    currentWaterLevel = Math.max(9.4, Math.min(12.05, currentWaterLevel + deltaHour));

    if (currentWaterLevel > peakWaterLevel) {
      peakWaterLevel = Number(currentWaterLevel.toFixed(2));
      peakHourIndex = i;
      peakDate = timeStr;
    }

    // 24-hour rate of change
    const delta24h = Number((currentWaterLevel - previousWaterLevel).toFixed(2));
    if (i % 24 === 0) {
      previousWaterLevel = currentWaterLevel;
    }

    // Trend
    const rainfallTrend = s24h > (sylhet24h[Math.max(0, i - 6)] || s24h) ? 'rising' : 'falling';

    // Discharge ratio estimation based on upstream deluge
    const dischargeRatio = Number(Math.max(0.8, 1.0 + (c24h / 450) * 0.95).toFixed(2));

    // Run existing transparent risk algorithm
    const prediction = calculateFloodRisk(
      {
        locationId: 'sylhet-sadar',
        waterLevelM: Number(currentWaterLevel.toFixed(2)),
        waterLevelChangeM: delta24h,
        rainfallMm: s24h,
        upstreamRainfallMm: c24h,
        rainfallTrend,
        durationHours: 24,
        dischargeRatio,
      },
      SYLHET_STATION_TEMPLATE
    );

    const point: BacktestHourlyPoint = {
      time: timeStr,
      timestamp: new Date(timeStr).getTime(),
      hourIndex: i,
      sylhetRain1hMm: sRain1h,
      cherraRain1hMm: cRain1h,
      sylhetRain24hMm: s24h,
      cherraRain24hMm: c24h,
      waterLevelM: Number(currentWaterLevel.toFixed(2)),
      dangerLevelM: 10.8,
      warningLevelM: 10.3,
      riskScore: prediction.riskScore,
      riskLevel: prediction.riskLevel,
    };

    timeline.push(point);

    // Track first warning trigger (MODERATE or higher)
    if (!warningTriggeredAt && (prediction.riskLevel === 'MODERATE' || prediction.riskScore >= 35)) {
      warningTriggeredAt = timeStr;
      warningHourIndex = i;
    }

    // Track first danger trigger (HIGH or CRITICAL)
    if (!dangerTriggeredAt && (prediction.riskLevel === 'HIGH' || prediction.riskLevel === 'CRITICAL' || prediction.riskScore >= 58)) {
      dangerTriggeredAt = timeStr;
      dangerHourIndex = i;
    }
  }

  // Calculate scenario intervals before the modelled peak; these are not observed warning lead times.
  const warningScenarioIntervalHours =
    warningHourIndex !== null && peakHourIndex > warningHourIndex
      ? peakHourIndex - warningHourIndex
      : 0;

  const dangerScenarioIntervalHours =
    dangerHourIndex !== null && peakHourIndex > dangerHourIndex
      ? peakHourIndex - dangerHourIndex
      : 0;

  const totalSylhet = Number(sylhetPrecip.reduce((acc, v) => acc + (v || 0), 0).toFixed(1));
  const totalCherra = Number(cherraPrecip.reduce((acc, v) => acc + (v || 0), 0).toFixed(1));
  const max24hCherra = Math.max(...cherra24h, 0);

  return {
    success: true,
    isLiveArchiveData,
    eventName: 'June 2022 Sylhet-Sunamganj Mega Flash Flood',
    startDate: times[0] || '2022-06-10T00:00',
    endDate: times[times.length - 1] || '2022-06-22T23:00',
    peakDate,
    peakWaterLevelM: peakWaterLevel,
    dangerLevelM: 10.8,
    warningLevelM: 10.3,
    warningTriggeredAt,
    warningScenarioIntervalHours,
    dangerTriggeredAt,
    dangerScenarioIntervalHours,
    totalSylhetRainfallMm: totalSylhet,
    totalCherrapunjiRainfallMm: totalCherra,
    max24hCherrapunjiRainfallMm: max24hCherra,
    methodologyDescription:
      'Hourly Open-Meteo Archive precipitation (when available) or reconstructed fallback rainfall is passed through a simplified illustrative runoff and river-stage response. The stage trace is synthetic, the thresholds are configurable references, and the reported timing is an interval before the modelled scenario peak—not an observed river crest, verified BWDB record, calibrated hydrodynamic simulation, or measured warning lead time.',
    timeline,
  };
}

/**
 * Realistic reconstructed June 10-22, 2022 hourly rainfall archive fallback
 * Captures the historic cloudburst pulses recorded across the Meghalaya ridge.
 */
export function generateJune2022FallbackDataset(): {
  times: string[];
  sylhetPrecip: number[];
  cherraPrecip: number[];
} {
  const times: string[] = [];
  const sylhetPrecip: number[] = [];
  const cherraPrecip: number[] = [];

  const start = new Date('2022-06-10T00:00:00+06:00');
  const totalHours = 13 * 24; // June 10 to June 22

  for (let h = 0; h < totalHours; h++) {
    const cur = new Date(start.getTime() + h * 3600 * 1000);
    const timeStr = cur.toISOString().slice(0, 16);
    times.push(timeStr);

    const day = Math.floor(h / 24); // Day 0 is June 10, Day 4 is June 14, Day 7 is June 17, Day 8 is June 18
    const hourOfDay = h % 24;

    // Cherrapunji experienced moderate rain June 10-13, then phenomenal 500-970mm/day rain June 14-17
    let cherraBase = 4;
    let sylhetBase = 2;

    if (day >= 4 && day <= 8) {
      // Peak storm days (June 14 - 18)
      cherraBase = 28 + Math.sin((hourOfDay / 24) * Math.PI * 2) * 14;
      sylhetBase = 12 + Math.cos((hourOfDay / 24) * Math.PI * 2) * 7;
      if (day === 6 || day === 7) {
        // Extreme cloudburst June 16-17
        cherraBase += 22;
        sylhetBase += 10;
      }
    } else if (day >= 1 && day <= 3) {
      cherraBase = 12 + Math.sin(h) * 6;
      sylhetBase = 5 + Math.cos(h) * 3;
    } else {
      cherraBase = 5 + Math.sin(h) * 3;
      sylhetBase = 2 + Math.cos(h) * 2;
    }

    cherraPrecip.push(Number(Math.max(0, cherraBase).toFixed(1)));
    sylhetPrecip.push(Number(Math.max(0, sylhetBase).toFixed(1)));
  }

  return { times, sylhetPrecip, cherraPrecip };
}
