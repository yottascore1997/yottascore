import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const hashtag = searchParams.get('hashtag')
    const userId = searchParams.get('userId')

    const where: any = {
      isPrivate: false
    }

    if (hashtag) {
      where.hashtags = {
        array_contains: [hashtag]
      }
    }

    if (userId) {
      where.authorId = userId
    }

    const posts = await prisma.post.findMany({
      where,
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
        likes: {
          where: {
            userId: decoded.userId
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePhoto: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // For each post, check if the current user has liked it
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post) => {
        const like = await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: decoded.userId,
              postId: post.id,
            },
          },
        });
        return {
          ...post,
          isLiked: !!like,
        };
      })
    );

    return NextResponse.json(postsWithLikeStatus)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[POSTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

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
    const { content, imageUrl, videoUrl, hashtags, taggedUsers, isPrivate } = body

    if (!content) {
      return new NextResponse('Content is required', { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl,
        videoUrl,
        hashtags: hashtags || [],
        taggedUsers: taggedUsers || [],
        isPrivate: isPrivate || false,
        authorId: decoded.userId
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

    return NextResponse.json(post)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[POSTS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 