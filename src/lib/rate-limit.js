import { getRateLimitRecord, setRateLimitRecord, clearRateLimitRecord } from './db';

/**
 * Checks and updates rate limit for a specific action and identifier
 * @param {string} key Unique identifier, e.g. `login:user@example.com` or `otp_req:127.0.0.1`
 * @param {number} maxAttempts Maximum allowed attempts
 * @param {number} windowSeconds Time window in seconds
 * @param {number} blockDurationSeconds Lockout duration if limit exceeded
 * @returns {{ allowed: boolean, remaining: number, retryAfterSeconds?: number, message?: string }}
 */
export function checkRateLimit(key, maxAttempts = 5, windowSeconds = 900, blockDurationSeconds = 900) {
  const now = Date.now();
  let record = getRateLimitRecord(key);

  if (!record) {
    record = {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    };
    setRateLimitRecord(key, record);
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // If currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      message: `Too many attempts. Please wait ${retryAfterSeconds > 60 ? Math.ceil(retryAfterSeconds / 60) + ' minutes' : retryAfterSeconds + ' seconds'} and try again later.`,
    };
  }

  // If window expired, reset counter
  if (now - record.firstAttemptAt > windowSeconds * 1000) {
    record = {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    };
    setRateLimitRecord(key, record);
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // Increment within window
  record.count += 1;

  if (record.count > maxAttempts) {
    record.blockedUntil = now + blockDurationSeconds * 1000;
    setRateLimitRecord(key, record);
    const retryAfterSeconds = blockDurationSeconds;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      message: 'Too many attempts. Please wait and try again later.',
    };
  }

  setRateLimitRecord(key, record);
  return { allowed: true, remaining: maxAttempts - record.count };
}

export function resetRateLimit(key) {
  clearRateLimitRecord(key);
}
