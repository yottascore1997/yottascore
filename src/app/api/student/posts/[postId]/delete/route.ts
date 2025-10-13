import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// DELETE - Delete a post
export async function DELETE(
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

    // Check if post exists and user is the author
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        authorId: decoded.userId
      },
      select: {
        id: true,
        authorId: true,
        imageUrl: true,
        videoUrl: true
      }
    })

    if (!post) {
      return new NextResponse('Post not found or you are not authorized to delete this post', { status: 404 })
    }

    // Delete the post (this will cascade delete related records like likes, comments, etc.)
    await prisma.post.delete({
      where: { id: postId }
    })

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[POST_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
