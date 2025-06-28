import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST - Mark a story as viewed
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
    const { storyId } = body

    if (!storyId) {
      return new NextResponse('Story ID is required', { status: 400 })
    }

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
      return new NextResponse('You can only view stories from users you follow', { status: 403 })
    }

    // Mark story as viewed (upsert to avoid duplicates)
    const storyView = await prisma.storyView.upsert({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId: decoded.userId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        storyId,
        viewerId: decoded.userId
      }
    })

    return NextResponse.json({ success: true, storyView })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[STORY_VIEW_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 