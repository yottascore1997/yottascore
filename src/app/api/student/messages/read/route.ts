import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// This endpoint marks messages in a chat as read
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const currentUserId = decoded.userId;

    const { otherUserId } = await req.json();

    if (!otherUserId) {
      return new NextResponse('Other user ID is required', { status: 400 });
    }

    // Update messages sent by the other user to the current user
    await prisma.directMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return new NextResponse('Messages marked as read', { status: 200 });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 });
    }
    console.error('[MESSAGES_READ_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 