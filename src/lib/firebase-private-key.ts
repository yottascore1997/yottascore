/**
 * Normalize Firebase service-account private key from env (Railway / .env often mangle PEM newlines).
 */
export function formatFirebasePrivateKey(rawKey: string | undefined): string | undefined {
  if (!rawKey) return undefined

  let key = rawKey.trim()

  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim()
  }

  key = key.replace(/\\n/g, '\n')

  if (!key.includes('\n')) {
    key = key.replace(/\\\\n/g, '\n')
  }

  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  if (key.includes('BEGIN PRIVATE KEY') && !key.includes('\n')) {
    key = key
      .replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n')
      .replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----')
  }

  if (!key.includes('BEGIN PRIVATE KEY') || !key.includes('END PRIVATE KEY')) {
    return undefined
  }

  return key
}

export function validatePrivateKeyShape(rawKey: string | undefined): {
  ok: boolean
  reason?: string
} {
  if (!rawKey?.trim()) {
    return { ok: false, reason: 'not_set' }
  }

  const formatted = formatFirebasePrivateKey(rawKey)
  if (!formatted) {
    if (rawKey.includes('BEGIN PRIVATE KEY') && !rawKey.includes('END PRIVATE KEY')) {
      return { ok: false, reason: 'truncated_missing_end' }
    }
    return { ok: false, reason: 'invalid_pem' }
  }

  if (formatted.length < 500) {
    return { ok: false, reason: 'too_short' }
  }

  return { ok: true }
}
