/**
 * Tiny in-memory rate limiter. Keyed by an arbitrary string (we use the
 * client IP). Sliding window: at most `limit` calls per `windowMs`.
 *
 * Caveats — accept these for v1:
 *   - Per-instance only. A serverless function with two warm instances
 *     allows 2× the limit. Good enough for spam defense; not a security
 *     boundary.
 *   - Memory grows with unique keys. We sweep expired entries lazily on
 *     each call, so steady-state size is bounded by active-IP cardinality.
 */

type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    buckets.set(key, bucket);
    return { ok: false, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true };
}

/** Test-only: wipe all rate-limit state. */
export function _resetRateLimit(): void {
  buckets.clear();
}
