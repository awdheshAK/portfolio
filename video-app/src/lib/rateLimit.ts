/**
 * Lightweight in-memory sliding-window rate limiter. Good enough for a
 * single-process localhost deployment; swap the Map for Redis (INCR + EXPIRE)
 * when running multiple instances behind a load balancer.
 */
import { env } from './env';

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  max: number = env.rateLimit.maxRequests,
  windowMs: number = env.rateLimit.windowMs,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.windowStart + windowMs };
  }

  existing.count += 1;
  return { allowed: true, remaining: max - existing.count, resetAt: existing.windowStart + windowMs };
}

// Periodic sweep so the map doesn't grow unbounded over a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > env.rateLimit.windowMs * 10) buckets.delete(key);
  }
}, 60_000).unref?.();

export function clientKeyFromRequest(req: Request, suffix = ''): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `${ip}:${suffix}`;
}
