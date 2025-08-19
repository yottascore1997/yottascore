import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }

    const { searchParams } = new URL(req.url)
    const otherUserId = searchParams.get('otherUserId')

    if (!otherUserId) {
      return NextResponse.json({ error: 'otherUserId is required' }, { status: 400 })
    }

    // Check follow relationship
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: otherUserId,
        },
      },
    })

    // Check follow request
    const followRequest = await prisma.followRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: decoded.userId,
          receiverId: otherUserId,
        },
      },
    })

    // Check if they follow you
    const theyFollowYou = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: otherUserId,
          followingId: decoded.userId,
        },
      },
    })

    // Check messages
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: decoded.userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: decoded.userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return NextResponse.json({
      currentUserId: decoded.userId,
      otherUserId,
      follow,
      followRequest,
      theyFollowYou,
      messageCount: messages.length,
      recentMessages: messages.map(m => ({
        id: m.id,
        content: m.content.substring(0, 50),
        senderId: m.senderId,
        receiverId: m.receiverId,
        createdAt: m.createdAt
      }))
    })

  } catch (error) {
    console.error('[DEBUG_FOLLOW_STATUS]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
