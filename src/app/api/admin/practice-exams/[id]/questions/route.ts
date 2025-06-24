import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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
    const { questions } = body;
    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid questions' }, { status: 400 });
    }
    // Fetch current questions
    const current = await prisma.practiceExamQuestion.findMany({
      where: { examId: params.id },
      select: { id: true },
    });
    const currentIds = current.map(q => q.id);
    const incomingIds = questions.filter(q => q.id).map(q => q.id);
    // Delete removed
    await prisma.practiceExamQuestion.deleteMany({
      where: { examId: params.id, id: { notIn: incomingIds.length ? incomingIds : [""] } },
    });
    // Upsert (update existing, create new)
    for (const q of questions) {
      if (q.id && currentIds.includes(q.id)) {
        await prisma.practiceExamQuestion.update({
          where: { id: q.id },
          data: { 
            text: q.text, 
            options: q.options, 
            correct: q.correct,
            marks: q.marks || 1,
          },
        });
      } else {
        await prisma.practiceExamQuestion.create({
          data: {
            examId: params.id,
            text: q.text,
            options: q.options,
            correct: q.correct,
            marks: q.marks || 1,
          },
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 