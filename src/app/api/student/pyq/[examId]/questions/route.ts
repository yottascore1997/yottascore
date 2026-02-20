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

    const { searchParams } = new URL(req.url)
    const attemptId = searchParams.get('attemptId')
    if (!attemptId) return NextResponse.json({ error: 'attemptId required' }, { status: 400 })

    const attempt = await prisma.pYQAttempt.findFirst({
      where: { id: attemptId, examId: params.examId, userId: decoded.userId },
    })
    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })

    const questions = await prisma.pYQQuestion.findMany({
      where: { examId: params.examId },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, text: true, options: true, marks: true, topic: true, orderIndex: true },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('[PYQ] Questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
