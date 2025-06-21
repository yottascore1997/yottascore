import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getSocketServer } from '@/lib/socket'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: decoded.userId,
          postId: params.postId
        }
      }
    })

    if (existingLike) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: decoded.userId,
            postId: params.postId
          }
        }
      })
      return NextResponse.json({ liked: false })
    } else {
      await prisma.like.create({
        data: {
          userId: decoded.userId,
          postId: params.postId
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

          // Get liker details
          const liker = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { name: true }
          })

          if (post && liker && post.authorId !== decoded.userId) {
            io.emit('post_liked', {
              postId: params.postId,
              postAuthorId: post.authorId,
              likerId: decoded.userId,
              likerName: liker.name
            })
          }
        }
      } catch (socketError) {
        console.error('Socket notification error:', socketError)
        // Don't fail the request if socket notification fails
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[POST_LIKE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 