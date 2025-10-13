import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch user's posts for profile page
export async function GET(
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

    const { userId } = params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch user's posts (both public and private for own profile)
    const isOwnProfile = decoded.userId === userId
    
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        status: 'APPROVED', // Only approved posts
        // Show private posts only if it's user's own profile
        ...(isOwnProfile ? {} : { isPrivate: false })
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
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            pollVotes: true,
            questionAnswers: true
          }
        },
        pollVotes: {
          where: { userId: decoded.userId },
          select: { optionIndex: true }
        },
        questionAnswers: {
          where: { userId: decoded.userId },
          select: { answer: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Check if user has liked each post
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        const userLike = await prisma.postLike.findUnique({
          where: {
            userId_postId: {
              userId: decoded.userId,
              postId: post.id
            }
          }
        })

        return {
          ...post,
          isLiked: !!userLike
        }
      })
    )

    return NextResponse.json(postsWithLikes)

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[USER_POSTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
