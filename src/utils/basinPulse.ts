import { LocationData, Language } from '../types';
import { LiveWeatherPayload } from './weatherTransform';

export type SignalPriority = 'CRITICAL_RIVER_BREACH' | 'UPSTREAM_SURGE_IN_TRANSIT' | 'CALM_MONITORING';

export interface SurgeImpactInfo {
  surgePressureIndex: number;
  estimatedSurgeArrivalHours: number | null;
  criticalUpstreamSources: string[];
}

export interface BasinSignalResult {
  priority: SignalPriority;
  status: 'critical' | 'warning' | 'normal';
  headlineEn: string;
  headlineBn: string;
  detailEn: string;
  detailBn: string;
  cherrapunjiRainfall24h: number | null;
  next24hRainfallMm: number | null;
  sevenDayHistory: number[];
  provenance: 'LIVE' | 'DERIVED' | 'SIMULATED';
  isDrySpell: boolean;
  activeLocationId?: string;
  riverLevelDeltaM?: number;
  etaHours?: number | null;
}

/**
 * Pure function to compute the top real-time hydrological signal for the operations room.
 *
 * Strict Priority:
 * 1. HIGH or CRITICAL upazila river breach / danger level threat
 * 2. Upstream surge wave in transit through Meghalaya-Surma basin corridor
 * 3. Calm state with next-24h forecast rainfall context
 */
export function computeSignal(
  locations: LocationData[],
  weather: LiveWeatherPayload | null,
  surgeImpact?: SurgeImpactInfo | null
): BasinSignalResult {
  const cherrapunjiRegion = weather?.regions?.cherrapunji;
  const cherrapunjiRainfall24h = cherrapunjiRegion?.past24hTotalMm ?? null;
  const next24hRainfallMm = cherrapunjiRegion?.next24hTotalMm ?? null;
  const sevenDayHistory = Array.isArray(cherrapunjiRegion?.daily7Days)
    ? cherrapunjiRegion.daily7Days.map((d) => d.precipitationMm)
    : [];

  const isLiveWeather = Boolean(weather?.isLive);
  const isDrySpell = (cherrapunjiRainfall24h ?? 0) <= 0.5 && (next24hRainfallMm ?? 0) <= 2.0;

  // PRIORITY 1: Check for any stations exceeding Danger Level or at HIGH/CRITICAL risk
  const breachedStations = [...locations]
    .filter((loc) => loc.riskLevel === 'CRITICAL' || loc.riskLevel === 'HIGH' || loc.currentWaterLevel >= loc.dangerLevel)
    .sort((a, b) => {
      const deltaA = a.currentWaterLevel - a.dangerLevel;
      const deltaB = b.currentWaterLevel - b.dangerLevel;
      return deltaB - deltaA; // Highest breach first
    });

  if (breachedStations.length > 0) {
    const topStation = breachedStations[0];
    const delta = Number((topStation.currentWaterLevel - topStation.dangerLevel).toFixed(2));
    const isAbove = delta >= 0;
    const absDelta = Math.abs(delta).toFixed(2);

    const deltaTextEn = isAbove ? `+${absDelta}m above Danger Mark` : `${absDelta}m below Danger Mark`;
    const deltaTextBn = isAbove ? `বিপদসীমার +${absDelta} মি. উপরে` : `বিপদসীমার ${absDelta} মি. নিচে`;

    return {
      priority: 'CRITICAL_RIVER_BREACH',
      status: topStation.riskLevel === 'CRITICAL' || isAbove ? 'critical' : 'warning',
      headlineEn: `${topStation.nameEn}: ${topStation.riverNameEn} River is ${deltaTextEn} (${topStation.riskLevel})`,
      headlineBn: `${topStation.nameBn}: ${topStation.riverNameBn} নদী ${deltaTextBn} (${topStation.riskLevel === 'CRITICAL' ? 'মারাত্মক ঝুঁকি' : 'উচ্চ ঝুঁকি'})`,
      detailEn: `Monitored station ${topStation.stationName} at stage ${topStation.currentWaterLevel.toFixed(2)}m (Danger Mark ${topStation.dangerLevel.toFixed(2)}m). 24h change: ${topStation.waterLevelChange24h >= 0 ? '+' : ''}${topStation.waterLevelChange24h.toFixed(2)}m.`,
      detailBn: `পাউবো গেজ ${topStation.stationName}: বর্তমান পানির উচ্চতা ${topStation.currentWaterLevel.toFixed(2)} মি. (বিপদসীমা ${topStation.dangerLevel.toFixed(2)} মি.)। ২৪ ঘণ্টায় পরিবর্তন: ${topStation.waterLevelChange24h >= 0 ? '+' : ''}${topStation.waterLevelChange24h.toFixed(2)} মি.।`,
      cherrapunjiRainfall24h,
      next24hRainfallMm,
      sevenDayHistory,
      provenance: isLiveWeather ? 'LIVE' : 'DERIVED',
      isDrySpell,
      activeLocationId: topStation.id,
      riverLevelDeltaM: delta,
    };
  }

  // PRIORITY 2: Check for upstream surge wave in transit
  if (
    surgeImpact &&
    surgeImpact.surgePressureIndex >= 40 &&
    surgeImpact.estimatedSurgeArrivalHours !== null &&
    surgeImpact.criticalUpstreamSources.length > 0
  ) {
    const eta = surgeImpact.estimatedSurgeArrivalHours;
    const sourcesStrEn = surgeImpact.criticalUpstreamSources.join(', ');

    return {
      priority: 'UPSTREAM_SURGE_IN_TRANSIT',
      status: 'warning',
      headlineEn: `Upstream surge in transit from ${sourcesStrEn} • ETA ~${eta.toFixed(0)}h`,
      headlineBn: `মেঘালয় পাহাড় থেকে পাহাড়ি ঢল সুরমা-সারি অববাহিকায় অগ্রসরমান • সম্ভাব্য আগাম সময় ~${eta.toFixed(0)} ঘণ্টা`,
      detailEn: `Hydraulic wave propagation speed ~1.8 m/s along transboundary river corridor. Catchment surge pressure index: ${surgeImpact.surgePressureIndex}/100.`,
      detailBn: `সীমান্তবর্তী পাহাড়ি নদী দিয়ে পানির ঢল নামছে। অববাহিকা প্রবাহ চাপ সূচক: ${surgeImpact.surgePressureIndex}/১০০।`,
      cherrapunjiRainfall24h,
      next24hRainfallMm,
      sevenDayHistory,
      provenance: 'DERIVED',
      isDrySpell: false,
      etaHours: eta,
    };
  }

  // PRIORITY 3: Calm monitoring state
  const nextRainTextEn =
    next24hRainfallMm !== null
      ? `Next 24h catchment rain: ${next24hRainfallMm.toFixed(1)} mm`
      : 'Catchment rainfall telemetry steady';
  const nextRainTextBn =
    next24hRainfallMm !== null
      ? `আগামী ২৪ ঘণ্টার সম্ভাব্য বৃষ্টি: ${next24hRainfallMm.toFixed(1)} মি.মি.`
      : 'অববাহিকায় আবহাওয়া শান্ত রয়েছে';

  return {
    priority: 'CALM_MONITORING',
    status: 'normal',
    headlineEn: `Basin calm • No upstream surge detected • ${nextRainTextEn}`,
    headlineBn: `অববাহিকা স্বাভাবিক • কোনো পাহাড়ি ঢল নেই • ${nextRainTextBn}`,
    detailEn: isDrySpell
      ? `Dry-spell conditions across Cherrapunji catchment (${cherrapunjiRainfall24h?.toFixed(1) ?? '0.0'} mm past 24h). Rivers flowing well below BWDB warning levels.`
      : `River levels across Sylhet and Sunamganj are within seasonal thresholds. Catchment 24h rainfall: ${cherrapunjiRainfall24h?.toFixed(1) ?? '—'} mm.`,
    detailBn: isDrySpell
      ? `চেরাপুঞ্জি ও সুরমা অববাহিকায় শুষ্ক আবহাওয়া বিরাজ করছে (বিগত ২৪ ঘণ্টায় ${cherrapunjiRainfall24h?.toFixed(1) ?? '০.০'} মি.মি.)। নদ-নদীর পানি সতর্কসীমার নিচে রয়েছে।`
      : `সিলেট ও সুনামগঞ্জের নদ-নদীর পানি স্বাভাবিক সীমার মধ্যে প্রবাহিত হচ্ছে। ২৪ ঘণ্টার বৃষ্টিপাত: ${cherrapunjiRainfall24h?.toFixed(1) ?? '—'} মি.মি.।`,
    cherrapunjiRainfall24h,
    next24hRainfallMm,
    sevenDayHistory,
    provenance: isLiveWeather ? 'LIVE' : 'DERIVED',
    isDrySpell,
  };
}
