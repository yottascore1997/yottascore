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

    // Try to fetch live exam attempts with detailed data
    try {
      const liveAttempts = await prisma.liveExamParticipant.findMany({
        where: {
          userId: decoded.userId
        },
        select: {
          id: true,
          examId: true,
          score: true,
          answers: true,
          startedAt: true,
          completedAt: true,
          exam: {
            select: {
              title: true,
              duration: true,
              _count: {
                select: {
                  questions: true
                }
              }
            }
          }
        }
      })

      console.log('[MY_EXAMS_GET] Live attempts found:', liveAttempts.length)

      const transformedLiveAttempts = liveAttempts.map((attempt: any) => {
        const totalQuestions = attempt.exam._count.questions;
        const correctAnswers = attempt.score ? Math.floor(attempt.score / 10) : 0; // Assuming 10 points per correct answer
        const timeTaken = attempt.completedAt && attempt.startedAt 
          ? Math.floor((new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000 / 60) // in minutes
          : 0;
        const accuracy = totalQuestions > 0 ? Math.min(100, Math.round((correctAnswers / totalQuestions) * 100)) : 0;

        return {
          id: attempt.id,
          examId: attempt.examId,
          examName: attempt.exam.title,
          examType: 'LIVE' as const,
          score: attempt.score || 0,
          totalQuestions,
          correctAnswers,
          timeTaken,
          accuracy,
          completedAt: attempt.completedAt?.toISOString(),
          status: 'COMPLETED' as const
        };
      })

      allAttempts.push(...transformedLiveAttempts)
    } catch (error) {
      console.error('[MY_EXAMS_GET] Error fetching live attempts:', error)
    }

    // Try to fetch practice exam attempts with detailed data
    try {
      const practiceAttempts = await prisma.practiceExamParticipant.findMany({
        where: {
          userId: decoded.userId
        },
        select: {
          id: true,
          examId: true,
          score: true,
          answers: true,
          startedAt: true,
          completedAt: true,
          exam: {
            select: {
              title: true,
              duration: true,
              _count: {
                select: {
                  questions: true
                }
              }
            }
          }
        }
      })

      console.log('[MY_EXAMS_GET] Practice attempts found:', practiceAttempts.length)

      const transformedPracticeAttempts = practiceAttempts.map((attempt: any) => {
        const totalQuestions = attempt.exam._count.questions;
        const correctAnswers = attempt.score ? Math.floor(attempt.score / 10) : 0; // Assuming 10 points per correct answer
        const timeTaken = attempt.completedAt && attempt.startedAt 
          ? Math.floor((new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000 / 60) // in minutes
          : 0;
        const accuracy = totalQuestions > 0 ? Math.min(100, Math.round((correctAnswers / totalQuestions) * 100)) : 0;

        return {
          id: attempt.id,
          examId: attempt.examId,
          examName: attempt.exam.title,
          examType: 'PRACTICE' as const,
          score: attempt.score || 0,
          totalQuestions,
          correctAnswers,
          timeTaken,
          accuracy,
          completedAt: attempt.completedAt?.toISOString(),
          status: 'COMPLETED' as const
        };
      })

      allAttempts.push(...transformedPracticeAttempts)
    } catch (error) {
      console.error('[MY_EXAMS_GET] Error fetching practice attempts:', error)
    }

    // Try to fetch battle quiz attempts with detailed data
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
              title: true,
              duration: true,
              _count: {
                select: {
                  questions: true
                }
              }
            }
          }
        }
      })

      console.log('[MY_EXAMS_GET] Battle attempts found:', battleAttempts.length)

      const transformedBattleAttempts = battleAttempts.map((attempt: any) => {
        const totalQuestions = attempt.quiz._count.questions;
        const correctAnswers = attempt.score ? Math.floor(attempt.score / 10) : 0; // Assuming 10 points per correct answer
        const timeTaken = attempt.quiz.duration || 0; // Battle quizzes have fixed duration
        const accuracy = totalQuestions > 0 ? Math.min(100, Math.round((correctAnswers / totalQuestions) * 100)) : 0;

        return {
          id: attempt.id,
          examId: attempt.quizId,
          examName: attempt.quiz.title,
          examType: 'BATTLE' as const,
          score: attempt.score || 0,
          totalQuestions,
          correctAnswers,
          timeTaken,
          accuracy,
          completedAt: attempt.joinedAt.toISOString(),
          status: 'COMPLETED' as const
        };
      })

      allAttempts.push(...transformedBattleAttempts)
    } catch (error) {
      console.error('[MY_EXAMS_GET] Error fetching battle attempts:', error)
    }

    console.log('[MY_EXAMS_GET] Total attempts found:', allAttempts.length)
    
    // Log sample data for debugging
    if (allAttempts.length > 0) {
      console.log('[MY_EXAMS_GET] Sample attempt data:', {
        examName: allAttempts[0].examName,
        examType: allAttempts[0].examType,
        score: allAttempts[0].score,
        totalQuestions: allAttempts[0].totalQuestions,
        correctAnswers: allAttempts[0].correctAnswers,
        timeTaken: allAttempts[0].timeTaken,
        accuracy: allAttempts[0].accuracy
      });
    }
    
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