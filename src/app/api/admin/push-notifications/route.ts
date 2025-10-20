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

    // Check if user is admin
    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Forbidden: Admin access required', { status: 403 })
    }

    const body = await req.json()
    const { title, message, type, targetUsers, targetRole, targetCourse, targetYear } = body

    // Validate required fields
    if (!title || !message) {
      return new NextResponse('Title and message are required', { status: 400 })
    }

    // Build user filter based on target criteria
    let userFilter: any = {
      role: 'STUDENT' // Only send to students by default
    }

    if (targetRole) {
      userFilter.role = targetRole
    }

    if (targetCourse) {
      userFilter.course = targetCourse
    }

    if (targetYear) {
      userFilter.year = targetYear
    }

    if (targetUsers && targetUsers.length > 0) {
      userFilter.id = {
        in: targetUsers
      }
    }

    // Get target users
    const users = await prisma.user.findMany({
      where: userFilter,
      select: {
        id: true,
        name: true,
        email: true,
        course: true,
        year: true
      }
    })

    if (users.length === 0) {
      return new NextResponse('No users found matching the criteria', { status: 404 })
    }

    // Create notification records
    type UserType = typeof users[number];
    const notifications = await prisma.pushNotification.createMany({
      data: users.map((user: UserType) => ({
        userId: user.id,
        title,
        message,
        type: type || 'GENERAL',
        isRead: false,
        sentBy: decoded.userId
      }))
    })

    // Emit socket events for real-time notifications
    // This will be handled by the socket server
    const notificationData = {
      type: 'admin_notification',
      title,
      message,
      notificationType: type || 'GENERAL',
      targetUserIds: users.map((u: UserType) => u.id),
      sentBy: decoded.userId,
      timestamp: new Date().toISOString()
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
      notificationData,
      usersCount: users.length,
      targetUsers: users.map((u: UserType) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        course: u.course,
        year: u.year
      }))
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[PUSH_NOTIFICATION_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }

    // Check if user is admin
    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Forbidden: Admin access required', { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get all push notifications with user details
    const notifications = await prisma.pushNotification.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            course: true,
            year: true
          }
        },
        sentByUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Get total count
    const totalCount = await prisma.pushNotification.count()

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[PUSH_NOTIFICATION_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
