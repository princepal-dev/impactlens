import "server-only";

type Bucket = { hits: number[] };
const g = globalThis as unknown as { __impactlensRate?: Map<string, Bucket>; __impactlensLocks?: Set<string> };
const buckets: Map<string, Bucket> = (g.__impactlensRate ??= new Map());
const locks: Set<string> = (g.__impactlensLocks ??= new Set());

export function clientKey(req: Request) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "local";
}

/**
 * Sliding-window limiter (per process). Returns a 429 response when the caller exceeded
 * `limit` requests in `windowMs`, otherwise null.
 */
export function rateLimit(req: Request, scope: string, limit: number, windowMs = 60_000): Response | null {
  const key = `${scope}:${clientKey(req)}`;
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - bucket.hits[0])) / 1000);
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again.", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (!b.hits.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return null;
}

/** Run `fn` only if no other request holds `key`; returns null when the lock is taken. */
export async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T | null> {
  if (locks.has(key)) return null;
  locks.add(key);
  try {
    return await fn();
  } finally {
    locks.delete(key);
  }
}

export const isLocked = (key: string) => locks.has(key);
