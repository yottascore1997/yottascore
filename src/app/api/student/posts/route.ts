import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch approved posts only
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

    // Fetch all approved public posts (no filtering by user or following)
    const posts = await prisma.post.findMany({
      where: {
        status: 'APPROVED', // Only approved posts
        isPrivate: false // Public posts only
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
      orderBy: { createdAt: 'desc' }
    })

    // Check if user has liked each post
    const postsWithLikes = await Promise.all(
      posts.map(async (post) => {
        const like = await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: decoded.userId,
              postId: post.id
            }
          }
        })

        return {
          ...post,
          isLiked: !!like
        }
      })
    )

    return NextResponse.json(postsWithLikes)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[POSTS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Create post with PENDING status
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
    console.log('Request body:', body) // Debug log
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
      questionOptions
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
      if (questionType === 'MCQ' && (!questionOptions || !Array.isArray(questionOptions) || questionOptions.length < 2)) {
        return new NextResponse('MCQ question must have at least 2 options', { status: 400 })
      }
    }

    console.log('Creating post with data:', {
      content,
      imageUrl,
      videoUrl,
      hashtags: hashtags || [],
      taggedUsers: taggedUsers || [],
      isPrivate: isPrivate || false,
      postType,
      pollOptions,
      pollEndTime,
      allowMultipleVotes,
      questionType,
      questionOptions,
      status: 'PENDING',
      authorId: decoded.userId
    }) // Debug log

    // Create post with PENDING status
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
        status: 'PENDING', // All new posts start as pending
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

    console.log('Post created successfully:', post.id) // Debug log

    // Return success message with review status
    return NextResponse.json({
      success: true,
      message: 'Post submitted for review. It will be visible once approved.',
      post: {
        ...post,
        status: 'PENDING'
      }
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[POSTS_POST] Detailed error:', error) // Enhanced error logging
    console.error('[POSTS_POST] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
} 