import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch pending posts for review
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }

    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Fetch pending posts for review
    const pendingPosts = await prisma.post.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            course: true,
            year: true
          }
        }
      },
      orderBy: { createdAt: 'asc' } // Oldest first for fair review
    })

    return NextResponse.json(pendingPosts)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[ADMIN_POSTS_REVIEW_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Review a post (approve/reject)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }

    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await req.json()
    const { postId, action, rejectionReason } = body

    if (!postId || !action) {
      return new NextResponse('Post ID and action are required', { status: 400 })
    }

    if (action === 'reject' && !rejectionReason) {
      return new NextResponse('Rejection reason is required', { status: 400 })
    }

    // Update post status
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        rejectionReason: action === 'reject' ? rejectionReason : null,
        reviewedBy: decoded.userId,
        reviewedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            course: true,
            year: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Post ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      post: updatedPost
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[ADMIN_POSTS_REVIEW_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
