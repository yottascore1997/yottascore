import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST - Block a user
export async function POST(
  req: NextRequest,
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

    const { userId: blockedUserId } = params
    const body = await req.json()
    const { reason } = body

    // Check if user is trying to block themselves
    if (decoded.userId === blockedUserId) {
      return new NextResponse('Cannot block yourself', { status: 400 })
    }

    // Check if user exists
    const userToBlock = await prisma.user.findUnique({
      where: { id: blockedUserId },
      select: { id: true, name: true }
    })

    if (!userToBlock) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Check if already blocked
    const existingBlock = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: decoded.userId,
          blockedId: blockedUserId
        }
      }
    })

    if (existingBlock) {
      return new NextResponse('User is already blocked', { status: 400 })
    }

    // Create block record
    const block = await prisma.userBlock.create({
      data: {
        blockerId: decoded.userId,
        blockedId: blockedUserId,
        reason: reason || null
      }
    })

    // Remove follow relationships if they exist
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: decoded.userId, followingId: blockedUserId },
          { followerId: blockedUserId, followingId: decoded.userId }
        ]
      }
    })

    return NextResponse.json({
      success: true,
      message: `You have blocked ${userToBlock.name}`,
      block
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[USER_BLOCK]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// DELETE - Unblock a user
export async function DELETE(
  req: NextRequest,
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

    const { userId: blockedUserId } = params

    // Check if block exists
    const existingBlock = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: decoded.userId,
          blockedId: blockedUserId
        }
      },
      include: {
        blocked: {
          select: { id: true, name: true }
        }
      }
    })

    if (!existingBlock) {
      return new NextResponse('User is not blocked', { status: 404 })
    }

    // Remove block
    await prisma.userBlock.delete({
      where: { id: existingBlock.id }
    })

    return NextResponse.json({
      success: true,
      message: `You have unblocked ${existingBlock.blocked.name}`
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[USER_UNBLOCK]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
