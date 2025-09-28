import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getSocketServer } from '@/lib/socket-server'

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

    // Get the last update time from query params for efficient polling
    const { searchParams } = new URL(req.url)
    const lastUpdate = searchParams.get('lastUpdate')

    // 1. Find all messages involving the current user (with optional time filter)
    const whereClause: any = {
      OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    };

    // If lastUpdate is provided, only fetch messages after that time
    if (lastUpdate) {
      whereClause.createdAt = {
        gt: new Date(lastUpdate)
      };
    }

    const messages = await prisma.directMessage.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      // Limit results for better performance
      take: lastUpdate ? 100 : 1000,
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

    // 3. Get user details for each conversation partner (batch query for efficiency)
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
    const conversations = partners.map((partner: any) => {
      const convoData = conversationPartners.get(partner.id)!
      return {
        user: partner,
        latestMessage: convoData.latestMessage,
        unreadCount: convoData.unreadCount,
      }
    }).sort((a: any, b: any) => new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime())

    // Add cache headers for better performance
    const response = NextResponse.json(conversations)
    response.headers.set('Cache-Control', 'private, max-age=30') // Cache for 30 seconds
    response.headers.set('X-Last-Update', new Date().toISOString())
    
    return response
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

    // Check if sender follows the receiver (actual follow, not just request)
    console.log(`🔍 Checking follow relationship: ${decoded.userId} -> ${receiverId}`);
    const iFollowThem = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: receiverId,
        },
      },
    });

    console.log(`📊 Follow relationship found:`, iFollowThem);

    if (!iFollowThem) {
      // Check if there's a pending follow request
      const pendingRequest = await prisma.followRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: decoded.userId,
            receiverId: receiverId,
          },
        },
      });

      if (pendingRequest && pendingRequest.status === 'PENDING') {
        return new NextResponse(
          'Your follow request is still pending. You can only message this user after they accept your follow request.',
          { status: 403 }
        );
      } else if (pendingRequest && pendingRequest.status === 'DECLINED') {
        return new NextResponse(
          'Your follow request was declined. You need to send a new follow request before you can message this user.',
          { status: 403 }
        );
      } else {
        return new NextResponse(
          'You need to follow this user before you can message them. Please send a follow request first.',
          { status: 403 }
        );
      }
    }

    // If you follow them, you can send direct message (regardless of whether they follow you back)
    console.log(`💾 Creating message: ${decoded.userId} -> ${receiverId}: "${content}"`);
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
    });

    // Note: Real-time notifications are now handled by the socket server
    // when the frontend emits 'private_message' event
    console.log(`✅ Direct message sent to database. Frontend should emit 'private_message' event.`);

    return NextResponse.json({ type: 'direct', message });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MESSAGES_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 