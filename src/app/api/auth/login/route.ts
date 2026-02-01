import { NextResponse } from 'next/server'
import {
  findUserForLogin,
  validateUser,
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
} from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { logAuthEvent } from '@/lib/auth-logger'
import { z } from 'zod'
import { withCORS } from '@/lib/cors'
import { prisma } from '@/lib/prisma'

const loginSchema = z.object({
  identifier: z.string().min(3).max(255),
  password: z.string().min(6).max(128),
})

const handler = async (req: Request) => {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(`login:${ip}`)
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Try again after 15 minutes.',
          retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000),
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const validatedFields = loginSchema.safeParse(body)
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Invalid fields', details: validatedFields.error.errors },
        { status: 400 }
      )
    }

    const { identifier, password } = validatedFields.data
    const existingUser = await findUserForLogin(identifier)
    if (existingUser?.lockedUntil && existingUser.lockedUntil > new Date()) {
      logAuthEvent('login_failed', { ip, identifier, reason: 'account_locked' })
      return NextResponse.json(
        { error: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.' },
        { status: 423 }
      )
    }
    const user = await validateUser(identifier, password)

    if (!user) {
      logAuthEvent('login_failed', { ip, identifier, reason: 'invalid_credentials' })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    logAuthEvent('login_success', { ip, identifier, userId: user.id })

    const accessToken = await signAccessToken({ userId: user.id, role: user.role })
    const refreshToken = await signRefreshToken({ userId: user.id, role: user.role })
    const tokenHash = hashRefreshToken(refreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7d
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    })

    return NextResponse.json({
      token: accessToken,
      refreshToken,
      expiresIn: 900, // 15 min in seconds
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }))
