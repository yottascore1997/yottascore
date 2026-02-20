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

    const exam = await prisma.pYQExam.findUnique({
      where: { id: params.examId, isActive: true },
      include: { _count: { select: { questions: true } } },
    })
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

    const totalMarks = exam._count.questions

    const attempt = await prisma.pYQAttempt.create({
      data: {
        examId: params.examId,
        userId: decoded.userId,
        totalMarks,
      },
    })

    return NextResponse.json({ attemptId: attempt.id, duration: exam.duration, totalQuestions: exam._count.questions })
  } catch (error) {
    console.error('[PYQ] Start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
