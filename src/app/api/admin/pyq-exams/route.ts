import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string }
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const examType = searchParams.get('examType')
    const year = searchParams.get('year')

    const exams = await prisma.pYQExam.findMany({
      where: {
        ...(examType && { examType }),
        ...(year && { year: parseInt(year) }),
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    })
    return NextResponse.json(exams)
  } catch (error) {
    console.error('[PYQ] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string }
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { title, examType, year, subject, paperType, duration, totalMarks, questions } = body

    if (!title || !examType || !year || !questions?.length) {
      return NextResponse.json(
        { error: 'Title, examType, year, and questions are required' },
        { status: 400 }
      )
    }

    const totalMarksCalc = questions.reduce((s: number, q: { marks?: number }) => s + (q.marks ?? 1), 0)

    const exam = await prisma.pYQExam.create({
      data: {
        title,
        examType: String(examType),
        year: parseInt(year),
        subject: subject || null,
        paperType: paperType || null,
        duration: duration ?? 60,
        totalMarks: totalMarks ?? totalMarksCalc,
        createdById: decoded.userId,
      },
    })

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      await prisma.pYQQuestion.create({
        data: {
          examId: exam.id,
          text: q.text || '',
          options: Array.isArray(q.options) ? q.options : [],
          correct: q.correct !== undefined && q.correct !== null ? q.correct : null,
          marks: q.marks ?? 1,
          topic: q.topic || null,
          difficulty: q.difficulty || null,
          explanation: q.explanation || null,
          orderIndex: i,
        },
      })
    }

    const created = await prisma.pYQExam.findUnique({
      where: { id: exam.id },
      include: { _count: { select: { questions: true } } },
    })
    return NextResponse.json(created)
  } catch (error) {
    console.error('[PYQ] Create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
