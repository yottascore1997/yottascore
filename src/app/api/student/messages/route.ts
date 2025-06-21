import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch conversations (list of users you've messaged with)
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    const currentUserId = decoded.userId

    // 1. Find all messages involving the current user
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 2. Group messages by the other participant to build the conversation list
    const conversationPartners = new Map<string, { latestMessage: any; unreadCount: number }>()

    for (const message of messages) {
      const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId
      
      // If we haven't seen this person yet, add them with their latest message
      if (!conversationPartners.has(otherUserId)) {
        conversationPartners.set(otherUserId, {
          latestMessage: message,
          unreadCount: 0,
        })
      }

      // If this is an unread message for the current user, increment the count
      if (message.receiverId === currentUserId && !message.isRead) {
        const conversation = conversationPartners.get(otherUserId)!
        conversation.unreadCount += 1
      }
    }

    // 3. Get user details for each conversation partner
    const partnerIds = Array.from(conversationPartners.keys())
    if (partnerIds.length === 0) {
      return NextResponse.json([])
    }

    const partners = await prisma.user.findMany({
      where: {
        id: { in: partnerIds },
      },
      select: {
        id: true,
        name: true,
        profilePhoto: true,
      },
    })

    // 4. Combine partner details with conversation data
    const conversations = partners.map(partner => {
      const convoData = conversationPartners.get(partner.id)!
      return {
        user: partner,
        latestMessage: convoData.latestMessage,
        unreadCount: convoData.unreadCount,
      }
    }).sort((a, b) => new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime())

    return NextResponse.json(conversations)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MESSAGES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Send a message
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
    const { receiverId, content, messageType = 'TEXT', fileUrl } = body

    if (!receiverId || !content) {
      return new NextResponse('Receiver ID and content are required', { status: 400 })
    }

    // Check if users follow each other (mutual followers)
    const iFollowThem = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: receiverId,
        },
      },
    });

    const theyFollowMe = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: receiverId,
          followingId: decoded.userId,
        },
      },
    });

    if (!iFollowThem || !theyFollowMe) {
      return new NextResponse(
        'You can only message users who follow you back',
        { status: 403 }
      );
    }

    const message = await prisma.directMessage.create({
      data: {
        content,
        messageType,
        fileUrl,
        senderId: decoded.userId,
        receiverId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        }
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MESSAGES_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 