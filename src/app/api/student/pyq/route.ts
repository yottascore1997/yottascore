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

    const { searchParams } = new URL(req.url)
    const examType = searchParams.get('examType')
    const year = searchParams.get('year')

    const exams = await prisma.pYQExam.findMany({
      where: { isActive: true, ...(examType && { examType }), ...(year && { year: parseInt(year) }) },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        examType: true,
        year: true,
        subject: true,
        paperType: true,
        duration: true,
        totalMarks: true,
        _count: { select: { questions: true } },
      },
    })

    const withAttemptCount = await Promise.all(
      exams.map(async (e) => {
        const count = await prisma.pYQAttempt.count({
          where: { examId: e.id, userId: decoded.userId },
        })
        return { ...e, myAttempts: count }
      })
    )

    return NextResponse.json(withAttemptCount)
  } catch (error) {
    console.error('[PYQ] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
