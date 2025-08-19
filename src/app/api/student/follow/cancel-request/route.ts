import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST - Cancel a follow request
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }

    if (decoded.role !== 'STUDENT') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const { targetUserId } = body

    if (!targetUserId) {
      return new NextResponse('Target user ID is required', { status: 400 })
    }

    // Delete the follow request
    const deletedRequest = await prisma.followRequest.deleteMany({
      where: {
        senderId: decoded.userId,
        receiverId: targetUserId,
        status: 'PENDING'
      }
    })

    if (deletedRequest.count === 0) {
      return new NextResponse('No pending follow request found', { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Follow request cancelled' })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[CANCEL_FOLLOW_REQUEST_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
