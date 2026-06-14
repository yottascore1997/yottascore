import { NextResponse } from 'next/server'
import {
  getFirebaseCredentialSource,
} from '@/lib/firebase-service-account'
import { validatePrivateKeyShape } from '@/lib/firebase-private-key'
import { isAdminSDKInitialized } from '@/lib/firebase-admin'

/** Public Firebase config check — helps debug production OTP login */
export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || null
  const adminProjectId = process.env.FIREBASE_PROJECT_ID || null
  const credentialSource = getFirebaseCredentialSource()
  const privateKeyCheck = validatePrivateKeyShape(process.env.FIREBASE_PRIVATE_KEY)

  let adminReady = false
  let adminError: string | null = null
  try {
    adminReady = isAdminSDKInitialized()
  } catch (error) {
    adminError = error instanceof Error ? error.message : 'unknown'
  }

  return NextResponse.json({
    projectId,
    authDomain,
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    adminProjectId,
    credentialSource,
    privateKeyValid: privateKeyCheck.ok,
    privateKeyIssue: privateKeyCheck.reason || null,
    hasServiceAccountJson: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    hasServiceAccountBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    adminReady,
    adminError,
    authDomainMatchesProject:
      !!projectId && !!authDomain && authDomain.includes(String(projectId)),
    recommendedForRailway:
      'Set FIREBASE_SERVICE_ACCOUNT_JSON to the full minified service-account JSON from Firebase Console.',
  })
}
