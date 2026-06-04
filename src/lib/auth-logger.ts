/**
 * Auth event logging. Never log passwords.
 */

export type AuthEvent = 'login_failed' | 'login_success' | 'register_success' | 'logout'

export function logAuthEvent(
  _event: AuthEvent,
  _opts: { ip: string; identifier?: string; userId?: string; reason?: string }
) {
  // Intentionally no-op (console logging removed)
}
