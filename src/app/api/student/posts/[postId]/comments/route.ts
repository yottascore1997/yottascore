import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getSocketServer } from '@/lib/socket'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(
  req: Request,
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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const comments = await prisma.comment.findMany({
      where: {
        postId: params.postId,
        parentId: null // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        _count: {
          select: {
            // Count replies
            _all: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json(comments)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[COMMENTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(
  req: Request,
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

    const body = await req.json()
    const { content, parentId } = body

    if (!content) {
      return new NextResponse('Content is required', { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: decoded.userId,
        postId: params.postId,
        parentId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        }
      }
    })

    // Emit socket event for real-time notification
    try {
      const io = getSocketServer()
      if (io) {
        // Get post details to find the author
        const post = await prisma.post.findUnique({
          where: { id: params.postId },
          include: { author: true }
        })

        // Get commenter details
        const commenter = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { name: true }
        })

        if (post && commenter && post.authorId !== decoded.userId) {
          io.emit('post_commented', {
            postId: params.postId,
            postAuthorId: post.authorId,
            commenterId: decoded.userId,
            commenterName: commenter.name,
            commentContent: content
          })
        }
      }
    } catch (socketError) {
      console.error('Socket notification error:', socketError)
      // Don't fail the request if socket notification fails
    }

    return NextResponse.json(comment)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[COMMENTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 