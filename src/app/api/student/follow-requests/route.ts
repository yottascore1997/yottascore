import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch follow requests for the current user
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

    const followRequests = await prisma.followRequest.findMany({
      where: {
        receiverId: decoded.userId,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            course: true,
            year: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(followRequests)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[FOLLOW_REQUESTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Accept or reject a follow request
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
    const { requestId, action } = body

    if (!requestId || !action || !['accept', 'reject'].includes(action)) {
      return new NextResponse('Invalid request', { status: 400 })
    }

    const followRequest = await prisma.followRequest.findFirst({
      where: {
        id: requestId,
        receiverId: decoded.userId,
        status: 'PENDING'
      }
    })

    if (!followRequest) {
      return new NextResponse('Follow request not found', { status: 404 })
    }

    if (action === 'accept') {
      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId: followRequest.senderId,
          followingId: followRequest.receiverId
        }
      })

      // Update request status
      await prisma.followRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      })
    } else {
      // Update request status to declined
      await prisma.followRequest.update({
        where: { id: requestId },
        data: { status: 'DECLINED' }
      })
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[FOLLOW_REQUESTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 