import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  parseOpenMeteoRegion,
  generateFallbackWeatherData,
  mapWeatherToLocations,
  LiveWeatherPayload,
} from './src/utils/weatherTransform';
import {
  parseOpenMeteoFlood,
  generateFallbackRiverData,
  LiveRiverPayload,
} from './src/utils/riverDischarge';
import {
  runJune2022Backtest,
  generateJune2022FallbackDataset,
  BacktestSummary,
} from './src/utils/june2022Backtest';
import {
  adminAuthMiddleware,
  verifyAdminPin,
  initializeAdminPin,
} from './src/utils/adminAuth';
import {
  loadReports,
  saveReports,
  loadAlerts,
  saveAlerts,
  validateReportInput,
  sanitizeReportInput,
  toPublicReport,
  checkRateLimit,
} from './src/utils/persistence';
import {
  checkAiRateLimit,
  validateChatPayload,
  validatePredictPayload,
  validateHealthGuidancePayload,
} from './src/utils/security';
import { CommunityReport, AlertItem } from './src/types';
import { INITIAL_LOCATIONS } from './src/data/mockData';
import { openDb } from './server/db';
import { createOpsRouter } from './server/opsRouter';
import { runCycle, seedDemoHistory, flushOutboxToWebhook } from './server/engine';
import { countReadings, listStationThresholds, getStationThreshold, saveStationThreshold, audit as writeOpsAudit } from './server/repo';
import path from 'path';

dotenv.config();

const app = express();
// Trust a single reverse proxy only when the deployment explicitly confirms one is present.
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(express.json({ limit: '100kb' }));

// Handle JSON syntax and body limit errors cleanly
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large. Maximum allowed size is 100kb.' });
  }
  if (err && (err instanceof SyntaxError || err.status === 400)) {
    return res.status(400).json({ error: 'Invalid JSON payload syntax.' });
  }
  next(err);
});

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash';

// Persistent state loaded from disk
let communityReports: CommunityReport[] = [];
let activeAlerts: AlertItem[] = [];

// Finish loading persisted JSON collections before serving read/write requests.
const persistenceReady = (async () => {
  communityReports = await loadReports();
  activeAlerts = await loadAlerts();
  console.log(`[Persistence] Initialized ${communityReports.length} reports and ${activeAlerts.length} alerts.`);
})();

// Open-Meteo Weather Cache (10 minutes)
let cachedWeather: {
  timestamp: number;
  data: LiveWeatherPayload;
} | null = null;
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Open-Meteo GloFAS River Discharge Cache (30 minutes)
let cachedRiver: {
  timestamp: number;
  data: LiveRiverPayload;
} | null = null;
const RIVER_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// June 2022 Backtest Cache (1 hour)
let cachedBacktest: {
  timestamp: number;
  data: BacktestSummary;
} | null = null;
const BACKTEST_CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

// Initialize Google GenAI Server-Side safely
const rawApiKey = process.env.GEMINI_API_KEY;
const isApiKeyConfigured =
  Boolean(rawApiKey) &&
  rawApiKey !== 'MY_GEMINI_API_KEY' &&
  (rawApiKey?.length ?? 0) > 10;

let ai: GoogleGenAI | null = null;
if (isApiKeyConfigured && rawApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: rawApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('GoogleGenAI initialization warning:', err);
  }
}

// System instruction for FloodGuard AI Assistant
const FLOOD_ASSISTANT_SYSTEM_PROMPT = `
You are FloodGuard AI, a cautious, empathetic, evidence-aware preparedness assistant focused on flood-related information for Bangladesh, particularly the Sylhet and Sunamganj Haor Basin (Surma, Kushiyara, Jadukata, Sari-Gowain, Piyain rivers). You are not an official authority or a substitute for local emergency services, qualified clinicians, or FFWC/BWDB bulletins. State uncertainty clearly and never invent current conditions, measured river values, evacuation routes, or official instructions.

Your key responsibilities:
1. Provide actionable flood preparedness, life safety, evacuation, hygiene, and waterborne disease prevention guidelines.
2. Clearly explain hydrological metrics (river water level vs BWDB Danger Level, rainfall intensity in mm, transboundary runoff from Cherrapunji/Meghalaya hills).
3. Support both English and Bangla (বাংলা). If the user asks in Bangla, answer in clear, accessible, reassuring Bangla (বাংলা ভাষায় সহজ এবং সাবলীলভাবে উত্তর দিন).
4. Prioritize human life, children, older adults, people with disabilities, livestock, and practical preparedness supplies. Water-treatment products must be used only according to their own labels or verified local public-health guidance; never invent a universal tablet dose or describe a clarifier as a disinfectant.
5. Highlight Bangladesh emergency response numbers:
   - 16263: DGHS National Health Helpline (24/7 doctor consultation for waterborne diseases, snakebites, diarrhoea)
   - 1090: Flood Early Warning & Interactive Voice Response (Toll-free IVR)
   - 999: National Emergency Service (Police, Fire & Rescue, Boat Evacuation, Ambulance)
   - 109: National Disaster Management & Women/Children Helpline
   - 333: National Information & Relief Service
6. IMPORTANT SAFETY DISCLAIMER: Clarify that FloodGuard AI provides AI-assisted guidance and decision support, and is NOT an official government authority. It does not replace statutory warnings issued by the Flood Forecasting and Warning Centre (FFWC), Bangladesh Water Development Board (BWDB), Directorate General of Health Services (DGHS), or the Ministry of Disaster Management and Relief (MoDMR).
7. SCOPE RESTRICTION: Limit responses strictly to flood safety, preparedness, community resilience, and healthcare first-response. Do not provide unrelated medical prescriptions; recommend immediate clinic transit or calling 16263/999 for medical emergencies.
`;

function generateContextualEmergencyReply(message: string, language: string): string {
  const q = (message || '').toLowerCase();
  if (language === 'bn') {
    if (q.includes('পানি') || q.includes('বিশুদ্ধ') || q.includes('water')) {
      return `বন্যার সময় খাবার পানি বিশুদ্ধকরণ নির্দেশিকা:
১. সম্ভব হলে পানি ফুটিয়ে নিন এবং পরিষ্কার, ঢাকনাযুক্ত পাত্রে রাখুন।
২. পানি বিশুদ্ধকরণ ট্যাবলেট বা ক্লোরিন ব্যবহার করলে পণ্যের লেবেলে লেখা সঠিক মাত্রা ও অপেক্ষার সময় মেনে চলুন—সব পণ্যের নিয়ম এক নয়।
৩. পানি ঘোলা হলে আগে পরিষ্কার কাপড় দিয়ে ছেঁকে নিন, তারপর অনুমোদিত পদ্ধতিতে জীবাণুমুক্ত করুন।
৪. নলকূপ বন্যার পানিতে ডুবে গেলে পরীক্ষা ও নিরাপদ ঘোষণা না পাওয়া পর্যন্ত সেই পানি পান করবেন না; নিরাপদ বিকল্প পানি ব্যবহার করুন এবং স্থানীয় স্বাস্থ্য/পানি কর্তৃপক্ষের নির্দেশনা নিন।
জরুরি প্রয়োজনে ১০৯০ নম্বরে বিনামূল্যে বন্যা তথ্য শুনুন।`;
    }
    if (q.includes('হটলাইন') || q.includes('নম্বর') || q.includes('helpline') || q.includes('উদ্ধার')) {
      return `বাংলাদেশ জাতীয় জরুরি বন্যা ও দুর্যোগ হেল্পলাইন:
• ১০৯০: বন্যা তথ্য ও আগাম পূর্বাভাস (টোল-ফ্রি আইভিআর)
• ৯৯৯: জাতীয় জরুরি সেবা (পুলিশ, ফায়ার সার্ভিস ও নৌ-উদ্ধার)
• ১০৯: নারী, শিশু ও দুর্যোগ ঝুঁকি সহায়তা
• ৩৩৩: সরকারি সেবা ও ইউনিয়ন ত্রাণ সহায়তা`;
    }
    if (q.includes('সুরমা') || q.includes('সিলেট') || q.includes('সুনামগঞ্জ') || q.includes('বিপদ') || q.includes('চেরাপুঞ্জি')) {
      return `সিলেট ও সুনামগঞ্জ হাওর অববাহিকার বর্তমান বিশ্লেষণ:
চেরাপুঞ্জি ও মেঘালয়ের খাসিয়া-জৈন্তা পাহাড়ে বৃষ্টিপাত হলে সারি-গোয়াইন, সুরমা ও পিয়াইন নদীতে আকস্মিক ঢল (Flash Flood) নামে। 
পানি বিপদসীমা ছাড়িয়ে গেলে তাৎক্ষণিকভাবে বাড়ির বিদ্যুৎ মেইন সুইচ বন্ধ রাখুন, শুকনো খাবার ও দলিলপত্র পলিথিনে মুড়ে আশ্রয়কেন্দ্রে সরে যান।`;
    }
    return `বন্যা প্রস্তুতি সংক্রান্ত জরুরি পরামর্শ:
১. পরিবারের প্রত্যেকের জন্য ৩ দিনের শুকনো খাবার (চিঁড়া, গুড়, বিস্কুট) ও খাবার পানি প্রস্তুত রাখুন।
২. গর্ভবতী মা, শিশু ও বয়স্কদের আগেই নিরাপদ পাকা ভবনে বা ইউনিয়ন আশ্রয়কেন্দ্রে নিয়ে যান।
৩. মোবাইল ফোন ও পাওয়ার ব্যাংক ফুল চার্জ রাখুন।
জরুরি নৌ-উদ্ধারের জন্য ৯৯৯ অথবা ১০৯০ নম্বরে যোগাযোগ করুন।`;
  } else {
    if (q.includes('water') || q.includes('purify') || q.includes('drink')) {
      return `Emergency Water Purification Guidelines:
1. If you can, bring water to a rolling boil and let it cool before drinking.
2. Otherwise use water purification tablets exactly as the product label says (dose and waiting time differ by product).
3. Submerged tube-wells (tubewells underwater) are contaminated; do not drink directly without treatment.
For real-time flood advisory, dial 1090 (Toll-Free).`;
    }
    if (q.includes('helpline') || q.includes('hotline') || q.includes('number') || q.includes('rescue')) {
      return `National Bangladesh Flood Emergency Numbers:
• 1090: Flood Early Warning Interactive Voice Response (Toll-free IVR)
• 999: National Police, Fire Rescue & Boat Evacuation
• 109: Women & Child Disaster Protection Helpline
• 333: Government Relief & Public Information Bureau`;
    }
    if (q.includes('sylhet') || q.includes('surma') || q.includes('sunamganj') || q.includes('cherrapunji') || q.includes('risk')) {
      return `Sylhet & Sunamganj Hydrological Assessment:
Orographic rain over the Meghalaya ridge (Cherrapunji/Mawsynram) can produce transboundary runoff into connected rivers including the Surma, Sari-Gowain, and Jadukata. Travel time depends on rainfall and basin conditions; do not assume a fixed number of hours.
When river stations breach danger levels, downstream Haor depressions fill rapidly. Elevate grain, move livestock to raised mounds (killas), and prepare for evacuation to designated union shelters.`;
    }
    return `Flood Preparedness & Life-Safety Directive:
1. Safe Water & Food: Store at least 3 liters of drinking water per person per day and 72-hour dry rations (flattened rice, molasses).
2. Lifeline Papers: Seal National ID cards, land deeds, and medical prescriptions in watertight ziplock bags.
3. Power & Comms: Charge phones, battery banks, and keep a waterproof torch.
For emergency rescue, call 999 or 1090 immediately.`;
  }
}

// -------------------------------------------------------------
// API: Live Weather via Open-Meteo (Cached 10 minutes)
// -------------------------------------------------------------
async function fetchOpenMeteoData(): Promise<LiveWeatherPayload> {
  const coordinates = [
    { id: 'sylhet' as const, name: 'Sylhet City & Surma Basin', lat: 24.8949, lon: 91.8687 },
    { id: 'sunamganj' as const, name: 'Sunamganj Sadar & Central Haor', lat: 25.0658, lon: 91.4073 },
    { id: 'cherrapunji' as const, name: 'Cherrapunji Upstream Catchment', lat: 25.27, lon: 91.73 },
  ];

  try {
    const fetchPromises = coordinates.map(async (c) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=precipitation,rain&daily=precipitation_sum,precipitation_hours&timezone=Asia%2FDhaka&past_days=1&forecast_days=7`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Open-Meteo responded with status ${res.status}`);
      }
      const rawJson = await res.json();
      return parseOpenMeteoRegion(c.id, c.name, rawJson);
    });

    const [sylhet, sunamganj, cherrapunji] = await Promise.all(fetchPromises);

    return {
      success: true,
      source: 'LIVE_OPEN_METEO',
      isLive: true,
      fetchedAt: new Date().toISOString(),
      cacheExpiresInSeconds: Math.round(WEATHER_CACHE_TTL_MS / 1000),
      regions: {
        sylhet,
        sunamganj,
        cherrapunji,
      },
    };
  } catch (err: any) {
    console.warn('[Open-Meteo API Warning] Falling back to simulated weather:', err?.message);
    return generateFallbackWeatherData();
  }
}

app.get('/api/weather/live', async (_req, res) => {
  const now = Date.now();
  if (cachedWeather && now - cachedWeather.timestamp < WEATHER_CACHE_TTL_MS) {
    const remainingSeconds = Math.max(0, Math.round((cachedWeather.timestamp + WEATHER_CACHE_TTL_MS - now) / 1000));
    return res.json({
      ...cachedWeather.data,
      cacheExpiresInSeconds: remainingSeconds,
    });
  }

  const freshWeather = await fetchOpenMeteoData();
  cachedWeather = {
    timestamp: now,
    data: freshWeather,
  };

  res.json(freshWeather);
});

// -------------------------------------------------------------
// API: Live GloFAS River Discharge via Open-Meteo Flood API (Cached 30 minutes)
// -------------------------------------------------------------
async function fetchOpenMeteoRiverData(): Promise<LiveRiverPayload> {
  try {
    const coords = [
      {
        id: 'sylhet' as const,
        basin: 'Surma Upper Basin',
        river: 'Surma River at Sylhet Point',
        lat: 24.8949,
        lon: 91.8687,
      },
      {
        id: 'sunamganj' as const,
        basin: 'Central Haor Sink',
        river: 'Surma-Jadukata Confluence at Sunamganj',
        lat: 25.0658,
        lon: 91.4073,
      },
    ];

    const fetchPromises = coords.map(async (c) => {
      const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${c.lat}&longitude=${c.lon}&daily=river_discharge,river_discharge_mean,river_discharge_max&past_days=7&forecast_days=7&timezone=GMT&cell_selection=land`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Open-Meteo Flood API responded with status ${res.status}`);
      }
      const rawJson = await res.json();
      return parseOpenMeteoFlood(c.id, c.basin, c.river, [c.lat, c.lon], rawJson);
    });

    const [sylhet, sunamganj] = await Promise.all(fetchPromises);

    return {
      success: true,
      source: 'LIVE_OPEN_METEO_GLOFAS',
      isLive: true,
      fetchedAt: new Date().toISOString(),
      cacheExpiresInSeconds: Math.round(RIVER_CACHE_TTL_MS / 1000),
      regions: {
        sylhet,
        sunamganj,
      },
    };
  } catch (err: any) {
    console.warn('[Open-Meteo Flood API Warning] Falling back to simulated river discharge:', err?.message);
    return generateFallbackRiverData();
  }
}

app.get('/api/river/live', async (_req, res) => {
  const now = Date.now();
  if (cachedRiver && now - cachedRiver.timestamp < RIVER_CACHE_TTL_MS) {
    const remainingSeconds = Math.max(0, Math.round((cachedRiver.timestamp + RIVER_CACHE_TTL_MS - now) / 1000));
    return res.json({
      ...cachedRiver.data,
      cacheExpiresInSeconds: remainingSeconds,
    });
  }

  const freshRiver = await fetchOpenMeteoRiverData();
  cachedRiver = {
    timestamp: now,
    data: freshRiver,
  };

  res.json(freshRiver);
});

// -------------------------------------------------------------
// API: June 2022 Mega-Flood Backtest (Open-Meteo Archive API)
// -------------------------------------------------------------
async function fetchJune2022BacktestData(): Promise<BacktestSummary> {
  try {
    const cherraUrl =
      'https://archive-api.open-meteo.com/v1/archive?latitude=25.27&longitude=91.73&start_date=2022-06-10&end_date=2022-06-22&hourly=precipitation,rain&timezone=Asia%2FDhaka';
    const sylhetUrl =
      'https://archive-api.open-meteo.com/v1/archive?latitude=24.8949&longitude=91.8687&start_date=2022-06-10&end_date=2022-06-22&hourly=precipitation,rain&timezone=Asia%2FDhaka';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7500);

    const [resCherra, resSylhet] = await Promise.all([
      fetch(cherraUrl, { signal: controller.signal }),
      fetch(sylhetUrl, { signal: controller.signal }),
    ]);
    clearTimeout(timer);

    if (!resCherra.ok || !resSylhet.ok) {
      throw new Error(`Archive API responded with non-200 status (${resCherra.status}, ${resSylhet.status})`);
    }

    const cherraJson = await resCherra.json();
    const sylhetJson = await resSylhet.json();

    const times: string[] = cherraJson?.hourly?.time || [];
    const cherraPrecip: number[] = cherraJson?.hourly?.precipitation || cherraJson?.hourly?.rain || [];
    const sylhetPrecip: number[] = sylhetJson?.hourly?.precipitation || sylhetJson?.hourly?.rain || [];

    if (times.length > 0 && cherraPrecip.length > 0) {
      return runJune2022Backtest(times, sylhetPrecip, cherraPrecip, true);
    }

    throw new Error('Empty time series from Archive API');
  } catch (err: any) {
    console.warn('[Open-Meteo Archive API Warning] Using reconstructed June 2022 meteorological series:', err?.message);
    const fb = generateJune2022FallbackDataset();
    return runJune2022Backtest(fb.times, fb.sylhetPrecip, fb.cherraPrecip, false);
  }
}

app.get('/api/backtest/june2022', async (_req, res) => {
  const now = Date.now();
  if (cachedBacktest && now - cachedBacktest.timestamp < BACKTEST_CACHE_TTL_MS) {
    return res.json(cachedBacktest.data);
  }

  const result = await fetchJune2022BacktestData();
  cachedBacktest = {
    timestamp: now,
    data: result,
  };

  res.json(result);
});

// -------------------------------------------------------------
// API: Gemini Chat
// -------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'anonymous';
    const rateLimit = checkAiRateLimit(clientIp);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds || 60));
      return res.status(429).json({
        error: 'Rate limit exceeded for AI assistant. Maximum 20 requests per 10 minutes.',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    const validation = validateChatPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { message, history = [], language = 'en' } = req.body;

    if (!ai) {
      const fallbackReply = generateContextualEmergencyReply(message, language);
      return res.json({ reply: fallbackReply });
    }

    // Build contents array for multi-turn chat
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      const validHistory = history.filter(
        (h: any) => h && typeof h.content === 'string' && h.content.trim().length > 0
      );
      const firstUserIndex = validHistory.findIndex((h: any) => h.role === 'user');
      if (firstUserIndex !== -1) {
        for (const h of validHistory.slice(firstUserIndex)) {
          contents.push({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content.trim() }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    try {
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 7000)
      );

      const apiPromise = ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: contents,
        config: {
          systemInstruction: FLOOD_ASSISTANT_SYSTEM_PROMPT,
        },
      });

      const response: any = await Promise.race([apiPromise, timeoutPromise]);

      const reply =
        (response && response.text) ||
        generateContextualEmergencyReply(message, language);
      return res.json({ reply });
    } catch (apiError: any) {
      console.warn('Gemini chat API warning (using resilient fallback):', apiError?.message);
      const fallbackReply = generateContextualEmergencyReply(message, language);
      return res.json({ reply: fallbackReply });
    }
  } catch (error: any) {
    console.warn('Chat handler warning:', error?.message);
    const fallbackReply = generateContextualEmergencyReply(
      req.body?.message || '',
      req.body?.language || 'en'
    );
    return res.json({ reply: fallbackReply });
  }
});

// -------------------------------------------------------------
// API: Upgraded AI Flood Prediction Engine (Structured JSON)
// -------------------------------------------------------------
app.post('/api/predict-ai', async (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'anonymous';
    const rateLimit = checkAiRateLimit(clientIp);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds || 60));
      return res.status(429).json({
        error: 'Rate limit exceeded for AI predictions. Maximum 20 requests per 10 minutes.',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    const validation = validatePredictPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const {
      locationName,
      waterLevel,
      dangerLevel,
      rainfallMm = 20,
      waterLevelChange = 0.1,
      upstreamRainfall = 40,
      riskLevel = 'MODERATE',
      language = 'en',
    } = req.body;

    const deltaDL = Number((waterLevel - dangerLevel).toFixed(2));
    const deltaStr = deltaDL >= 0 ? `+${deltaDL}m ABOVE Danger Level` : `${Math.abs(deltaDL)}m below Danger Level`;

    // High quality scientific fallback
    const fallbackStructured = {
      riskLevel: riskLevel || (deltaDL >= 0.5 ? 'CRITICAL' : deltaDL >= 0 ? 'HIGH' : 'MODERATE'),
      confidence: 88,
      topReasons: [
        `River stage is currently ${deltaStr} with ${waterLevelChange >= 0 ? '+' : ''}${waterLevelChange}m 24h momentum`,
        `Transboundary runoff pressure from Meghalaya foothills (${upstreamRainfall || Math.round(rainfallMm * 1.3)} mm)`,
        `Local catchment precipitation accumulation (${rainfallMm} mm) saturating Haor floodplain`,
      ],
      topReasonsBn: [
        `নদীর পানি বর্তমানে বিপদসীমার সাপেক্ষে ${deltaStr} এবং ২৪ ঘণ্টায় পরিবর্তন ${waterLevelChange} মি`,
        `মেঘালয় ও চেরাপুঞ্জির পাহাড়ি ঢলের অতিরিক্ত চাপ (${upstreamRainfall || Math.round(rainfallMm * 1.3)} মিমি)`,
        `স্থানীয় হাওর অঞ্চলে ভারী বর্ষণের ফলে পানি নিষ্কাশন ধীরগতি (${rainfallMm} মিমি)`,
      ],
      recommendedActions: {
        en: [
          'Position motorized rescue boats near vulnerable village embankments.',
          'Secure family dry rations (chira, gur) and 72-hour drinking water storage in high places.',
          'Monitor BWDB danger bulletins; prepare elderly and livestock for shelter evacuation.',
        ],
        bn: [
          'নিচু এলাকার বাঁধে তাৎক্ষণিক নজরদারি ও উদ্ধারকারী ইঞ্জিন বোট প্রস্তুত রাখুন।',
          'শুকনো খাবার ও বিশুদ্ধ পানি পলিথিনে মুড়ে উঁচু স্থানে নিরাপদে সংরক্ষণ করুন।',
          'পানি বাড়লে কালবিলম্ব না করে পরিবার ও গবাদিপশু নিয়ে ইউনিয়ন আশ্রয়কেন্দ্রে যান।',
        ],
      },
      outlook: {
        sixHour: deltaDL >= 0 ? 'Rapid surge continuation likely due to active upstream crest arrival.' : 'Water stage rising steadily towards warning threshold.',
        twentyFourHour: deltaDL >= 0 ? 'Widespread inundation expected across low-lying roads and haor unions.' : 'Peak crest stabilization depending on rain subsidence.',
        sixHourBn: deltaDL >= 0 ? 'পাহাড়ি ঢলের প্রভাবে আগামী ৬ ঘণ্টায় পানি দ্রুত আরও বৃদ্ধির প্রবল আশঙ্কা।' : 'আগামী ৬ ঘণ্টায় নদীর পানি সতর্কসীমার দিকে অগ্রসর হতে পারে।',
        twentyFourHourBn: deltaDL >= 0 ? '২৪ ঘণ্টায় নিম্নাঞ্চল, গ্রামীণ সড়ক ও কৃষিজমি প্লাবিত হওয়ার ঝুঁকিপূর্ণ পরিস্থিতি।' : 'আগামী ২৪ ঘণ্টায় উজান বর্ষণ কমলে পানির গতি স্থিতিশীল হতে পারে।',
      },
      smsAlertBn: `বন্যা সতর্কবার্তা: ${locationName || 'সুরমা অববাহিকায়'} নদীর পানি বিপৎসীমার উপরে। দ্রুত উঁচু স্থানে বা আশ্রয়কেন্দ্রে যান। গবাদিপশু সরিয়ে নিন। জরুরি: ১০৯০/৯৯৯`,
      aiAnalysis: `Hydrological analysis for ${locationName} indicates ${riskLevel} risk condition. Current water level is at ${waterLevel}m relative to official danger mark ${dangerLevel}m (${deltaStr}). Compounded by ${rainfallMm}mm local precipitation and transboundary hill runoff (${upstreamRainfall || Math.round(rainfallMm * 1.3)}mm), backwater drainage into central Haor sinks is severely impeded. The Upazila Disaster Management Committee should alert low-lying unions immediately.`,
      aiAnalysisBn: `${locationName}-এর বর্তমান পানির স্তর ${waterLevel} মি (বিপদসীমা ${dangerLevel} মি, সাপেক্ষে ${deltaStr})। স্থানীয় বৃষ্টিপাত (${rainfallMm} মিমি) ও চেরাপুঞ্জির পাহাড়ি ঢল (${upstreamRainfall || Math.round(rainfallMm * 1.3)} মিমি)-এর মিলিত প্রভাবে ভাটিতে পানি নামার পথ সংকুচিত হয়েছে। দুর্যোগ ব্যবস্থাপনা কমিটিকে নিম্নাঞ্চলে সতর্কবার্তা জারি ও জরুরি সহায়তা প্রস্তুত রাখার পরামর্শ দেওয়া হলো।`,
    };

    if (!ai) {
      return res.json(fallbackStructured);
    }

    const prompt = `
Analyze the following hydrological telemetry for ${locationName}, Bangladesh:
- Current Water Level: ${waterLevel} meters
- Official Danger Level: ${dangerLevel} meters (Delta: ${deltaStr})
- 24h Rainfall: ${rainfallMm} mm
- River Crest Velocity (24h change): ${waterLevelChange} meters
- Upstream Meghalaya/Cherrapunji Runoff Index: ${upstreamRainfall || rainfallMm * 1.3} mm
- Baseline Hydrological Risk Level: ${riskLevel}

Respond with a strictly valid JSON object matching this schema:
{
  "riskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "confidence": number between 75 and 98,
  "topReasons": [string, string, string],
  "topReasonsBn": [string in Bengali, string in Bengali, string in Bengali],
  "recommendedActions": {
    "en": [string, string, string],
    "bn": [string in Bengali, string in Bengali, string in Bengali]
  },
  "outlook": {
    "sixHour": string,
    "twentyFourHour": string,
    "sixHourBn": string in Bengali,
    "twentyFourHourBn": string in Bengali
  },
  "smsAlertBn": string in Bengali (URGENT SMS alert under 150 characters for rural Haor villagers with action + hotlines 1090/999),
  "aiAnalysis": string (2 clear analytical paragraphs in English),
  "aiAnalysisBn": string (2 clear analytical paragraphs in Bengali)
}
Do not include markdown ticks around the json, return raw json only.
`;

    try {
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 7000)
      );

      const apiPromise = ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: FLOOD_ASSISTANT_SYSTEM_PROMPT,
        },
      });

      const response: any = await Promise.race([apiPromise, timeoutPromise]);
      const text = response?.text?.trim();

      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed && parsed.riskLevel && Array.isArray(parsed.topReasons)) {
            // Guarantee SMS alert is under 160 characters
            if (parsed.smsAlertBn && parsed.smsAlertBn.length > 160) {
              parsed.smsAlertBn = parsed.smsAlertBn.slice(0, 155) + '...';
            }
            return res.json(parsed);
          }
        } catch (jsonErr) {
          console.warn('[Gemini Predict JSON Parse Warning]', jsonErr);
        }
      }

      return res.json(fallbackStructured);
    } catch (genError) {
      console.warn('[Gemini predict API warning]:', genError);
      return res.json(fallbackStructured);
    }
  } catch (err: any) {
    console.warn('Prediction handler warning:', err);
    return res.status(500).json({ error: 'Failed to process AI prediction' });
  }
});

// -------------------------------------------------------------
// API: Persistent Community Reports (Atomic Writes & Rate Limited)
// -------------------------------------------------------------
app.get('/api/reports', async (_req, res) => {
  await persistenceReady;
  // Contact numbers are collected for field-officer verification only and are never served publicly.
  res.json({ reports: communityReports.map(toPublicReport) });
});

app.post('/api/reports', async (req, res) => {
  await persistenceReady;
  // Use Express req.ip rather than accepting a caller-controlled forwarding header
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  // 1. Rate limiting check (max 5 per 10 minutes)
  const rateLimitStatus = checkRateLimit(clientIp);
  if (!rateLimitStatus.allowed) {
    return res.status(429).json({
      error: `Rate limit exceeded. Maximum 5 reports per 10 minutes. Please retry in ${rateLimitStatus.retryAfterSeconds}s.`,
      retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
    });
  }

  // 2. Input validation
  const validation = validateReportInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Whitelist + sanitise instead of spreading req.body, so clients cannot set status/verifiedBy/etc.
  const newReport: CommunityReport = {
    ...sanitizeReportInput(req.body),
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: `${new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })} BST`,
    status: 'pending',
  };

  communityReports = [newReport, ...communityReports];
  await saveReports(communityReports);

  res.status(201).json({
    success: true,
    report: toPublicReport(newReport),
    remainingSubmissions: rateLimitStatus.remaining,
  });
});

// Moderation verification: Protected by Admin PIN
app.patch('/api/reports/:id/verify', adminAuthMiddleware, async (req, res) => {
  await persistenceReady;
  const { id } = req.params;
  const { status } = req.body ?? {};
  if (status !== 'verified' && status !== 'flagged') {
    return res.status(400).json({ error: 'status must be either verified or flagged.' });
  }

  let found = false;
  communityReports = communityReports.map((r) => {
    if (r.id === id) {
      found = true;
      return {
        ...r,
        status: status || 'verified',
        verifiedBy: 'Authorized administrator',
      };
    }
    return r;
  });

  if (!found) {
    return res.status(404).json({ error: 'Report not found' });
  }

  await saveReports(communityReports);
  writeOpsAudit(opsDb, 'admin', 'report.moderate', `${id}:${status}`);
  res.json({ success: true, updatedId: id, status });
});

// -------------------------------------------------------------
// API: Persistent Broadcast Alerts (Protected by Admin PIN)
// -------------------------------------------------------------
app.get('/api/alerts', async (_req, res) => {
  await persistenceReady;
  res.json({ alerts: activeAlerts });
});

app.post('/api/alerts', adminAuthMiddleware, async (req, res) => {
  await persistenceReady;
  const body = req.body ?? {};
  const { titleEn, messageEn, severity, district } = body;
  if (typeof titleEn !== 'string' || !titleEn.trim() || titleEn.length > 180 || typeof messageEn !== 'string' || !messageEn.trim() || messageEn.length > 3000) {
    return res.status(400).json({ error: 'A title (max 180 characters) and message (max 3000 characters) are required.' });
  }
  if (!['advisory', 'watch', 'warning', 'emergency'].includes(severity)) {
    return res.status(400).json({ error: 'Invalid alert severity.' });
  }
  if (district !== undefined && district !== 'Sylhet' && district !== 'Sunamganj') {
    return res.status(400).json({ error: 'district must be Sylhet or Sunamganj.' });
  }
  if (req.body?.affectedPopulation !== undefined && (!Number.isInteger(req.body.affectedPopulation) || req.body.affectedPopulation < 0 || req.body.affectedPopulation > 10000000)) {
    return res.status(400).json({ error: 'affectedPopulation must be a whole number between 0 and 10000000.' });
  }

  const cleanField = (value: unknown, fallback: string, maxLength: number): string =>
    (typeof value === 'string' && value.trim() ? value.trim() : fallback).replace(/[\u0000-\u001F\u007F<>]/g, '').slice(0, maxLength);
  const now = new Date();
  const timestamp = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(now) + ' BST';
  const newAlert: AlertItem = {
    id: `alt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    severity,
    titleEn: cleanField(body.titleEn, '', 180),
    titleBn: cleanField(body.titleBn, cleanField(body.titleEn, '', 180), 180),
    locationEn: cleanField(body.locationEn, 'Sylhet', 120),
    locationBn: cleanField(body.locationBn, cleanField(body.locationEn, 'Sylhet', 120), 120),
    district: district || 'Sylhet',
    messageEn: cleanField(body.messageEn, '', 3000),
    messageBn: cleanField(body.messageBn, cleanField(body.messageEn, '', 3000), 3000),
    actionEn: cleanField(body.actionEn, 'Follow local authority instructions.', 1500),
    actionBn: cleanField(body.actionBn, 'স্থানীয় প্রশাসনের নির্দেশনা অনুসরণ করুন।', 1500),
    timestamp,
    isVerified: true,
    isRead: false,
    affectedPopulation: Number.isInteger(body.affectedPopulation) ? body.affectedPopulation : 0,
    source: 'FloodGuard Admin Portal',
    ...(typeof body.originatingAgency === 'string' ? { originatingAgency: cleanField(body.originatingAgency, '', 120) } : {}),
    ...(typeof body.expiryTime === 'string' && !Number.isNaN(Date.parse(body.expiryTime)) ? { expiryTime: body.expiryTime } : {}),
  };

  activeAlerts = [newAlert, ...activeAlerts];
  await saveAlerts(activeAlerts);
  writeOpsAudit(opsDb, 'admin', 'alert.create', newAlert.id);

  res.status(201).json({ success: true, alert: newAlert });
});

// -------------------------------------------------------------
// API: Administrative PIN Verification & Station Thresholds
// -------------------------------------------------------------
const pinVerificationAttempts = new Map<string, { count: number; resetAt: number }>();
app.post('/api/admin/verify-pin', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const state = pinVerificationAttempts.get(ip);
  if (state && state.resetAt <= now) pinVerificationAttempts.delete(ip);
  const current = pinVerificationAttempts.get(ip);
  if (current && current.count >= 10) {
    res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Too many PIN attempts. Try again later.' });
  }
  const headerPin = req.headers['x-admin-pin'];
  const pin = (Array.isArray(headerPin) ? headerPin[0] : headerPin) || req.body?.pin;
  if (verifyAdminPin(pin)) {
    pinVerificationAttempts.delete(ip);
    return res.json({ success: true, authenticated: true });
  }
  const next = current ?? { count: 0, resetAt: now + 15 * 60 * 1000 };
  next.count += 1;
  pinVerificationAttempts.set(ip, next);
  return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
});

app.get('/api/admin/station-thresholds', adminAuthMiddleware, (_req, res) => {
  return res.json({ thresholds: listStationThresholds(opsDb) });
});

app.post('/api/admin/station-threshold', adminAuthMiddleware, (req, res) => {
  const { stationId } = req.body ?? {};
  const dangerLevel = Number(req.body?.dangerLevel);
  const warningLevel = req.body?.warningLevel === undefined ? Number((dangerLevel - 0.5).toFixed(2)) : Number(req.body.warningLevel);
  if (typeof stationId !== 'string' || !INITIAL_LOCATIONS.some((loc) => loc.id === stationId)) {
    return res.status(400).json({ error: 'A valid stationId is required.' });
  }
  if (!Number.isFinite(dangerLevel) || !Number.isFinite(warningLevel) || dangerLevel < 0 || dangerLevel > 50 || warningLevel < 0 || warningLevel >= dangerLevel) {
    return res.status(400).json({ error: 'Thresholds must be finite, non-negative values; warningLevel must be lower than dangerLevel.' });
  }
  const saved = saveStationThreshold(opsDb, stationId, warningLevel, dangerLevel, 'admin');
  writeOpsAudit(opsDb, 'admin', 'station.threshold.update', `${stationId}:warning=${warningLevel}:danger=${dangerLevel}`);
  return res.json({ success: true, threshold: saved });
});

// -------------------------------------------------------------
// API: AI Health Guidance Engine (DSH Hacks V2 - AI x Healthcare)
// -------------------------------------------------------------
app.post('/api/health-guidance', async (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'anonymous';
  const rateLimit = checkAiRateLimit(clientIp);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds || 60));
    return res.status(429).json({
      error: 'Rate limit exceeded for AI health guidance. Maximum 20 requests per 10 minutes.',
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  const validation = validateHealthGuidancePayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const {
    upazila = 'Gowainghat',
    district = 'Sylhet',
    riskTier = 'HIGH',
    standingDays = 3,
    language = 'en',
  } = req.body;

  const disclaimerEn = 'Guidance only, not a medical diagnosis. In an emergency call 999 / 16263 (Shastho Batayan).';
  const disclaimerBn = 'এটি প্রাথমিক স্বাস্থ্য পরামর্শ, কোনো আনুষ্ঠানিক চিকিৎসা নির্ণয় নয়। জরুরি অবস্থায় ৯৯৯ অথবা স্বাস্থ্য বাতায়ন ১৬২৬৩ নম্বরে কল করুন।';

  const defaultGuidance = {
    disclaimer: language === 'en' ? disclaimerEn : disclaimerBn,
    orsPreparation: {
      title: language === 'en' ? 'ORS Preparation' : 'খাবার স্যালাইন তৈরি',
      text:
        language === 'en'
          ? 'If you have an ORS sachet, dissolve the entire sachet in exactly the volume of safe water printed on its packet; sachets are not all the same size. If no sachet is available, mix 6 level teaspoons of sugar and 1/2 level teaspoon of salt into 1 litre of safe drinking water. Use level measuring spoons, not handfuls or pinches. Give small, frequent sips and seek medical care for danger signs.'
          : 'ওআরএস প্যাকেট থাকলে প্যাকেটে লেখা নির্দিষ্ট পরিমাণ নিরাপদ পানিতে পুরো প্যাকেট গুলুন—সব প্যাকেটের পানির পরিমাণ এক নয়। প্যাকেট না থাকলে ১ লিটার নিরাপদ পানিতে ৬ সমান চা-চামচ চিনি এবং আধা সমান চা-চামচ লবণ মেশান। আন্দাজে মুঠো বা আঙুলের চিমটি ব্যবহার করবেন না। অল্প অল্প করে বারবার পান করান; বিপদের লক্ষণ থাকলে দ্রুত চিকিৎসা নিন।',
    },
    safeWater: {
      title: language === 'en' ? 'Safe Water Purification' : 'নিরাপদ পানি বিশুদ্ধকরণ',
      text:
        language === 'en'
          ? 'Use bottled water when available. Otherwise, bring clear water to a rolling boil for 1 minute, cool it naturally, and store it in a clean covered container. If water is cloudy, let solids settle and filter it through a clean cloth before boiling. Water-purification tablets must be used exactly as their product label or local health authority instructs. Boiling or disinfection does not remove fuel, pesticides, heavy metals, or other chemical contamination; do not use water suspected of chemical contamination.'
          : 'সম্ভব হলে বোতলজাত নিরাপদ পানি ব্যবহার করুন। তা না থাকলে পরিষ্কার পানিকে টগবগ করে ১ মিনিট ফুটিয়ে স্বাভাবিকভাবে ঠান্ডা করুন এবং পরিষ্কার ঢাকনাযুক্ত পাত্রে রাখুন। পানি ঘোলা হলে আগে থিতিয়ে নিয়ে পরিষ্কার কাপড় দিয়ে ছেঁকে তারপর ফুটান। পানি বিশুদ্ধকরণ ট্যাবলেটের মাত্রা ও অপেক্ষার সময় প্যাকেট বা স্থানীয় স্বাস্থ্য কর্তৃপক্ষের নির্দেশ অনুযায়ী ঠিক করুন। ফুটানো বা জীবাণুমুক্ত করলেও জ্বালানি, কীটনাশক, ভারী ধাতু বা রাসায়নিক দূষণ দূর হয় না—এমন পানি ব্যবহার করবেন না।',
    },
    woundCare: {
      title: language === 'en' ? 'Wound Care & Skin Protection' : 'ক্ষত ও ত্বকের যত্ন',
      text:
        language === 'en'
          ? 'Wash abrasions immediately with boiled water and clean soap. Apply antiseptic ointment and keep wounds elevated and dry. Avoid prolonged wading with open skin lesions to prevent leptospirosis and cellulitis.'
          : 'কাটাছেঁড়া বা ঘা তৎক্ষণাৎ পরিষ্কার ফোটানো পানি ও সাবান দিয়ে ধুয়ে নিন। অ্যান্টিসেপটিক মলম লাগান এবং শুকনো রাখুন। শরীরে ক্ষত থাকলে দীর্ঘক্ষণ বন্যার নোংরা পানিতে হাঁটবেন না।',
    },
    snakebiteSteps: {
      title: language === 'en' ? 'Snakebite Immediate Protocol' : 'সাপের কামড়ে করণীয়',
      text:
        language === 'en'
          ? 'Keep the patient calm and immobilize the bitten limb with a splint/cloth (like a fracture). DO NOT cut the wound, suck venom, or apply tight tourniquets. Transport immediately to the nearest Upazila Health Complex for polyvalent antivenom.'
          : 'রোগীকে শান্ত রাখুন এবং কামড় দেওয়া অঙ্গ নড়াচড়া না করে কাঠের টুকরো/কাপড় দিয়ে স্থির রাখুন। কখনোই ক্ষতস্থান কাটবেন না, মুখ দিয়ে বিষ চুষবেন না বা শক্ত দড়ি দিয়ে বাঁধন দেবেন না। অবিলম্বে উপজেলা স্বাস্থ্য কমপ্লেক্সে নিয়ে যান।',
    },
    clinicRedFlags: {
      title: language === 'en' ? 'When to Go to a Clinic' : 'কখন দ্রুত হাসপাতালে যাবেন',
      text:
        language === 'en'
          ? 'Rush to clinic if: high fever (>102°F) with chills, severe dehydration (sunken eyes, no urine >6 hours, extreme lethargy), persistent vomiting unable to retain ORS, blood in stool, or snakebite puncture marks.'
          : 'চোখ গর্তে যাওয়া বা ৬ ঘণ্টার বেশি প্রস্রাব না হওয়া, অতিরিক্ত বমি, তীব্র জ্বর, মলে রক্ত অথবা সাপের কামড়ের লক্ষণ দেখা দিলে এক মুহূর্ত দেরি না করে হাসপাতালে নিয়ে যান।',
    },
  };

  // Keep dose and water-treatment instructions deterministic; a generative model
  // must not invent or alter safety-critical public-health guidance.
  return res.json(defaultGuidance);
});

// -------------------------------------------------------------
// Operations Center backend: SQLite database, monitoring engine, live stream
// -------------------------------------------------------------
const opsDb = openDb(process.env.OPS_DB_PATH || path.resolve(process.cwd(), 'data', 'floodguard.db'));

async function getLiveLocations() {
  const now = Date.now();
  if (!cachedWeather || now - cachedWeather.timestamp >= WEATHER_CACHE_TTL_MS) {
    cachedWeather = { timestamp: now, data: await fetchOpenMeteoData() };
  }
  return {
    locations: mapWeatherToLocations(INITIAL_LOCATIONS.map((location) => {
      const saved = getStationThreshold(opsDb, location.id);
      return saved ? { ...location, warningLevel: saved.warning_level, dangerLevel: saved.danger_level } : location;
    }), cachedWeather.data),
    isLive: cachedWeather.data.isLive,
  };
}

app.use('/api/ops', createOpsRouter(opsDb, INITIAL_LOCATIONS, getLiveLocations));

async function monitoringTick() {
  try {
    const live = await getLiveLocations();
    const out = runCycle(opsDb, live.locations, { source: live.isLive ? 'weather_enriched' : 'fallback' });
    if (out.queued > 0) await flushOutboxToWebhook(opsDb, process.env.NOTIFY_WEBHOOK_URL);
    console.log(`[Ops] Recorded ${out.readings} readings, ${out.newEvents.length} new alert events, ${out.queued} queued messages.`);
  } catch (err: any) {
    console.warn('[Ops] Monitoring cycle failed:', err?.message);
  }
}

function startMonitoring() {
  if (process.env.OPS_SEED_DEMO !== 'false') {
    const seeded = seedDemoHistory(opsDb, INITIAL_LOCATIONS);
    if (seeded > 0) console.log(`[Ops] Seeded ${seeded} clearly-labelled demo_seed readings for the recorded-data forecast.`);
  }
  const minutes = Math.max(1, Number(process.env.OPS_INTERVAL_MIN) || 15);
  setTimeout(monitoringTick, 3000);
  setInterval(monitoringTick, minutes * 60 * 1000).unref();
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    geminiEnabled: Boolean(ai),
    openMeteoCached: Boolean(cachedWeather),
    glofasCached: Boolean(cachedRiver),
    backtestCached: Boolean(cachedBacktest),
    reportsCount: communityReports.length,
    opsReadings: countReadings(opsDb).total,
    alertsCount: activeAlerts.length,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  initializeAdminPin();
  app.listen(PORT, '0.0.0.0', () => {
    startMonitoring();
    console.log(`FloodGuard AI Platform running on http://localhost:${PORT}`);
  });
}

startServer();
