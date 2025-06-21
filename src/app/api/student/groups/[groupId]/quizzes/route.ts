import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch group quizzes
export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
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

    const { groupId } = params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: decoded.userId,
          groupId: groupId
        }
      }
    })

    if (!membership) {
      return new NextResponse('Not a member of this group', { status: 403 })
    }

    const quizzes = await prisma.groupQuiz.findMany({
      where: {
        groupId: groupId,
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        attempts: {
          where: {
            userId: decoded.userId
          }
        },
        _count: {
          select: {
            attempts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[GROUP_QUIZZES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

// POST - Create a group quiz
export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
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

    const { groupId } = params
    const body = await req.json()
    const { title, description, questions, timeLimit } = body

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return new NextResponse('Title and questions are required', { status: 400 })
    }

    // Validate questions structure
    for (const question of questions) {
      if (!question.text || !question.options || !Array.isArray(question.options) || question.options.length < 2) {
        return new NextResponse('Each question must have text and at least 2 options', { status: 400 })
      }
      if (typeof question.correct !== 'number' || question.correct < 0 || question.correct >= question.options.length) {
        return new NextResponse('Each question must have a valid correct answer index', { status: 400 })
      }
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: decoded.userId,
          groupId: groupId
        }
      }
    })

    if (!membership) {
      return new NextResponse('Not a member of this group', { status: 403 })
    }

    // Create the group quiz
    const quiz = await prisma.groupQuiz.create({
      data: {
        title,
        description,
        questions,
        timeLimit: timeLimit || null,
        groupId: groupId,
        creatorId: decoded.userId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        _count: {
          select: {
            attempts: true
          }
        }
      }
    })

    return NextResponse.json(quiz)
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[GROUP_QUIZZES_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 