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

    // Temporarily remove role check for debugging
    // if (decoded.role !== 'STUDENT') {
    //   return new NextResponse('Forbidden', { status: 403 })
    // }

    const { userId } = params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const since = searchParams.get('since') // New parameter for efficient polling

    // Check if either user follows the other (allows viewing messages if there's any follow relationship)
    console.log('🔍 Checking follow relationship between:', decoded.userId, 'and', userId);
    
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

    console.log('Follow relationships found:', { iFollowThem, theyFollowMe });

    // Allow viewing messages if either user follows the other OR if there's existing message history
    if (!iFollowThem && !theyFollowMe) {
      // Check if there are any existing messages between these users
      const existingMessages = await prisma.directMessage.findFirst({
        where: {
          OR: [
            { senderId: decoded.userId, receiverId: userId },
            { senderId: userId, receiverId: decoded.userId }
          ]
        }
      });

      console.log('Existing messages found:', existingMessages);

      // If no existing messages, check for follow request
      if (!existingMessages) {
        const pendingRequest = await prisma.followRequest.findUnique({
          where: {
            senderId_receiverId: {
              senderId: decoded.userId,
              receiverId: userId,
            },
          },
        });

        console.log('Pending follow request:', pendingRequest);

        if (pendingRequest && pendingRequest.status === 'PENDING') {
          return new NextResponse(
            'Your follow request is still pending. You can only view messages after they accept your follow request.',
            { status: 403 }
          );
        } else if (pendingRequest && pendingRequest.status === 'DECLINED') {
          return new NextResponse(
            'Your follow request was declined. You need to send a new follow request before you can view messages.',
            { status: 403 }
          );
        } else {
          return new NextResponse(
            'You can only view messages with users you follow or who follow you. Please send a follow request first.',
            { status: 403 }
          );
        }
      }
      // If there are existing messages, allow viewing them regardless of follow status
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
    console.log('🔍 Fetching messages with where clause:', whereClause);
    
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

    console.log(`📨 Found ${messages.length} messages between users`);
    console.log('Messages:', messages.map(m => ({
      id: m.id,
      content: m.content.substring(0, 30) + '...',
      sender: m.sender.name,
      receiver: m.receiver.name,
      createdAt: m.createdAt
    })));

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