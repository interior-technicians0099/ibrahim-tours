interface RateLimitBucket {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout duration

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSec: number;
}

/**
 * Checks whether an IP+Email identifier is allowed to attempt login.
 */
export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSec: 0 };
  }

  // Check active lockout
  if (bucket.lockedUntil && now < bucket.lockedUntil) {
    const retryAfterSec = Math.ceil((bucket.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  // Reset bucket if window expired
  if (now - bucket.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, retryAfterSec: 0 };
  }

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - bucket.attempts);
  const allowed = bucket.attempts < MAX_ATTEMPTS;
  const retryAfterSec = allowed ? 0 : Math.ceil((bucket.firstAttemptAt + WINDOW_MS - now) / 1000);

  return { allowed, remainingAttempts, retryAfterSec };
}

/**
 * Records a failed login attempt and sets lockout if threshold reached.
 */
export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || now - bucket.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttemptAt: now,
    });
    return;
  }

  bucket.attempts += 1;
  if (bucket.attempts >= MAX_ATTEMPTS) {
    bucket.lockedUntil = now + LOCKOUT_MS;
  }
}

/**
 * Clears rate limit tracking upon successful authentication.
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
