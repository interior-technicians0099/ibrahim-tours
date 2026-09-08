interface BookingRateLimitBucket {
  count: number;
  windowStart: number;
}

const bookingRateLimitStore = new Map<string, BookingRateLimitBucket>();

const MAX_BOOKINGS_PER_HOUR = 10;
const ONE_HOUR_MS = 60 * 60 * 1000;

export interface BookingRateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMinutes: number;
}

/**
 * Enforces IP-based rate limiting for public booking form submissions.
 * Limits to 10 requests per hour per client IP.
 */
export function checkBookingRateLimit(ip: string): BookingRateLimitResult {
  const now = Date.now();
  const bucket = bookingRateLimitStore.get(ip);

  if (!bucket || now - bucket.windowStart > ONE_HOUR_MS) {
    // New or expired window
    bookingRateLimitStore.set(ip, {
      count: 1,
      windowStart: now,
    });
    return {
      allowed: true,
      remainingAttempts: MAX_BOOKINGS_PER_HOUR - 1,
      retryAfterMinutes: 0,
    };
  }

  if (bucket.count >= MAX_BOOKINGS_PER_HOUR) {
    const retryAfterMinutes = Math.ceil((bucket.windowStart + ONE_HOUR_MS - now) / (60 * 1000));
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMinutes,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remainingAttempts: MAX_BOOKINGS_PER_HOUR - bucket.count,
    retryAfterMinutes: 0,
  };
}

/**
 * Resets tracking for a given IP (useful for testing).
 */
export function resetBookingRateLimit(ip: string): void {
  bookingRateLimitStore.delete(ip);
}
