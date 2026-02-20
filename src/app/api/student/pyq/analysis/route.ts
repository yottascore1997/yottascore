import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = await verifyToken(authHeader.split(' ')[1])
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const attempts = await prisma.pYQAttempt.findMany({
      where: { userId: decoded.userId, completedAt: { not: null } },
      include: { exam: { select: { title: true, examType: true, year: true } } },
      orderBy: { completedAt: 'desc' },
      take: 50,
    })

    const totalAttempts = attempts.length
    const totalCorrect = attempts.reduce((s, a) => s + a.correctCount, 0)
    const totalWrong = attempts.reduce((s, a) => s + a.wrongCount, 0)
    const totalQuestions = attempts.reduce((s, a) => s + a.correctCount + a.wrongCount + a.unattemptedCount, 0)
    const avgScore = totalAttempts > 0
      ? attempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / totalAttempts
      : 0

    const byTopic: Record<string, { correct: number; total: number }> = {}
    for (const a of attempts) {
      const questions = await prisma.pYQQuestion.findMany({
        where: { examId: a.examId },
        select: { id: true, topic: true, correct: true },
      })
      const answers = (a.answers as Record<string, number>) || {}
      for (const q of questions) {
        const topic = q.topic || 'General'
        if (!byTopic[topic]) byTopic[topic] = { correct: 0, total: 0 }
        byTopic[topic].total++
        if (answers[q.id] === q.correct) byTopic[topic].correct++
      }
    }

    const topicAccuracy = Object.entries(byTopic).map(([topic, d]) => ({
      topic,
      correct: d.correct,
      total: d.total,
      accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
    })).sort((a, b) => a.accuracy - b.accuracy)

    const weakTopics = topicAccuracy.filter((t) => t.total >= 3 && t.accuracy < 70)

    return NextResponse.json({
      summary: {
        totalAttempts,
        totalCorrect,
        totalWrong,
        totalQuestions,
        avgScore: Math.round(avgScore),
        overallAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0,
      },
      byTopic: topicAccuracy,
      weakTopics,
      recentAttempts: attempts.slice(0, 10).map((a) => ({
        id: a.id,
        examId: a.examId,
        exam: { id: a.exam.id, title: a.exam.title, examType: a.exam.examType, year: a.exam.year },
        score: a.score,
        totalMarks: a.totalMarks,
        correctCount: a.correctCount,
        wrongCount: a.wrongCount,
        completedAt: a.completedAt,
      })),
    })
  } catch (error) {
    console.error('[PYQ] Analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
