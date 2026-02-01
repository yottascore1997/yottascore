/**
 * Auth event logging. Never log passwords.
 */

export type AuthEvent = 'login_failed' | 'login_success' | 'register_success' | 'logout'

export function logAuthEvent(
  event: AuthEvent,
  opts: { ip: string; identifier?: string; userId?: string; reason?: string }
) {
  const { ip, identifier, userId, reason } = opts
  const payload: Record<string, string | undefined> = {
    event,
    ip,
    identifier: identifier ? maskIdentifier(identifier) : undefined,
    userId,
    reason,
    at: new Date().toISOString(),
  }
  if (event === 'login_failed') {
    console.warn('[AUTH_LOG]', JSON.stringify(payload))
  } else {
    console.log('[AUTH_LOG]', JSON.stringify(payload))
  }
}

function maskIdentifier(id: string): string {
  if (!id || id.length < 4) return '***'
  if (id.includes('@')) {
    const [local, domain] = id.split('@')
    const masked = local.slice(0, 2) + '***' + local.slice(-1)
    return `${masked}@${domain}`
  }
  return id.slice(0, 2) + '***' + id.slice(-1)
}
