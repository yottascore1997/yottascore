import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: { examId: string; attemptId: string } }
) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = await verifyToken(authHeader.split(' ')[1])
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const attempt = await prisma.pYQAttempt.findFirst({
      where: {
        id: params.attemptId,
        examId: params.examId,
        userId: decoded.userId,
      },
      include: { exam: true },
    })
    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })

    const questions = await prisma.pYQQuestion.findMany({
      where: { examId: params.examId },
      orderBy: { orderIndex: 'asc' },
    })

    const answers = (attempt.answers as Record<string, number>) || {}
    const withUserAnswer = questions.map((q) => ({
      ...q,
      userSelected: answers[q.id],
      isCorrect: answers[q.id] === q.correct,
    }))

    return NextResponse.json({
      attempt: {
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        unattemptedCount: attempt.unattemptedCount,
        timeTakenSeconds: attempt.timeTakenSeconds,
        completedAt: attempt.completedAt,
      },
      exam: attempt.exam,
      questions: withUserAnswer,
    })
  } catch (error) {
    console.error('[PYQ] Result error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
