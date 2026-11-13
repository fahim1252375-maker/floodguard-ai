/**
 * GloFAS River Discharge Data Module
 * Retrieves modelled daily river-discharge estimates from the Open-Meteo Flood API (GloFAS)
 * Endpoint: https://flood-api.open-meteo.com/v1/flood
 */

export interface RiverDischargePoint {
  date: string;
  timestamp: number;
  dischargeM3s: number;
  meanDischargeM3s: number | null;
  maxDischargeM3s: number | null;
  dischargeRatio: number | null; // discharge / mean
  isProjected: boolean;
}

export interface RiverDischargeRegion {
  stationId: 'sylhet' | 'sunamganj';
  basinName: string;
  riverName: string;
  coordinates: [number, number];
  currentDischargeM3s: number;
  meanDischargeM3s: number;
  maxDischargeM3s: number;
  dischargeRatio: number; // current / mean; use dataAvailable before displaying
  dataAvailable: boolean;
  dataDate: string | null;
  surgeStatus: 'UNKNOWN' | 'NORMAL' | 'ELEVATED' | 'SURGING' | 'CRITICAL';
  timeline: RiverDischargePoint[];
}

export interface LiveRiverPayload {
  success: boolean;
  source: 'LIVE_OPEN_METEO_GLOFAS' | 'SIMULATED_GLOFAS_FALLBACK';
  isLive: boolean;
  fetchedAt: string;
  cacheExpiresInSeconds: number;
  regions: {
    sylhet: RiverDischargeRegion;
    sunamganj: RiverDischargeRegion;
  };
}

/**
 * Classifies the hydrological surge status based on discharge ratio
 * (Ratio of current flow vs historical seasonal mean flow)
 */
export function classifySurgeStatus(
  ratio: number
): 'NORMAL' | 'ELEVATED' | 'SURGING' | 'CRITICAL' {
  if (ratio >= 2.0) return 'CRITICAL';
  if (ratio >= 1.4) return 'SURGING';
  if (ratio >= 1.15) return 'ELEVATED';
  return 'NORMAL';
}

/**
 * Parses raw JSON returned from Open-Meteo Flood API
 */
export function parseOpenMeteoFlood(
  stationId: 'sylhet' | 'sunamganj',
  basinName: string,
  riverName: string,
  coordinates: [number, number],
  rawJson: any
): RiverDischargeRegion {
  const daily = rawJson?.daily;
  const times: string[] = Array.isArray(daily?.time) ? daily.time : [];
  const discharges: (number | null)[] = Array.isArray(daily?.river_discharge)
    ? daily.river_discharge
    : [];
  const means: (number | null)[] = Array.isArray(daily?.river_discharge_mean)
    ? daily.river_discharge_mean
    : [];
  const maxes: (number | null)[] = Array.isArray(daily?.river_discharge_max)
    ? daily.river_discharge_max
    : [];

  // Flood discharge has a fixed daily model resolution. Request GMT to preserve
  // the source model's date labels and never shift the daily values to Dhaka time.
  const todayStr = new Date().toISOString().slice(0, 10);
  const timeline: RiverDischargePoint[] = [];

  for (let i = 0; i < times.length; i++) {
    const dateStr = times[i];
    const discharge = discharges[i];
    if (typeof discharge !== 'number' || !Number.isFinite(discharge) || discharge < 0) continue;
    const rawMean = means[i];
    const mean = typeof rawMean === 'number' && Number.isFinite(rawMean) && rawMean > 0 ? rawMean : null;
    const rawMax = maxes[i];
    const max = typeof rawMax === 'number' && Number.isFinite(rawMax) && rawMax >= 0 ? rawMax : null;
    const ratio = mean !== null ? Number((discharge / mean).toFixed(2)) : null;
    const isProjected = dateStr > todayStr;

    timeline.push({
      date: dateStr,
      timestamp: new Date(`${dateStr}T00:00:00Z`).getTime(),
      dischargeM3s: Math.round(discharge * 10) / 10,
      meanDischargeM3s: mean === null ? null : Math.round(mean * 10) / 10,
      maxDischargeM3s: max === null ? null : Math.round(max * 10) / 10,
      dischargeRatio: ratio,
      isProjected,
    });
  }

  // A current value is the latest valid non-projected model day, not a fabricated
  // midpoint or a placeholder when today's value is absent.
  const currentPoint = [...timeline].reverse().find((point) => !point.isProjected);
  const dataAvailable = Boolean(currentPoint);
  const currentDischarge = currentPoint?.dischargeM3s ?? 0;
  const meanDischarge = currentPoint?.meanDischargeM3s ?? 0;
  const maxDischarge = currentPoint?.maxDischargeM3s ?? 0;
  const ratio = currentPoint?.dischargeRatio ?? 0;
  const surgeStatus = currentPoint?.dischargeRatio !== null && currentPoint?.dischargeRatio !== undefined
    ? classifySurgeStatus(currentPoint.dischargeRatio)
    : 'UNKNOWN';

  return {
    stationId,
    basinName,
    riverName,
    coordinates,
    currentDischargeM3s: currentDischarge,
    meanDischargeM3s: meanDischarge,
    maxDischargeM3s: maxDischarge,
    dischargeRatio: ratio,
    dataAvailable,
    dataDate: currentPoint?.date ?? null,
    surgeStatus,
    timeline,
  };
}

/**
 * Robust fallback generator when Open-Meteo Flood API is unreachable
 */
export function generateFallbackRiverData(): LiveRiverPayload {
  const today = new Date();
  const buildFallbackTimeline = (baseDischarge: number, baseMean: number): RiverDischargePoint[] => {
    const points: RiverDischargePoint[] = [];
    for (let i = -7; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const variance = Math.sin(i / 2) * 80 + (i > 0 ? i * 25 : 0);
      const discharge = Math.max(150, Math.round(baseDischarge + variance));
      const mean = baseMean;
      const max = Math.round(baseMean * 2.2);
      const ratio = Number((discharge / mean).toFixed(2));

      points.push({
        date: dateStr,
        timestamp: d.getTime(),
        dischargeM3s: discharge,
        meanDischargeM3s: mean,
        maxDischargeM3s: max,
        dischargeRatio: ratio,
        isProjected: i > 0,
      });
    }
    return points;
  };

  const sylhetTimeline = buildFallbackTimeline(580, 420);
  const sunamganjTimeline = buildFallbackTimeline(740, 510);

  const sylhetCurrent = sylhetTimeline[7];
  const sunamganjCurrent = sunamganjTimeline[7];

  return {
    success: true,
    source: 'SIMULATED_GLOFAS_FALLBACK',
    isLive: false,
    fetchedAt: new Date().toISOString(),
    cacheExpiresInSeconds: 1800,
    regions: {
      sylhet: {
        stationId: 'sylhet',
        dataAvailable: true,
        dataDate: sylhetCurrent.date,
        basinName: 'Surma Upper Basin',
        riverName: 'Surma River at Sylhet Point',
        coordinates: [24.8949, 91.8687],
        currentDischargeM3s: sylhetCurrent.dischargeM3s,
        meanDischargeM3s: sylhetCurrent.meanDischargeM3s ?? 420,
        maxDischargeM3s: sylhetCurrent.maxDischargeM3s ?? Math.round(420 * 2.2),
        dischargeRatio: sylhetCurrent.dischargeRatio ?? sylhetCurrent.dischargeM3s / 420,
        surgeStatus: classifySurgeStatus(sylhetCurrent.dischargeRatio ?? sylhetCurrent.dischargeM3s / 420),
        timeline: sylhetTimeline,
      },
      sunamganj: {
        stationId: 'sunamganj',
        dataAvailable: true,
        dataDate: sunamganjCurrent.date,
        basinName: 'Central Haor Sink',
        riverName: 'Surma-Jadukata Confluence at Sunamganj',
        coordinates: [25.0658, 91.4073],
        currentDischargeM3s: sunamganjCurrent.dischargeM3s,
        meanDischargeM3s: sunamganjCurrent.meanDischargeM3s ?? 510,
        maxDischargeM3s: sunamganjCurrent.maxDischargeM3s ?? Math.round(510 * 2.2),
        dischargeRatio: sunamganjCurrent.dischargeRatio ?? sunamganjCurrent.dischargeM3s / 510,
        surgeStatus: classifySurgeStatus(sunamganjCurrent.dischargeRatio ?? sunamganjCurrent.dischargeM3s / 510),
        timeline: sunamganjTimeline,
      },
    },
  };
}
