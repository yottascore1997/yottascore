import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch stories from users you follow
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

    // Get current time for filtering expired stories
    const now = new Date()

    // Find users that the current user follows
    const following = await prisma.follow.findMany({
      where: {
        followerId: decoded.userId
      },
      select: {
        followingId: true
      }
    })

    const followingIds = following.map(f => f.followingId)

    // Get stories from followed users that haven't expired
    const stories = await prisma.story.findMany({
      where: {
        authorId: { in: followingIds },
        expiresAt: { gt: now }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        views: {
          where: {
            viewerId: decoded.userId
          },
          select: {
            id: true
          }
        },
        likes: {
          where: {
            userId: decoded.userId
          },
          select: {
            id: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Group stories by author
    const storiesByUser = stories.reduce((acc, story) => {
      const authorId = story.author.id
      if (!acc[authorId]) {
        acc[authorId] = {
          user: story.author,
          stories: []
        }
      }
      acc[authorId].stories.push({
        ...story,
        isViewed: story.views.length > 0,
        isLiked: story.likes.length > 0,
        likeCount: story._count.likes
      })
      return acc
    }, {} as Record<string, any>)

    // Sort stories within each user group by creation time (oldest first)
    const sortedStoriesByUser = Object.values(storiesByUser).map((userGroup: any) => ({
      ...userGroup,
      stories: userGroup.stories.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }))

    return NextResponse.json(sortedStoriesByUser)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[STORIES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Create a new story
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
    const { mediaUrl, mediaType = 'IMAGE', caption } = body

    if (!mediaUrl) {
      return new NextResponse('Media URL is required', { status: 400 })
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const story = await prisma.story.create({
      data: {
        mediaUrl,
        mediaType,
        caption,
        expiresAt,
        authorId: decoded.userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        }
      }
    })

    return NextResponse.json(story)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[STORIES_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 