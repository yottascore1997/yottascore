import { NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/lib/auth'
import { comparePasswords } from '@/lib/auth'

const handler = async (req: Request) => {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyAccessToken(token)
    if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const password = String((body as any)?.password ?? '').trim()
    if (!password) return NextResponse.json({ error: 'Password is required' }, { status: 400 })

    const me = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, hashedPassword: true, isDeactivated: true },
    })
    if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (me.isDeactivated) {
      return NextResponse.json({ ok: true, message: 'Account already deactivated.' })
    }
    if (!me.hashedPassword) return NextResponse.json({ error: 'Password login is not enabled for this account.' }, { status: 400 })

    const ok = await comparePasswords(password, me.hashedPassword)
    if (!ok) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })

    // Soft deactivate: keep data for audit/refunds, but block logins.
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        isDeactivated: true,
        deactivatedAt: new Date(),
        lockedUntil: new Date('2999-01-01'),
        failedLoginAttempts: 999,
      },
    })

    // Invalidate sessions
    await prisma.refreshToken.deleteMany({ where: { userId: payload.userId } })

    return NextResponse.json({
      ok: true,
      message: 'Account deactivated successfully.',
    })
  } catch (error) {
    console.error('Deactivate account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }))

