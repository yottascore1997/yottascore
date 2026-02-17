import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withCORS } from '@/lib/cors'

const handler = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Verification token is required' },
        { status: 400 }
      )
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!record) {
      return NextResponse.json(
        { message: 'Invalid or expired verification link. Please register again or request a new link.' },
        { status: 400 }
      )
    }

    if (record.usedAt) {
      return NextResponse.json(
        { message: 'Email already verified. You can sign in.' },
        { status: 200 }
      )
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'Verification link expired. Please request a new one.' },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ message: 'Email verified successfully. You can now sign in.' })
  } catch (error) {
    console.error('[VERIFY_EMAIL] Error:', error)
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export const GET = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }))
