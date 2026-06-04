import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import {
  buildConversationsFromMessages,
  loadConversationPartnersInitial,
  mergeStudyPartnerMatches,
  sortConversations,
} from '@/lib/messages-conversations'

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

    const { searchParams } = new URL(req.url)
    const lastUpdate = searchParams.get('lastUpdate')

    let conversationPartners: Map<
      string,
      {
        latestMessage: {
          id: string
          content: string
          messageType: string
          fileUrl: string | null
          isRead: boolean
          createdAt: Date
          senderId: string
          receiverId: string
        } | null
        unreadCount: number
      }
    >

    if (lastUpdate) {
      const whereClause: {
        OR: Array<{ senderId: string } | { receiverId: string }>
        createdAt?: { gt: Date }
      } = {
        OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
        createdAt: { gt: new Date(lastUpdate) },
      }

      const messages = await prisma.directMessage.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          content: true,
          messageType: true,
          fileUrl: true,
          isRead: true,
          createdAt: true,
          senderId: true,
          receiverId: true,
        },
      })

      conversationPartners = buildConversationsFromMessages(messages, currentUserId)
    } else {
      conversationPartners = await loadConversationPartnersInitial(currentUserId)
    }

    await mergeStudyPartnerMatches(conversationPartners, currentUserId)

    const partnerIds = Array.from(conversationPartners.keys())
    if (partnerIds.length === 0) {
      return NextResponse.json([])
    }

    const partners = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: {
        id: true,
        name: true,
        profilePhoto: true,
      },
    })

    const conversations = sortConversations(partners, conversationPartners)

    const response = NextResponse.json(conversations)
    response.headers.set('Cache-Control', 'private, max-age=30')
    response.headers.set('X-Last-Update', new Date().toISOString())

    return response
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
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

    const iFollowThem = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: receiverId,
        },
      },
    })

    const [u1, u2] = [decoded.userId, receiverId].sort()
    const studyPartnerMatch = await prisma.studyPartnerMatch.findFirst({
      where: {
        user1Id: u1,
        user2Id: u2,
        unmatchedAt: null,
      },
    })

    const canMessage = !!iFollowThem || !!studyPartnerMatch

    if (!canMessage) {
      const pendingRequest = await prisma.followRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: decoded.userId,
            receiverId: receiverId,
          },
        },
      })

      if (pendingRequest && pendingRequest.status === 'PENDING') {
        return new NextResponse(
          'Your follow request is still pending. You can only message this user after they accept your follow request.',
          { status: 403 }
        )
      } else if (pendingRequest && pendingRequest.status === 'DECLINED') {
        return new NextResponse(
          'Your follow request was declined. You need to send a new follow request before you can message this user.',
          { status: 403 }
        )
      } else {
        return new NextResponse(
          'You need to follow this user or match with them as study partner before you can message them.',
          { status: 403 }
        )
      }
    }

const message = await prisma.directMessage.create({
      data: {
        content,
        messageType,
        fileUrl,
        senderId: decoded.userId,
        receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
          },
        },
      },
    })

return NextResponse.json({ type: 'direct', message })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
return new NextResponse('Internal Error', { status: 500 })
  }
}
