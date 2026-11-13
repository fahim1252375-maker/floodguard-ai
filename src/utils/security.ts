/**
 * API Security, Validation, and Rate Limiting Utilities
 * Enforces per-IP rate limiting, payload validation, and request sanitization
 * for FloodGuard AI backend endpoints.
 */

// Per-IP rate limiting map: ip -> timestamps[]
const aiRateLimitMap = new Map<string, number[]>();

export const AI_RATE_LIMIT_MAX = 20; // 20 requests
export const AI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * Checks in-memory rate limit for AI endpoints (/api/chat, /api/predict-ai, /api/health-guidance)
 * Policy: 20 requests per 10 minutes per IP.
 */
export function checkAiRateLimit(
  ip: string,
  maxRequests: number = AI_RATE_LIMIT_MAX,
  windowMs: number = AI_RATE_LIMIT_WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  const cleanIp = (ip || 'anonymous').trim();
  const history = aiRateLimitMap.get(cleanIp) || [];

  // Remove timestamps outside sliding window
  const activeHistory = history.filter((ts) => now - ts < windowMs);

  if (activeHistory.length >= maxRequests) {
    const oldest = activeHistory[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  activeHistory.push(now);
  aiRateLimitMap.set(cleanIp, activeHistory);

  return {
    allowed: true,
    remaining: maxRequests - activeHistory.length,
  };
}

export function resetAiRateLimits(): void {
  aiRateLimitMap.clear();
}

/**
 * Validates /api/chat payload
 */
export function validateChatPayload(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  const { message, history, language } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return { valid: false, error: 'Field "message" is required and must be a non-empty string.' };
  }

  if (message.length > 2000) {
    return { valid: false, error: 'Field "message" exceeds maximum allowed length of 2000 characters.' };
  }

  if (history !== undefined && !Array.isArray(history)) {
    return { valid: false, error: 'Field "history" must be an array of messages.' };
  }

  if (language !== undefined && language !== 'en' && language !== 'bn') {
    return { valid: false, error: 'Field "language" must be either "en" or "bn".' };
  }

  return { valid: true };
}

/**
 * Validates /api/predict-ai payload
 */
export function validatePredictPayload(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  const { locationName, waterLevel, dangerLevel } = body;

  if (!locationName || typeof locationName !== 'string' || !locationName.trim()) {
    return { valid: false, error: 'Field "locationName" is required and must be a string.' };
  }

  if (typeof waterLevel !== 'number' || isNaN(waterLevel) || waterLevel < 0 || waterLevel > 50) {
    return { valid: false, error: 'Field "waterLevel" must be a valid number between 0 and 50 meters.' };
  }

  if (typeof dangerLevel !== 'number' || isNaN(dangerLevel) || dangerLevel < 0 || dangerLevel > 50) {
    return { valid: false, error: 'Field "dangerLevel" must be a valid number between 0 and 50 meters.' };
  }

  return { valid: true };
}

/**
 * Validates /api/health-guidance payload
 */
export function validateHealthGuidancePayload(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  const { upazila, district, riskTier, language } = body;

  if (!upazila || typeof upazila !== 'string' || !upazila.trim()) {
    return { valid: false, error: 'Field "upazila" is required.' };
  }

  if (!district || typeof district !== 'string' || !district.trim()) {
    return { valid: false, error: 'Field "district" is required.' };
  }

  const validTiers = ['LOW', 'MODERATE', 'HIGH', 'SEVERE'];
  if (riskTier && !validTiers.includes(riskTier)) {
    return { valid: false, error: `Field "riskTier" must be one of: ${validTiers.join(', ')}.` };
  }

  if (language && language !== 'en' && language !== 'bn') {
    return { valid: false, error: 'Field "language" must be either "en" or "bn".' };
  }

  return { valid: true };
}
