import { LocationData, RiskLevel } from '../types';
import { calculateFloodRisk } from './floodAlgorithm';

export interface OpenMeteoHourlyRaw {
  time?: string[];
  precipitation?: number[];
  rain?: number[];
  showers?: number[];
}

export interface OpenMeteoDailyRaw {
  time?: string[];
  precipitation_sum?: number[];
  precipitation_hours?: number[];
}

export interface OpenMeteoResponseRaw {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  hourly?: OpenMeteoHourlyRaw;
  daily?: OpenMeteoDailyRaw;
}

export interface RegionWeatherData {
  regionId: 'sylhet' | 'sunamganj' | 'cherrapunji';
  regionName: string;
  latitude: number;
  longitude: number;
  currentHourlyMm: number;
  past24hTotalMm: number;
  next24hTotalMm: number;
  daily7Days: {
    date: string;
    precipitationMm: number;
  }[];
  sevenDaySumMm: number;
}

export interface LiveWeatherPayload {
  success: boolean;
  source: 'LIVE_OPEN_METEO' | 'SIMULATED_FALLBACK';
  isLive: boolean;
  fetchedAt: string;
  cacheExpiresInSeconds: number;
  regions: {
    sylhet: RegionWeatherData;
    sunamganj: RegionWeatherData;
    cherrapunji: RegionWeatherData;
  };
  offlineNotice?: string;
}

/**
 * Parses raw Open-Meteo API response for a single region
 */
export function parseOpenMeteoRegion(
  regionId: 'sylhet' | 'sunamganj' | 'cherrapunji',
  regionName: string,
  raw: OpenMeteoResponseRaw,
  now: Date = new Date()
): RegionWeatherData {
  const hourlyPrecip = raw.hourly?.precipitation || raw.hourly?.rain || [];
  const hourlyTimes = raw.hourly?.time || [];
  const dailyDates = raw.daily?.time || [];
  const dailySums = raw.daily?.precipitation_sum || [];

  // Open-Meteo returns local clock labels because the request uses Asia/Dhaka.
  // Compare them with the same timezone rather than the server's UTC clock.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const currentHourStr = `${part('year')}-${part('month')}-${part('day')}T${part('hour')}`;
  const validTimeIndex = hourlyTimes.findIndex((t) => t.startsWith(currentHourStr));
  let currentIndex = validTimeIndex;
  if (currentIndex === -1) {
    // Prefer the latest observation at or before now; do not jump to an arbitrary hour.
    let previousIndex = -1;
    for (let i = 0; i < hourlyTimes.length; i += 1) {
      if (hourlyTimes[i].slice(0, 13) <= currentHourStr) previousIndex = i;
      else break;
    }
    currentIndex = previousIndex >= 0 ? previousIndex : 0;
  }
  currentIndex = Math.min(currentIndex, Math.max(0, hourlyPrecip.length - 1));
  const safeNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const currentHourlyMm = Number(safeNumber(hourlyPrecip[currentIndex]).toFixed(1));

  // Include the current hour and the previous 23 hourly intervals.
  const past24Start = Math.max(0, currentIndex - 23);
  const past24Slice = hourlyPrecip.slice(past24Start, currentIndex + 1);
  const past24hTotalMm = Number(past24Slice.reduce((sum, val) => sum + safeNumber(val), 0).toFixed(1));

  const next24Slice = hourlyPrecip.slice(currentIndex + 1, currentIndex + 25);
  const next24hTotalMm = Number(next24Slice.reduce((sum, val) => sum + safeNumber(val), 0).toFixed(1));

  // Since the request includes one past day, select the next seven local dates from today.
  const todayDhaka = `${part('year')}-${part('month')}-${part('day')}`;
  const firstForecastDay = dailyDates.findIndex((date) => date >= todayDhaka);
  const dailyStart = firstForecastDay >= 0 ? firstForecastDay : 0;
  const daily7Days = dailyDates.slice(dailyStart, dailyStart + 7).map((date, offset) => ({
    date,
    precipitationMm: Number(safeNumber(dailySums[dailyStart + offset]).toFixed(1)),
  }));

  const sevenDaySumMm = Number(
    daily7Days.reduce((sum, d) => sum + d.precipitationMm, 0).toFixed(1)
  );

  return {
    regionId,
    regionName,
    latitude: raw.latitude ?? 0,
    longitude: raw.longitude ?? 0,
    currentHourlyMm,
    past24hTotalMm,
    next24hTotalMm,
    daily7Days,
    sevenDaySumMm,
  };
}

/**
 * Fallback calibrated simulated weather when Open-Meteo is unreachable
 */
export function generateFallbackWeatherData(): LiveWeatherPayload {
  // Generate stable local calendar labels from the Asia/Dhaka date, independent
  // of the host machine's timezone (which may be UTC on a cloud server).
  const todayDhaka = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const startOfDhakaDate = new Date(`${todayDhaka}T00:00:00Z`);
  const makeDays = (base: number) =>
    Array.from({ length: 7 }).map((_, i) => ({
      date: new Date(startOfDhakaDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      precipitationMm: Math.round(base * (0.8 + Math.sin(i) * 0.4)),
    }));

  return {
    success: true,
    source: 'SIMULATED_FALLBACK',
    isLive: false,
    fetchedAt: new Date().toISOString(),
    cacheExpiresInSeconds: 600,
    offlineNotice: 'Live Open-Meteo connection offline. Operating on calibrated monsoonal baseline.',
    regions: {
      sylhet: {
        regionId: 'sylhet',
        regionName: 'Sylhet Metro & Upper Surma Basin',
        latitude: 24.8949,
        longitude: 91.8687,
        currentHourlyMm: 3.5,
        past24hTotalMm: 58.0,
        next24hTotalMm: 72.0,
        daily7Days: makeDays(60),
        sevenDaySumMm: makeDays(60).reduce((sum, day) => sum + day.precipitationMm, 0),
      },
      sunamganj: {
        regionId: 'sunamganj',
        regionName: 'Sunamganj Sadar & Central Haor Sink',
        latitude: 25.0658,
        longitude: 91.4073,
        currentHourlyMm: 4.8,
        past24hTotalMm: 95.0,
        next24hTotalMm: 110.0,
        daily7Days: makeDays(95),
        sevenDaySumMm: makeDays(95).reduce((sum, day) => sum + day.precipitationMm, 0),
      },
      cherrapunji: {
        regionId: 'cherrapunji',
        regionName: 'Cherrapunji & Meghalaya Transboundary Catchment',
        latitude: 25.27,
        longitude: 91.73,
        currentHourlyMm: 9.2,
        past24hTotalMm: 185.0,
        next24hTotalMm: 210.0,
        daily7Days: makeDays(185),
        sevenDaySumMm: makeDays(185).reduce((sum, day) => sum + day.precipitationMm, 0),
      },
    },
  };
}

/**
 * Maps live weather observations to LocationData objects and updates flood risks
 */
export function mapWeatherToLocations(
  locations: LocationData[],
  weather: LiveWeatherPayload
): LocationData[] {
  const sylhetRf = weather.regions.sylhet.past24hTotalMm;
  const sunamganjRf = weather.regions.sunamganj.past24hTotalMm;
  const upstreamCherraRf = weather.regions.cherrapunji.past24hTotalMm;

  return locations.map((loc) => {
    // Determine regional precipitation
    let liveLocalRainfall = loc.district === 'Sunamganj' ? sunamganjRf : sylhetRf;

    // Upazilas closer to foothills receive heavier orographic rain
    if (loc.id === 'gowainghat' || loc.id === 'companiganj' || loc.id === 'jaintiapur') {
      liveLocalRainfall = Number((liveLocalRainfall * 1.25).toFixed(1));
    } else if (loc.id === 'tahirpur') {
      liveLocalRainfall = Number((sunamganjRf * 1.3).toFixed(1));
    }

    // Determine rainfall trend based on next 24h vs past 24h
    const next24 = loc.district === 'Sunamganj'
      ? weather.regions.sunamganj.next24hTotalMm
      : weather.regions.sylhet.next24hTotalMm;
    let rainfallTrend: 'rising' | 'steady' | 'falling' = 'steady';
    if (next24 > liveLocalRainfall * 1.15) {
      rainfallTrend = 'rising';
    } else if (next24 < liveLocalRainfall * 0.85) {
      rainfallTrend = 'falling';
    }

    // Recalculate flood risk with real live rainfall
    const riskResult = calculateFloodRisk(
      {
        locationId: loc.id,
        rainfallMm: liveLocalRainfall,
        waterLevelM: loc.currentWaterLevel,
        waterLevelChangeM: loc.waterLevelChange24h,
        rainfallTrend,
        durationHours: 24,
        upstreamRainfallMm: upstreamCherraRf,
      },
      loc
    );

    return {
      ...loc,
      rainfall24h: liveLocalRainfall,
      rainfallTrend,
      upstreamRainfallMm: upstreamCherraRf,
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.riskScore,
      // Rainfall may be live, but this station's water-level input remains a demo/reference value.
      isSimulated: true,
      lastUpdated: weather.isLive
        ? 'Rainfall synced via Open-Meteo; stage is demo/reference input'
        : 'Simulated weather and stage inputs',
    };
  });
}
