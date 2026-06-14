import * as admin from 'firebase-admin'
import { getFirebaseServiceAccount } from '@/lib/firebase-service-account'

let initError: string | null = null

function ensureFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.auth()
  }

  if (initError) {
    throw new Error(initError)
  }

  try {
    const serviceAccount = getFirebaseServiceAccount()
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    return admin.auth()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Firebase Admin init error'
    initError = message
    throw new Error(message)
  }
}

export const adminAuth = {
  verifyIdToken: (idToken: string, checkRevoked?: boolean) =>
    ensureFirebaseAdmin().verifyIdToken(idToken, checkRevoked),
}

export const isAdminSDKInitialized = () => {
  try {
    getFirebaseServiceAccount()
    return true
  } catch {
    return false
  }
}

export default admin
