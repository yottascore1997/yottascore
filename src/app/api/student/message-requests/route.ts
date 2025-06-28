import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch pending message requests
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

    const messageRequests = await prisma.messageRequest.findMany({
      where: {
        receiverId: decoded.userId,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(messageRequests)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MESSAGE_REQUESTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Accept or reject a message request
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
    const { requestId, action } = body // action: 'accept' or 'reject'

    if (!requestId || !action) {
      return new NextResponse('Request ID and action are required', { status: 400 })
    }

    // Find the message request
    const messageRequest = await prisma.messageRequest.findUnique({
      where: {
        id: requestId,
        receiverId: decoded.userId,
        status: 'PENDING'
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

    if (!messageRequest) {
      return new NextResponse('Message request not found', { status: 404 })
    }

    if (action === 'accept') {
      // Update the message request status
      await prisma.messageRequest.update({
        where: { id: requestId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date()
        }
      })

      // Convert the message request to a direct message
      const directMessage = await prisma.directMessage.create({
        data: {
          content: messageRequest.content,
          messageType: messageRequest.messageType,
          fileUrl: messageRequest.fileUrl,
          senderId: messageRequest.senderId,
          receiverId: messageRequest.receiverId
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
        }
      })

      return NextResponse.json({ 
        success: true, 
        action: 'accepted',
        message: directMessage 
      })
    } else if (action === 'reject') {
      // Update the message request status
      await prisma.messageRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          respondedAt: new Date()
        }
      })

      return NextResponse.json({ 
        success: true, 
        action: 'rejected' 
      })
    } else {
      return new NextResponse('Invalid action. Use "accept" or "reject"', { status: 400 })
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MESSAGE_REQUESTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 