/** Tiny in-memory sliding-window rate limiter keyed by client IP. */
export function makeLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
    }
    recent.push(now);
    hits.set(key, recent);
    // opportunistic cleanup so the map cannot grow without bound
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
    return { allowed: true, retryAfterSeconds: 0 };
  };
}
