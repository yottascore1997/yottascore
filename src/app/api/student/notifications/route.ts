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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      userId: decoded.userId
    }

    if (unreadOnly) {
      whereClause.isRead = false
    }

    // Get notifications
    const notifications = await prisma.pushNotification.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sentByUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Get total count
    const totalCount = await prisma.pushNotification.count({
      where: whereClause
    })

    // Get unread count
    const unreadCount = await prisma.pushNotification.count({
      where: {
        userId: decoded.userId,
        isRead: false
      }
    })

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      unreadCount
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[STUDENT_NOTIFICATIONS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }

    const body = await req.json()
    const { notificationId, markAsRead } = body

    if (notificationId && markAsRead) {
      // Mark specific notification as read
      await prisma.pushNotification.update({
        where: {
          id: notificationId,
          userId: decoded.userId // Ensure user can only update their own notifications
        },
        data: {
          isRead: true
        }
      })
    } else if (markAsRead) {
      // Mark all notifications as read
      await prisma.pushNotification.updateMany({
        where: {
          userId: decoded.userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[STUDENT_NOTIFICATIONS_PATCH]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
