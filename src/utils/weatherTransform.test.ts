import { test } from 'node:test';
import assert from 'node:assert';
import {
  parseOpenMeteoRegion,
  generateFallbackWeatherData,
  mapWeatherToLocations,
  OpenMeteoResponseRaw,
} from './weatherTransform';
import { INITIAL_LOCATIONS } from '../data/mockData';

test('parseOpenMeteoRegion parses hourly and daily precipitation correctly', () => {
  const dummyRaw: OpenMeteoResponseRaw = {
    latitude: 24.89,
    longitude: 91.87,
    timezone: 'Asia/Dhaka',
    hourly: {
      time: Array.from({ length: 48 }).map((_, i) => `2026-11-05T${String(i % 24).padStart(2, '0')}:00`),
      precipitation: Array.from({ length: 48 }).map((_, i) => 2.5),
    },
    daily: {
      time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11'],
      precipitation_sum: [45.2, 55.0, 60.5, 30.1, 10.0, 5.0, 2.0],
    },
  };

  const parsed = parseOpenMeteoRegion('sylhet', 'Sylhet City', dummyRaw, new Date('2026-11-05T06:00:00.000Z'));
  assert.strictEqual(parsed.regionId, 'sylhet');
  assert.strictEqual(parsed.latitude, 24.89);
  assert.strictEqual(parsed.daily7Days.length, 7);
  assert.strictEqual(parsed.daily7Days[0].precipitationMm, 45.2);
  assert.ok(parsed.past24hTotalMm > 0);
  assert.ok(parsed.sevenDaySumMm > 100);
});

test('generateFallbackWeatherData provides robust fallback structure', () => {
  const fallback = generateFallbackWeatherData();
  assert.strictEqual(fallback.success, true);
  assert.strictEqual(fallback.isLive, false);
  assert.strictEqual(fallback.source, 'SIMULATED_FALLBACK');
  assert.ok(fallback.regions.sylhet.past24hTotalMm > 0);
  assert.ok(fallback.regions.sunamganj.past24hTotalMm > 0);
  assert.ok(fallback.regions.cherrapunji.past24hTotalMm > 0);
  assert.ok(fallback.offlineNotice?.includes('Open-Meteo'));
  for (const region of Object.values(fallback.regions)) {
    assert.equal(region.daily7Days.length, 7);
    assert.equal(region.sevenDaySumMm, region.daily7Days.reduce((sum, day) => sum + day.precipitationMm, 0));
  }
  const dhakaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  assert.equal(fallback.regions.sylhet.daily7Days[0].date, dhakaDate);
});

test('mapWeatherToLocations updates live rainfall and risk while keeping station stage labelled as simulated', () => {
  const mockWeather = generateFallbackWeatherData();
  // Set high precipitation
  mockWeather.regions.sylhet.past24hTotalMm = 210;
  mockWeather.regions.sunamganj.past24hTotalMm = 250;
  mockWeather.regions.cherrapunji.past24hTotalMm = 450;
  mockWeather.isLive = true;

  const updatedLocations = mapWeatherToLocations(INITIAL_LOCATIONS, mockWeather);
  assert.strictEqual(updatedLocations.length, INITIAL_LOCATIONS.length);

  const sylhetLoc = updatedLocations.find((l) => l.id === 'sylhet-sadar');
  assert.ok(sylhetLoc);
  assert.strictEqual(sylhetLoc?.rainfall24h, 210);
  assert.strictEqual(sylhetLoc?.upstreamRainfallMm, 450);
  assert.strictEqual(sylhetLoc?.isSimulated, true, 'the stage input remains simulated even when rainfall is live');
  assert.match(sylhetLoc?.lastUpdated || '', /Rainfall synced via Open-Meteo; stage is demo\/reference input/);

  // Foothill station should have orographic multiplier
  const gowainghat = updatedLocations.find((l) => l.id === 'gowainghat');
  assert.ok(gowainghat);
  assert.ok((gowainghat?.rainfall24h ?? 0) > 210);
});


test('hourly selection uses the Dhaka clock and includes the prior 23 hourly records', () => {
  // 13:17 UTC is 19:17 in Bangladesh (Asia/Dhaka, UTC+6).
  const now = new Date('2026-11-11T13:17:00.000Z');
  const labels = Array.from({ length: 50 }, (_, i) => {
    const d = new Date('2026-11-10T12:00:00.000Z');
    d.setUTCHours(d.getUTCHours() + i);
    const utc = d.toISOString().slice(0, 13);
    const local = new Date(d.getTime() + 6 * 60 * 60 * 1000);
    return `${local.toISOString().slice(0, 13)}`;
  });
  const values = labels.map((_, i) => i + 1);
  const parsed = parseOpenMeteoRegion('sylhet', 'Sylhet', {
    timezone: 'Asia/Dhaka',
    hourly: { time: labels, precipitation: values },
    daily: { time: ['2026-11-10', '2026-11-11', '2026-11-12'], precipitation_sum: [10, 20, 30] },
  }, now);
  const current = labels.findIndex((label) => label === '2026-11-11T19');
  assert.equal(parsed.currentHourlyMm, values[current]);
  const expected24 = values.slice(current - 23, current + 1).reduce((sum, value) => sum + value, 0);
  assert.equal(parsed.past24hTotalMm, Number(expected24.toFixed(1)));
  assert.equal(parsed.daily7Days[0].date, '2026-11-11');
});
