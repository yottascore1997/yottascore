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

    console.log('[MY_EXAMS_GET] User ID:', decoded.userId)

    // For now, just return an empty array to test if the basic API works
    const allAttempts = []

    // Try to fetch live exam attempts with minimal data
    try {
      const liveAttempts = await prisma.liveExamParticipant.findMany({
        where: {
          userId: decoded.userId
        },
        select: {
          id: true,
          examId: true,
          score: true,
          completedAt: true,
          exam: {
            select: {
              title: true
            }
          }
        }
      })

      console.log('[MY_EXAMS_GET] Live attempts found:', liveAttempts.length)

      const transformedLiveAttempts = liveAttempts.map(attempt => ({
        id: attempt.id,
        examId: attempt.examId,
        examName: attempt.exam.title,
        examType: 'LIVE' as const,
        score: attempt.score || 0,
        totalQuestions: 0,
        correctAnswers: 0,
        timeTaken: 0,
        completedAt: attempt.completedAt?.toISOString(),
        status: 'COMPLETED' as const
      }))

      allAttempts.push(...transformedLiveAttempts)
    } catch (error) {
      console.error('[MY_EXAMS_GET] Error fetching live attempts:', error)
    }

    // Try to fetch practice exam attempts with minimal data
    try {
      const practiceAttempts = await prisma.practiceExamParticipant.findMany({
        where: {
          userId: decoded.userId
        },
        select: {
          id: true,
          examId: true,
          score: true,
          completedAt: true,
          exam: {
            select: {
              title: true
            }
          }
        }
      })

      console.log('[MY_EXAMS_GET] Practice attempts found:', practiceAttempts.length)

      const transformedPracticeAttempts = practiceAttempts.map(attempt => ({
        id: attempt.id,
        examId: attempt.examId,
        examName: attempt.exam.title,
        examType: 'PRACTICE' as const,
        score: attempt.score || 0,
        totalQuestions: 0,
        correctAnswers: 0,
        timeTaken: 0,
        completedAt: attempt.completedAt?.toISOString(),
        status: 'COMPLETED' as const
      }))

      allAttempts.push(...transformedPracticeAttempts)
    } catch (error) {
      console.error('[MY_EXAMS_GET] Error fetching practice attempts:', error)
    }

    // Try to fetch battle quiz attempts with minimal data
    try {
      const battleAttempts = await prisma.battleQuizParticipant.findMany({
        where: {
          userId: decoded.userId
        },
        select: {
          id: true,
          quizId: true,
          score: true,
          joinedAt: true,
          quiz: {
            select: {
              title: true
            }
          }
        }
      })

      console.log('[MY_EXAMS_GET] Battle attempts found:', battleAttempts.length)

      const transformedBattleAttempts = battleAttempts.map(attempt => ({
        id: attempt.id,
        examId: attempt.quizId,
        examName: attempt.quiz.title,
        examType: 'BATTLE' as const,
        score: attempt.score || 0,
        totalQuestions: 0,
        correctAnswers: 0,
        timeTaken: 0,
        completedAt: attempt.joinedAt.toISOString(),
        status: 'COMPLETED' as const
      }))

      allAttempts.push(...transformedBattleAttempts)
    } catch (error) {
      console.error('[MY_EXAMS_GET] Error fetching battle attempts:', error)
    }

    console.log('[MY_EXAMS_GET] Total attempts found:', allAttempts.length)
    return NextResponse.json(allAttempts)

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 })
    }
    console.error('[MY_EXAMS_GET]', error)
    console.error('[MY_EXAMS_GET] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return new NextResponse('Internal Error', { status: 500 })
  }
} 