import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// DELETE - Delete a message
export async function DELETE(req: NextRequest) {
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
    const { messageId, deleteType } = body

    if (!messageId || !deleteType || !['for_me', 'for_everyone'].includes(deleteType)) {
      return new NextResponse('Message ID and valid delete type are required', { status: 400 })
    }

    // Check if message exists and user has access to it
    const message = await prisma.directMessage.findFirst({
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
            name: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!message) {
      return new NextResponse('Message not found or access denied', { status: 404 })
    }

    // Check if message is already deleted
    if (message.isDeleted) {
      return new NextResponse('Message is already deleted', { status: 400 })
    }

    const isOwnMessage = message.senderId === decoded.userId

    if (deleteType === 'for_everyone') {
      // Only sender can delete for everyone
      if (!isOwnMessage) {
        return new NextResponse('Only the sender can delete message for everyone', { status: 403 })
      }

      // Delete for everyone - mark as deleted
      await prisma.directMessage.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          content: 'This message was deleted',
          fileUrl: null,
          fileName: null,
          fileSize: null,
          fileType: null
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Message deleted for everyone',
        deleteType: 'for_everyone'
      })

    } else if (deleteType === 'for_me') {
      // Create a user-specific delete record
      await prisma.userMessageDelete.create({
        data: {
          userId: decoded.userId,
          messageId: messageId,
          deletedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Message deleted for you',
        deleteType: 'for_me'
      })
    }

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MESSAGE_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
