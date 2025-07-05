import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch messages with a specific user
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const since = searchParams.get('since') // New parameter for efficient polling

    // Check if users follow each other
    const iFollowThem = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: userId,
        },
      },
    });

    const theyFollowMe = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: decoded.userId,
        },
      },
    });

    if (!iFollowThem || !theyFollowMe) {
      return new NextResponse(
        'You can only view messages with users who follow you back',
        { status: 403 }
      );
    }

    // Build where clause with optional since parameter
    const whereClause: any = {
      OR: [
        { senderId: decoded.userId, receiverId: userId },
        { senderId: userId, receiverId: decoded.userId }
      ]
    };

    // If since parameter is provided, only fetch messages after that timestamp
    if (since) {
      whereClause.createdAt = {
        gt: new Date(since)
      };
    }

    // Get messages between the two users
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Only mark messages as read if we're not using the since parameter (full load)
    if (!since) {
      await prisma.directMessage.updateMany({
        where: {
          senderId: userId,
          receiverId: decoded.userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    }

    return NextResponse.json(messages.reverse()) // Return in chronological order
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MESSAGES_USER_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 