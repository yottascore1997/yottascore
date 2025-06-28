import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST - Like a story
export async function POST(
  req: Request,
  { params }: { params: { storyId: string } }
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

    const { storyId } = params

    // Check if story exists and hasn't expired
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        expiresAt: { gt: new Date() }
      }
    })

    if (!story) {
      return new NextResponse('Story not found or expired', { status: 404 })
    }

    // Check if user follows the story author
    const followRelationship = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: decoded.userId,
          followingId: story.authorId
        }
      }
    })

    if (!followRelationship) {
      return new NextResponse('You can only like stories from users you follow', { status: 403 })
    }

    // Create story like (upsert to avoid duplicates)
    const storyLike = await prisma.storyLike.upsert({
      where: {
        storyId_userId: {
          storyId,
          userId: decoded.userId
        }
      },
      update: {
        createdAt: new Date()
      },
      create: {
        storyId,
        userId: decoded.userId
      }
    })

    return NextResponse.json({ success: true, storyLike })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[STORY_LIKE_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// DELETE - Unlike a story
export async function DELETE(
  req: Request,
  { params }: { params: { storyId: string } }
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

    const { storyId } = params

    // Delete story like
    await prisma.storyLike.deleteMany({
      where: {
        storyId,
        userId: decoded.userId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[STORY_LIKE_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 