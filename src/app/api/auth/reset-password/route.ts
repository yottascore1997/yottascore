import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { withCORS } from '@/lib/cors'

const handler = async (req: Request) => {
  try {
    const body = await req.json()
    const { email, newPassword } = body

    if (!email || !newPassword) {
      return NextResponse.json(
        { message: 'Email and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    })

    console.log('[PASSWORD_RESET] Password updated successfully:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      newHashLength: hashedPassword.length
    })

    return NextResponse.json({
      message: 'Password reset successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    })
  } catch (error: any) {
    console.error('[PASSWORD_RESET] Error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

export const POST = withCORS(handler)
export const OPTIONS = withCORS(() => new Response(null, { status: 204 }))

