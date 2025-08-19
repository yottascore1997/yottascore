import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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

    if (decoded.userId === targetUserId) {
      return new NextResponse('Cannot follow yourself', { status: 400 })
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // ALWAYS create follow request - no direct follows
    const existingRequest = await prisma.followRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: decoded.userId,
          receiverId: targetUserId
        }
      }
    })

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return new NextResponse('Follow request already sent', { status: 400 })
      } else if (existingRequest.status === 'DECLINED') {
        // If previously declined, allow sending again
        await prisma.followRequest.update({
          where: { id: existingRequest.id },
          data: { 
            status: 'PENDING',
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ type: 'request', data: existingRequest })
      }
    }

    const followRequest = await prisma.followRequest.create({
      data: {
        senderId: decoded.userId,
        receiverId: targetUserId
      }
    })

    return NextResponse.json({ type: 'request', data: followRequest })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[FOLLOW_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return new NextResponse('Target user ID is required', { status: 400 })
    }

    // Delete follow relationship
    await prisma.follow.deleteMany({
      where: {
        followerId: decoded.userId,
        followingId: targetUserId
      }
    })

    // Delete follow request if exists
    await prisma.followRequest.deleteMany({
      where: {
        senderId: decoded.userId,
        receiverId: targetUserId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[FOLLOW_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 