import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST - Forward a message to another user
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
    const { messageId, receiverId } = body

    if (!messageId || !receiverId) {
      return new NextResponse('Message ID and receiver ID are required', { status: 400 })
    }

    // Check if message exists and user has access to it
    const originalMessage = await prisma.directMessage.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: decoded.userId },
          { receiverId: decoded.userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        }
      }
    })

    if (!originalMessage) {
      return new NextResponse('Message not found or access denied', { status: 404 })
    }

    // Check if message is not deleted
    if (originalMessage.isDeleted) {
      return new NextResponse('Cannot forward deleted message', { status: 400 })
    }

    // Check if user follows the receiver (for messaging permission)
    const followRelationship = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: receiverId
        }
      }
    })

    if (!followRelationship) {
      return new NextResponse(
        'You need to follow this user before you can forward messages to them',
        { status: 403 }
      )
    }

    // Create forwarded message
    const forwardedMessage = await prisma.directMessage.create({
      data: {
        content: originalMessage.content,
        messageType: originalMessage.messageType,
        fileUrl: originalMessage.fileUrl,
        fileName: originalMessage.fileName,
        fileSize: originalMessage.fileSize,
        fileType: originalMessage.fileType,
        isForwarded: true,
        originalSenderId: originalMessage.senderId,
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
        },
        originalSender: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: forwardedMessage,
      originalMessage: originalMessage
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MESSAGE_FORWARD_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
