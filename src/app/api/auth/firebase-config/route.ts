import { NextResponse } from 'next/server'

/** Public Firebase config check — helps verify billing was enabled on the same project as the app */
export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || null

  return NextResponse.json({
    projectId,
    authDomain,
    hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    hasAdminSdk: !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ),
    authDomainMatchesProject:
      !!projectId && !!authDomain && authDomain.includes(String(projectId)),
    addTheseAuthorizedDomains: ['localhost', '127.0.0.1'],
  })
}
