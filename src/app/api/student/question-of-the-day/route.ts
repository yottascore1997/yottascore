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

    // Get the active question
    const activeQuestion = await prisma.questionOfTheDay.findFirst({
      where: {
        isActive: true
      }
    })

    if (!activeQuestion) {
      return new NextResponse('No active question found', { status: 404 })
    }

    // Check if user has already attempted this question
    const attempt = await prisma.questionOfTheDayAttempt.findUnique({
      where: {
        questionId_userId: {
          questionId: activeQuestion.id,
          userId: decoded.userId
        }
      }
    })

    if (attempt) {
      return NextResponse.json({
        ...activeQuestion,
        hasAttempted: true,
        isCorrect: attempt.isCorrect,
        selectedOption: attempt.selected,
        correctAnswer: activeQuestion.correct
      })
    }

    return NextResponse.json({
      ...activeQuestion,
      hasAttempted: false
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[QUESTION_OF_THE_DAY_GET]', error)
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
    const { questionId, selectedOption, timeTaken = 0 } = body

    if (!questionId || selectedOption === undefined) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Get the question
    const question = await prisma.questionOfTheDay.findUnique({
      where: {
        id: questionId
      }
    })

    if (!question) {
      return new NextResponse('Question not found', { status: 404 })
    }

    // Check if user has already attempted this question
    const existingAttempt = await prisma.questionOfTheDayAttempt.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId: decoded.userId
        }
      }
    })

    if (existingAttempt) {
      return new NextResponse('Already attempted this question', { status: 400 })
    }

    // Create attempt
    const attempt = await prisma.questionOfTheDayAttempt.create({
      data: {
        questionId,
        userId: decoded.userId,
        selected: selectedOption,
        isCorrect: selectedOption === question.correct,
        timeTaken
      }
    })

    return NextResponse.json({
      isCorrect: attempt.isCorrect,
      correctAnswer: question.correct
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[QUESTION_OF_THE_DAY_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 