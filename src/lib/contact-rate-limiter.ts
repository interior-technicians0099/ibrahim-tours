interface ContactRateLimitBucket {
  count: number;
  windowStart: number;
}

const contactRateLimitStore = new Map<string, ContactRateLimitBucket>();

const MAX_CONTACTS_PER_WINDOW = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface ContactRateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMinutes: number;
}

/**
 * Enforces IP-based rate limiting for public contact form submissions.
 * Limits to 5 requests per 15 minutes per client IP.
 */
export function checkContactRateLimit(ip: string): ContactRateLimitResult {
  const now = Date.now();
  const bucket = contactRateLimitStore.get(ip);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    contactRateLimitStore.set(ip, {
      count: 1,
      windowStart: now,
    });
    return {
      allowed: true,
      remainingAttempts: MAX_CONTACTS_PER_WINDOW - 1,
      retryAfterMinutes: 0,
    };
  }

  if (bucket.count >= MAX_CONTACTS_PER_WINDOW) {
    const retryAfterMinutes = Math.ceil((bucket.windowStart + WINDOW_MS - now) / (60 * 1000));
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMinutes,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remainingAttempts: MAX_CONTACTS_PER_WINDOW - bucket.count,
    retryAfterMinutes: 0,
  };
}

/**
 * Resets contact rate limiting for a specific IP (useful for testing).
 */
export function resetContactRateLimit(ip: string): void {
  contactRateLimitStore.delete(ip);
}
