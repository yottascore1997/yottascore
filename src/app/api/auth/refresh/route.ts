import { NextResponse } from 'next/server'
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withCORS } from '@/lib/cors'

const handler = async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}))
    const refreshToken = (body.refreshToken || req.headers.get('authorization')?.replace('Bearer ', '')).trim()
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 401 })
    }

    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 })
    }

    const oldHash = hashRefreshToken(refreshToken)
    await prisma.refreshToken.deleteMany({
      where: { userId: payload.userId, tokenHash: oldHash },
    })

    const newAccessToken = await signAccessToken({ userId: payload.userId, role: payload.role })
    const newRefreshToken = await signRefreshToken({ userId: payload.userId, role: payload.role })
    const newTokenHash = hashRefreshToken(newRefreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({
      data: { userId: payload.userId, tokenHash: newTokenHash, expiresAt },
    })

    return NextResponse.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    })
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }))
