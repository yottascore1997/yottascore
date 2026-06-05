/**
 * Security utilities for production environment
 */

// Blocked IPs list (in production, use database/Redis)
const blockedIPs = new Set<string>();

// Suspicious activity tracking
const suspiciousActivity = new Map<string, number>();

/**
 * Check if IP is blocked
 */
export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

/**
 * Block an IP address
 */
export function blockIP(ip: string, reason?: string) {
  blockedIPs.add(ip);
}

/**
 * Track suspicious activity
 */
export function trackSuspiciousActivity(ip: string): boolean {
  const count = (suspiciousActivity.get(ip) || 0) + 1;
  suspiciousActivity.set(ip, count);
  
  // Auto-block after 10 suspicious attempts
  if (count >= 10) {
    blockIP(ip, 'Multiple suspicious attempts');
    return true;
  }
  
  return false;
}

/**
 * Get client IP from request
 */
export function getClientIP(req: Request): string {
  const headers = req.headers;
  
  // Check common headers for IP
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             headers.get('x-real-ip') ||
             headers.get('cf-connecting-ip') || // Cloudflare
             headers.get('x-client-ip') ||
             'unknown';
  
  return ip;
}

function getAllowedOrigins(): string[] {
  const fromEnv = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.ALLOWED_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => value!.split(',').map((v) => v.trim()))
    .filter(Boolean)

  return [
    ...fromEnv,
    'https://yottascore.com',
    'https://www.yottascore.com',
    'https://examindia.vercel.app',
  ]
}

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`)
    return url.origin
  } catch {
    return null
  }
}

function hostsMatch(a: string, b: string): boolean {
  const left = a.toLowerCase()
  const right = b.toLowerCase()
  return left === right || left === `www.${right}` || `www.${left}` === right
}

/**
 * Validate request origin (prevent CSRF)
 */
export function validateOrigin(req: Request): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const requestOrigin = origin || referer

  if (!requestOrigin) {
    return false
  }

  const requestOriginNormalized = normalizeOrigin(requestOrigin)
  if (!requestOriginNormalized) {
    return false
  }

  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host')?.split(',')[0]?.trim()

  if (host) {
    try {
      const originHost = new URL(requestOriginNormalized).host
      if (hostsMatch(originHost, host)) {
        return true
      }
    } catch {
      // fall through to allow-list
    }
  }

  const allowedOrigins = getAllowedOrigins()
    .map((entry) => normalizeOrigin(entry))
    .filter((entry): entry is string => !!entry)

  return allowedOrigins.includes(requestOriginNormalized)
}

/**
 * Log security events
 */
export function logSecurityEvent(event: {
  type: 'otp_send' | 'otp_verify' | 'login_success' | 'login_fail' | 'rate_limit' | 'ip_block';
  ip: string;
  phoneNumber?: string;
  success: boolean;
  message?: string;
}) {
  const timestamp = new Date().toISOString();
  
// In production, send to monitoring service (e.g., Sentry, DataDog)
  if (process.env.NODE_ENV === 'production' && !event.success) {
    // TODO: Send to monitoring service
    // sentry.captureMessage('Security event', { level: 'warning', extra: event });
  }
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 255); // Limit length
}

