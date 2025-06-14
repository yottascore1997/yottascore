import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const exams = await prisma.practiceExam.findMany({
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        title: true,
        spots: true,
        spotsLeft: true,
        startTime: true,
        endTime: true,
      },
    });
    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    const { title, description, startTime, endTime, duration, spots, questions, category, subcategory } = body;
    if (!title || !startTime || !duration || !spots || !category || !subcategory) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const exam = await prisma.practiceExam.create({
      data: {
        title,
        description,
        category,
        subcategory,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration,
        spots,
        spotsLeft: spots,
        createdById: decoded.userId,
        questions: questions && Array.isArray(questions)
          ? {
              create: questions.map((q: any) => ({
                text: q.text,
                options: q.options,
                correct: q.correct,
              }))
            }
          : undefined,
      },
    });
    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 