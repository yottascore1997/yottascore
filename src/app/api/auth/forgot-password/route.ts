import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'
import { withCORS } from '@/lib/cors'

const resend = new Resend(process.env.RESEND_API_KEY)

const handler = async (req: Request) => {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    const emailTrimmed = email.trim().toLowerCase()

    const user = await prisma.user.findFirst({
      where: { email: emailTrimmed },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If that email exists, we sent a reset link.' })
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[FORGOT_PASSWORD] RESEND_API_KEY not set')
      return NextResponse.json(
        { message: 'Email service not configured. Please try again later.' },
        { status: 500 }
      )
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const resetUrl = `${appUrl.replace(/\/$/, '')}/auth/reset-password?token=${token}`

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: user.email!,
      subject: 'Reset your Yottascore password',
      html: `
        <p>You requested a password reset for Yottascore.</p>
        <p>Click the link below to reset your password (expires in 1 hour):</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
        <p>— Yottascore</p>
      `,
    })

    if (error) {
      console.error('[FORGOT_PASSWORD] Resend error:', error)
      return NextResponse.json(
        { message: 'Failed to send email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'If that email exists, we sent a reset link.' })
  } catch (err: unknown) {
    console.error('[FORGOT_PASSWORD] Error:', err)
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export const POST = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }))
