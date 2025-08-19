import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Search messages
export async function GET(req: Request) {
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
    const query = searchParams.get('q')
    const messageType = searchParams.get('type')
    const hasReactions = searchParams.get('hasReactions')
    const isPinned = searchParams.get('isPinned')
    const isForwarded = searchParams.get('isForwarded')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.trim() === '') {
      return NextResponse.json({
        messages: [],
        totalCount: 0,
        hasMore: false
      })
    }

    // Build where clause
    const whereClause: any = {
      OR: [
        { senderId: decoded.userId },
        { receiverId: decoded.userId }
      ],
      isDeleted: false,
      OR: [
        { content: { contains: query.trim() } },
        { fileName: { contains: query.trim() } }
      ]
    }

    // Add filters
    if (messageType) {
      whereClause.messageType = messageType
    }

    if (hasReactions === 'true') {
      whereClause.reactions = { some: {} }
    }

    if (isPinned === 'true') {
      whereClause.isPinned = true
    }

    if (isForwarded === 'true') {
      whereClause.isForwarded = true
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {}
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo)
      }
    }

    // Get total count
    const totalCount = await prisma.directMessage.count({ where: whereClause })

    // Get messages
    const messages = await prisma.directMessage.findMany({
      where: whereClause,
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
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePhoto: true
              }
            }
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const hasMore = totalCount > page * limit

    return NextResponse.json({
      messages,
      totalCount,
      hasMore,
      page,
      limit
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MESSAGE_SEARCH_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
