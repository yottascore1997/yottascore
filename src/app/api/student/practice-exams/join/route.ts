import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { examId } = await req.json();
    if (!examId) {
      return NextResponse.json({ error: 'Missing examId' }, { status: 400 });
    }
    // Check if exam exists
    const exam = await prisma.practiceExam.findUnique({ where: { id: examId } });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    // Check if already joined
    const existing = await prisma.practiceExamParticipant.findUnique({
      where: {
        examId_userId: {
          examId,
          userId: decoded.userId
        }
      }
    });
    if (existing) {
      return NextResponse.json({ error: 'Already joined this exam' }, { status: 400 });
    }
    // Create participant
    const participant = await prisma.practiceExamParticipant.create({
      data: {
        examId,
        userId: decoded.userId
      }
    });
    // Decrement spotsLeft
    await prisma.practiceExam.update({
      where: { id: examId },
      data: { spotsLeft: { decrement: 1 } }
    });
    return NextResponse.json(participant);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 