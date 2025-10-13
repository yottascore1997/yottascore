import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST - Report a post
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
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

    const { postId } = params
    const body = await req.json()
    const { reason, description } = body

    if (!reason) {
      return new NextResponse('Report reason is required', { status: 400 })
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true }
    })

    if (!post) {
      return new NextResponse('Post not found', { status: 404 })
    }

    // Check if user is trying to report their own post
    if (post.authorId === decoded.userId) {
      return new NextResponse('Cannot report your own post', { status: 400 })
    }

    // Check if user has already reported this post
    const existingReport = await prisma.postReport.findUnique({
      where: {
        userId_postId: {
          userId: decoded.userId,
          postId: postId
        }
      }
    })

    if (existingReport) {
      return new NextResponse('You have already reported this post', { status: 400 })
    }

    // Create report
    const report = await prisma.postReport.create({
      data: {
        userId: decoded.userId,
        postId: postId,
        reason,
        description: description || null,
        status: 'PENDING'
      }
    })

    // Update post status to FLAGGED for admin review
    await prisma.post.update({
      where: { id: postId },
      data: { status: 'FLAGGED' }
    })

    return NextResponse.json({
      success: true,
      message: 'Post reported successfully. It will be reviewed by admin.',
      report
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[POST_REPORT]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
