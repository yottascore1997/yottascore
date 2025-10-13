import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST - Delete a message (alternative to DELETE method)
export async function POST(req: NextRequest) {
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
    console.log('Received body:', body)
    console.log('Body type:', typeof body)
    console.log('Body keys:', Object.keys(body))
    
    const { messageId, deleteType } = body

    console.log('messageId:', messageId, 'type:', typeof messageId)
    console.log('deleteType:', deleteType, 'type:', typeof deleteType)

    if (!messageId || !deleteType) {
      console.log('Missing required fields:', { messageId, deleteType }) // Debug log
      return new NextResponse('Message ID and delete type are required', { status: 400 })
    }

    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, receiverId: true }
    })

    if (!message) {
      return new NextResponse('Message not found', { status: 404 })
    }

    // Ensure the user is either the sender or receiver of the message
    if (message.senderId !== decoded.userId && message.receiverId !== decoded.userId) {
      return new NextResponse('Forbidden: You are not a participant in this message', { status: 403 })
    }

    if (deleteType === 'for_me') {
      // Create a record in UserMessageDelete to mark it as deleted for this specific user
      await prisma.userMessageDelete.create({
        data: {
          userId: decoded.userId,
          messageId: messageId
        }
      })
      return NextResponse.json({ success: true, message: 'Message deleted for you.' })
    } else if (deleteType === 'for_everyone') {
      // Only the sender can delete for everyone
      if (message.senderId !== decoded.userId) {
        return new NextResponse('Forbidden: Only the sender can delete a message for everyone.', { status: 403 })
      }

      // Mark the message as deleted and clear its content
      await prisma.directMessage.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          content: 'This message was deleted.', // Replace content
          fileUrl: null, // Remove file attachments
          fileName: null,
          fileSize: null,
          fileType: null,
          messageType: 'TEXT' // Change type to text
        }
      })
      return NextResponse.json({ success: true, message: 'Message deleted for everyone.' })
    } else {
      return new NextResponse('Invalid delete type', { status: 400 })
    }

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MESSAGE_DELETE_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
