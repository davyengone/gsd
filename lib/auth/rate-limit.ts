/**
 * Best-effort in-memory sliding-window rate limiter.
 * On serverless (Vercel), each isolate has its own Map — fine for v1 private use.
 * Replace with Upstash Redis before multi-user / public listing.
 */

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_WRITE_CALLS_PER_WINDOW = 30;

export function assertWithinRateLimit(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (bucket.timestamps.length >= MAX_WRITE_CALLS_PER_WINDOW) {
    buckets.set(key, bucket);
    throw new Error(
      `Rate limit exceeded: max ${MAX_WRITE_CALLS_PER_WINDOW} calls per minute`,
    );
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
}
