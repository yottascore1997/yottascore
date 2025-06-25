import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request, { params }: { params: { examId: string } }) {
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
    
    // Check if user has completed the exam
    const participant = await prisma.practiceExamParticipant.findUnique({
      where: {
        examId_userId: {
          examId: params.examId,
          userId: decoded.userId
        }
      }
    });
    
    if (!participant || !participant.completedAt) {
      return NextResponse.json({ error: 'Exam not completed yet.' }, { status: 403 });
    }
    
    // Fetch questions with correct answers for result analysis
    const questions = await prisma.practiceExamQuestion.findMany({
      where: { examId: params.examId },
      select: {
        id: true,
        text: true,
        options: true,
        correct: true,
        marks: true,
      },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 