/**
 * Simple in-memory rate limiter for OTP requests
 * For production, use Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for scalability)
const otpRequestStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
const RATE_LIMITS = {
  OTP_PER_HOUR: 3,        // Max 3 OTP requests per hour per phone
  OTP_PER_DAY: 10,        // Max 10 OTP requests per day per phone
  OTP_PER_IP_HOUR: 10,    // Max 10 OTP requests per hour per IP
  HOUR_IN_MS: 60 * 60 * 1000,
  DAY_IN_MS: 24 * 60 * 60 * 1000,
};

/**
 * Check if rate limit exceeded
 */
export function checkRateLimit(
  identifier: string, 
  limit: number, 
  windowMs: number
): { allowed: boolean; resetIn?: number } {
  const now = Date.now();
  const entry = otpRequestStore.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    // No existing entry or expired - allow request
    otpRequestStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true };
  }
  
  if (entry.count >= limit) {
    // Rate limit exceeded
    const resetIn = Math.ceil((entry.resetTime - now) / 1000); // seconds
    return { allowed: false, resetIn };
  }
  
  // Increment counter
  entry.count++;
  otpRequestStore.set(identifier, entry);
  return { allowed: true };
}

/**
 * Check OTP rate limit for phone number
 */
export function checkOTPRateLimit(phoneNumber: string): {
  allowed: boolean;
  message?: string;
} {
  // Check hourly limit
  const hourlyCheck = checkRateLimit(
    `otp:hour:${phoneNumber}`,
    RATE_LIMITS.OTP_PER_HOUR,
    RATE_LIMITS.HOUR_IN_MS
  );
  
  if (!hourlyCheck.allowed) {
    return {
      allowed: false,
      message: `Too many OTP requests. Please try again in ${hourlyCheck.resetIn} seconds.`,
    };
  }
  
  // Check daily limit
  const dailyCheck = checkRateLimit(
    `otp:day:${phoneNumber}`,
    RATE_LIMITS.OTP_PER_DAY,
    RATE_LIMITS.DAY_IN_MS
  );
  
  if (!dailyCheck.allowed) {
    return {
      allowed: false,
      message: `Daily OTP limit exceeded. Please try again tomorrow.`,
    };
  }
  
  return { allowed: true };
}

/**
 * Check IP-based rate limit
 */
export function checkIPRateLimit(ip: string): {
  allowed: boolean;
  message?: string;
} {
  const check = checkRateLimit(
    `ip:hour:${ip}`,
    RATE_LIMITS.OTP_PER_IP_HOUR,
    RATE_LIMITS.HOUR_IN_MS
  );
  
  if (!check.allowed) {
    return {
      allowed: false,
      message: `Too many requests from your IP. Please try again in ${check.resetIn} seconds.`,
    };
  }
  
  return { allowed: true };
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupExpiredEntries() {
  const now = Date.now();
  let cleaned = 0;
  
  Array.from(otpRequestStore.entries()).forEach(([key, entry]) => {
    if (now > entry.resetTime) {
      otpRequestStore.delete(key);
      cleaned++;
    }
  });
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired rate limit entries`);
  }
}

// Auto cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, RATE_LIMITS.HOUR_IN_MS);
}

