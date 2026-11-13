import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

let generatedRandomPin: string | null = null;

/**
 * Initializes or retrieves the Admin PIN.
 * Reads strictly from process.env.ADMIN_PIN.
 * If unset, generates a random 6-digit PIN and logs it only in non-production.
 */
export function initializeAdminPin(): string {
  const envPin = process.env.ADMIN_PIN?.trim();
  if (envPin && envPin.length >= 6 && envPin.length <= 128) {
    return envPin;
  }
  if (envPin) {
    throw new Error('ADMIN_PIN must be between 6 and 128 characters.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_PIN must be configured in production. Set a unique PIN with at least 6 characters.');
  }
  if (!generatedRandomPin) {
    generatedRandomPin = crypto.randomInt(100000, 1000000).toString();
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n========================================================`);
      console.log(`[SECURITY] ADMIN_PIN is not set in environment.`);
      console.log(`Generated Ephemeral Admin PIN: ${generatedRandomPin}`);
      console.log(`Use this PIN to access the Admin Console & verify reports.`);
      console.log(`========================================================\n`);
    }
  }
  return generatedRandomPin;
}

/**
 * Retrieves the configured or generated Admin PIN
 */
export function getAdminPin(): string {
  return initializeAdminPin();
}

/**
 * Validates a provided candidate PIN against the configured Admin PIN using constant-time comparison
 */
export function verifyAdminPin(candidatePin: string | null | undefined): boolean {
  if (!candidatePin || typeof candidatePin !== 'string') {
    return false;
  }
  const cleanCandidate = candidatePin.trim();
  const actualPin = getAdminPin();
  
  const candidateBuf = Buffer.from(cleanCandidate, 'utf-8');
  const actualBuf = Buffer.from(actualPin, 'utf-8');
  if (candidateBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, actualBuf);
}

/**
 * Express middleware protecting administrative / mutating endpoints.
 * Requires the 'x-admin-pin' header to match the configured ADMIN_PIN.
 */
const failedAdminAttempts = new Map<string, { count: number; resetAt: number }>();
const ADMIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_MAX_FAILED_ATTEMPTS = 10;

export function adminAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const headerValue = req.headers['x-admin-pin'];
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const previous = failedAdminAttempts.get(ip);
  if (previous && previous.resetAt <= now) failedAdminAttempts.delete(ip);
  const current = failedAdminAttempts.get(ip);
  if (current && current.count >= ADMIN_MAX_FAILED_ATTEMPTS) {
    res.setHeader('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    res.status(429).json({ error: 'Too many invalid Admin PIN attempts. Try again later.' });
    return;
  }

  if (!verifyAdminPin(candidate)) {
    const state = failedAdminAttempts.get(ip) ?? { count: 0, resetAt: now + ADMIN_ATTEMPT_WINDOW_MS };
    state.count += 1;
    failedAdminAttempts.set(ip, state);
    res.status(401).json({
      error: 'Unauthorized: Invalid or missing Admin PIN.',
    });
    return;
  }

  failedAdminAttempts.delete(ip);
  next();
}
