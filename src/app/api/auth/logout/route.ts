import { NextResponse } from 'next/server'
import { hashRefreshToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAuthEvent } from '@/lib/auth-logger'
import { getClientIp } from '@/lib/rate-limit'
import { withCORS } from '@/lib/cors'

const handler = async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}))
    const refreshToken = (body.refreshToken || req.headers.get('authorization')?.replace('Bearer ', '')).trim()
    const ip = getClientIp(req)

    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken)
      const found = await prisma.refreshToken.findFirst({
        where: { tokenHash },
        select: { userId: true },
      })
      if (found) {
        logAuthEvent('logout', { ip, userId: found.userId })
      }
      await prisma.refreshToken.deleteMany({
        where: { tokenHash },
      })
    }

    return NextResponse.json({ message: 'Logged out' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }))
