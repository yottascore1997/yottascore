import { formatFirebasePrivateKey } from '@/lib/firebase-private-key'

type ServiceAccountConfig = {
  projectId: string
  clientEmail: string
  privateKey: string
}

function fromServiceAccountJson(parsed: {
  project_id?: string
  client_email?: string
  private_key?: string
}): ServiceAccountConfig {
  const projectId = parsed.project_id?.trim()
  const clientEmail = parsed.client_email?.trim()
  const privateKey = formatFirebasePrivateKey(parsed.private_key)

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is invalid. It must include project_id, client_email, and private_key.'
    )
  }

  return { projectId, clientEmail, privateKey }
}

function parseServiceAccountJson(raw: string): ServiceAccountConfig {
  try {
    return fromServiceAccountJson(JSON.parse(raw.trim()))
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.')
  }
}

export function getFirebaseServiceAccount(): ServiceAccountConfig {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (jsonEnv) {
    return parseServiceAccountJson(jsonEnv)
  }

  const base64Env = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim()
  if (base64Env) {
    try {
      const decoded = Buffer.from(base64Env, 'base64').toString('utf8')
      return parseServiceAccountJson(decoded)
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 could not be decoded.')
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  const privateKey = formatFirebasePrivateKey(process.env.FIREBASE_PRIVATE_KEY)

  const missing: string[] = []
  if (!projectId) missing.push('FIREBASE_PROJECT_ID')
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL')
  if (!privateKey) {
    const raw = process.env.FIREBASE_PRIVATE_KEY
    if (raw?.includes('BEGIN PRIVATE KEY') && !raw.includes('END PRIVATE KEY')) {
      throw new Error(
        'FIREBASE_PRIVATE_KEY is truncated (missing END PRIVATE KEY). ' +
          'Copy the full private_key from Firebase service account JSON, or set FIREBASE_SERVICE_ACCOUNT_JSON instead.'
      )
    }
    missing.push('FIREBASE_PRIVATE_KEY')
  }

  if (missing.length > 0) {
    throw new Error(`Missing or invalid Firebase Admin env: ${missing.join(', ')}`)
  }

  return {
    projectId: projectId!,
    clientEmail: clientEmail!,
    privateKey: privateKey!,
  }
}

export function getFirebaseCredentialSource():
  | 'service_account_json'
  | 'service_account_base64'
  | 'split_env'
  | 'none' {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) return 'service_account_json'
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim()) return 'service_account_base64'
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return 'split_env'
  }
  return 'none'
}
