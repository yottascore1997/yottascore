import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(
  req: Request,
  { params }: { params: { examId: string } }
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

    const body = await req.json()
    const { attemptId, answers, timeTakenSeconds } = body
    if (!attemptId || !answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'attemptId and answers required' }, { status: 400 })
    }

    const attempt = await prisma.pYQAttempt.findFirst({
      where: { id: attemptId, examId: params.examId, userId: decoded.userId },
    })
    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    if (attempt.completedAt) return NextResponse.json({ error: 'Already submitted' }, { status: 400 })

    const questions = await prisma.pYQQuestion.findMany({
      where: { examId: params.examId },
      select: { id: true, correct: true, marks: true },
    })

    let score = 0
    let correctCount = 0
    let wrongCount = 0
    let unattemptedCount = 0

    for (const q of questions) {
      const selected = answers[q.id]
      if (selected === undefined || selected === null) {
        unattemptedCount++
        continue
      }
      if (selected === q.correct) {
        correctCount++
        score += q.marks
      } else {
        wrongCount++
      }
    }

    const totalMarks = questions.reduce((s, q) => s + q.marks, 0)

    await prisma.pYQAttempt.update({
      where: { id: attemptId },
      data: {
        answers: answers as object,
        score,
        totalMarks,
        correctCount,
        wrongCount,
        unattemptedCount,
        timeTakenSeconds: timeTakenSeconds ?? null,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      score,
      totalMarks,
      correctCount,
      wrongCount,
      unattemptedCount,
    })
  } catch (error) {
    console.error('[PYQ] Submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
