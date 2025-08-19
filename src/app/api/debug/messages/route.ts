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

    // Get all messages for the current user
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: decoded.userId },
          { receiverId: decoded.userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // Get all message requests for the current user
    const messageRequests = await prisma.messageRequest.findMany({
      where: {
        OR: [
          { senderId: decoded.userId },
          { receiverId: decoded.userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    // Get follow relationships
    const following = await prisma.follow.findMany({
      where: {
        followerId: decoded.userId
      },
      include: {
        following: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const followers = await prisma.follow.findMany({
      where: {
        followingId: decoded.userId
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      userId: decoded.userId,
      directMessages: messages,
      messageRequests: messageRequests,
      following: following.map(f => ({ id: f.following.id, name: f.following.name })),
      followers: followers.map(f => ({ id: f.follower.id, name: f.follower.name })),
      totalMessages: messages.length,
      totalRequests: messageRequests.length,
      totalFollowing: following.length,
      totalFollowers: followers.length
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[DEBUG_MESSAGES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
