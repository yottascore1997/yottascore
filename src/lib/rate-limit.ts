/**
 * In-memory rate limit by key (e.g. IP).
 * For multi-instance/serverless use Redis (e.g. @upstash/ratelimit).
 */

const store = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000 // 15 min
const MAX_ATTEMPTS = 10

function cleanup() {
  const now = Date.now()
  for (const [key, v] of store.entries()) {
    if (v.resetAt < now) store.delete(key)
  }
}

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup()
  const now = Date.now()
  const entry = store.get(key)
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetAt: now + WINDOW_MS }
  }
  if (now > entry.resetAt) {
    entry.count = 1
    entry.resetAt = now + WINDOW_MS
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetAt: entry.resetAt }
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, resetAt: entry.resetAt }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || 'unknown'
}
