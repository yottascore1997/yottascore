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

    // Allow viewing messages ONLY for Study Partner matches (follow is not required).
    console.log('🔍 Checking study partner match between:', decoded.userId, 'and', userId);

    const [u1, u2] = [decoded.userId, userId].sort();
    const studyPartnerMatch = await prisma.studyPartnerMatch.findFirst({
      where: {
        user1Id: u1,
        user2Id: u2,
        unmatchedAt: null,
      },
    });

    console.log('Study partner match found:', { studyPartnerMatch });

    // If not matched, still allow if there's existing message history (for legacy conversations).
    if (!studyPartnerMatch) {
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

      // If no existing messages, block access (must match first)
      if (!existingMessages) {
        return NextResponse.json(
          { message: 'You can only view messages with users you are matched with as a Study Partner.' },
          { status: 403 }
        );
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
      where: {
        ...whereClause,
        // Exclude messages deleted by current user
        userDeletions: {
          none: {
            userId: decoded.userId
          }
        }
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