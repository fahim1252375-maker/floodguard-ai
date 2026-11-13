import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkAiRateLimit,
  resetAiRateLimits,
  validateChatPayload,
  validatePredictPayload,
  validateHealthGuidancePayload,
  AI_RATE_LIMIT_MAX,
} from './security';

describe('API Security - checkAiRateLimit', () => {
  beforeEach(() => {
    resetAiRateLimits();
  });

  it('allows requests up to the maximum limit (20)', () => {
    const ip = '192.168.1.100';
    for (let i = 0; i < AI_RATE_LIMIT_MAX; i++) {
      const res = checkAiRateLimit(ip);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(AI_RATE_LIMIT_MAX - (i + 1));
    }
  });

  it('blocks request #21 with HTTP 429 and retry-after header advice', () => {
    const ip = '192.168.1.101';
    for (let i = 0; i < AI_RATE_LIMIT_MAX; i++) {
      checkAiRateLimit(ip);
    }

    const blocked = checkAiRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe('API Security - Payload Validation', () => {
  it('validates chat payload correctly', () => {
    expect(validateChatPayload(null).valid).toBe(false);
    expect(validateChatPayload({ message: '' }).valid).toBe(false);
    expect(validateChatPayload({ message: 'a'.repeat(2001) }).valid).toBe(false);
    expect(validateChatPayload({ message: 'Valid question', language: 'invalid' }).valid).toBe(false);
    expect(validateChatPayload({ message: 'Valid question', language: 'bn' }).valid).toBe(true);
  });

  it('validates predict payload correctly', () => {
    expect(validatePredictPayload({}).valid).toBe(false);
    expect(
      validatePredictPayload({ locationName: 'Gowainghat', waterLevel: -5, dangerLevel: 10.5 }).valid
    ).toBe(false);
    expect(
      validatePredictPayload({ locationName: 'Gowainghat', waterLevel: 11.2, dangerLevel: 10.8 }).valid
    ).toBe(true);
  });

  it('validates health guidance payload correctly', () => {
    expect(validateHealthGuidancePayload({}).valid).toBe(false);
    expect(
      validateHealthGuidancePayload({
        upazila: 'Gowainghat',
        district: 'Sylhet',
        riskTier: 'INVALID_TIER',
      }).valid
    ).toBe(false);
    expect(
      validateHealthGuidancePayload({
        upazila: 'Gowainghat',
        district: 'Sylhet',
        riskTier: 'SEVERE',
        language: 'bn',
      }).valid
    ).toBe(true);
  });
});
