import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch all visible posts (instantly visible, no approval needed)
export async function GET(req: NextRequest) {
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

    const posts = await prisma.post.findMany({
      where: {
        status: 'APPROVED',
        isPrivate: false,
        authorId: { not: decoded.userId },
        author: {
          blockedBy: {
            none: {
              blockerId: decoded.userId,
            },
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            course: true,
            year: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            pollVotes: true,
            questionAnswers: true,
          },
        },
        pollVotes: {
          where: { userId: decoded.userId },
          select: { optionIndex: true },
        },
        questionAnswers: {
          where: { userId: decoded.userId },
          select: { answer: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const postIds = posts.map((post) => post.id)
    const userLikes =
      postIds.length > 0
        ? await prisma.like.findMany({
            where: {
              userId: decoded.userId,
              postId: { in: postIds },
            },
            select: { postId: true },
          })
        : []

    const likedPostIds = new Set(userLikes.map((like) => like.postId))
    const postsWithLikes = posts.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }))

    return NextResponse.json(postsWithLikes)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Create post (instantly visible, no approval needed)
export async function POST(req: NextRequest) {
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
// Debug log
    const {
      content,
      imageUrl,
      videoUrl,
      hashtags,
      taggedUsers,
      isPrivate,
      postType = 'TEXT',
      pollOptions,
      pollEndTime,
      allowMultipleVotes = false,
      questionType,
      questionOptions,
    } = body

    if (!content) {
      return new NextResponse('Content is required', { status: 400 })
    }

    // Validate poll data
    if (postType === 'POLL') {
      if (!pollOptions || !Array.isArray(pollOptions) || pollOptions.length < 2) {
        return new NextResponse('Poll must have at least 2 options', { status: 400 })
      }
      if (pollOptions.length > 10) {
        return new NextResponse('Poll can have maximum 10 options', { status: 400 })
      }
    }

    // Validate question data
    if (postType === 'QUESTION') {
      if (!questionType) {
        return new NextResponse('Question type is required', { status: 400 })
      }
      if (
        questionType === 'MCQ' &&
        (!questionOptions || !Array.isArray(questionOptions) || questionOptions.length < 2)
      ) {
        return new NextResponse('MCQ question must have at least 2 options', { status: 400 })
      }
    }

const post = await prisma.post.create({
      data: {
        content,
        imageUrl,
        videoUrl,
        hashtags: hashtags || [],
        taggedUsers: taggedUsers || [],
        isPrivate: isPrivate || false,
        postType,
        pollOptions: pollOptions || null,
        pollEndTime: pollEndTime ? new Date(pollEndTime) : null,
        allowMultipleVotes,
        questionType: questionType || null,
        questionOptions: questionOptions || null,
        status: 'APPROVED',
        authorId: decoded.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            course: true,
            year: true,
          },
        },
      },
    })

return NextResponse.json({
      success: true,
      message: 'Post created successfully and is now visible!',
      post: {
        ...post,
        status: 'APPROVED',
      },
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
    })
  }
}
