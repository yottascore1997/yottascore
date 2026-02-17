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

    if (!user) {
      return NextResponse.json({ message: 'If that email exists, we sent a verification link.' })
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email is already verified. You can sign in.' })
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[RESEND_VERIFICATION] RESEND_API_KEY not set')
      return NextResponse.json(
        { message: 'Email service not configured. Please try again later.' },
        { status: 500 }
      )
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const verifyUrl = `${appUrl.replace(/\/$/, '')}/auth/verify-email?token=${token}`

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: user.email!,
      subject: 'Verify your Yottascore email',
      html: `
        <p>Welcome to Yottascore!</p>
        <p>Please verify your email by clicking the link below:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
        <p>— Yottascore</p>
      `,
    })

    if (error) {
      console.error('[RESEND_VERIFICATION] Resend error:', error)
      return NextResponse.json(
        { message: 'Failed to send email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'If that email exists, we sent a verification link.' })
  } catch (err) {
    console.error('[RESEND_VERIFICATION] Error:', err)
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export const POST = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }))
