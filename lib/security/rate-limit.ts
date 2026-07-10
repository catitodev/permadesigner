/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding window per user ID. Not suitable for multi-instance
 * deployments (use Redis/Upstash for production at scale), but sufficient
 * for single-instance free-tier hosting.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20; // per window per user

/**
 * Checks if a user has exceeded the rate limit.
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export function checkRateLimit(userId: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const entry = store.get(userId) ?? { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = WINDOW_MS - (now - oldestInWindow);
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  store.set(userId, entry);
  return { allowed: true };
}

/**
 * Clears rate limit data for a user (useful on account deletion).
 */
export function clearRateLimit(userId: string): void {
  store.delete(userId);
}
