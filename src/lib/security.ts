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
  console.warn(`🚫 IP blocked: ${ip}. Reason: ${reason || 'Suspicious activity'}`);
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

/**
 * Validate request origin (prevent CSRF)
 */
export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // In production, validate against allowed domains
  if (process.env.NODE_ENV === 'production') {
    const allowedDomains = [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://examindia.vercel.app',
      // Add your production domains
    ].filter(Boolean);
    
    if (!origin && !referer) {
      return false; // No origin/referer in production is suspicious
    }
    
    const requestOrigin = origin || referer || '';
    return allowedDomains.some(domain => requestOrigin.startsWith(domain as string));
  }
  
  // In development, allow localhost
  return true;
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
  
  console.log(`🔒 [SECURITY] ${timestamp} - ${event.type}`, {
    ip: event.ip,
    phoneNumber: event.phoneNumber ? `***${event.phoneNumber.slice(-4)}` : undefined,
    success: event.success,
    message: event.message,
  });
  
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

