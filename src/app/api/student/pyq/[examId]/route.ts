import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
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

    const myAttempts = await prisma.pYQAttempt.findMany({
      where: { examId: params.examId, userId: decoded.userId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: { id: true, score: true, totalMarks: true, correctCount: true, wrongCount: true, completedAt: true },
    })

    return NextResponse.json({ ...exam, myAttempts })
  } catch (error) {
    console.error('[PYQ] Detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
