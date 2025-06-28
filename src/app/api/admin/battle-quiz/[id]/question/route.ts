import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const quizId = params.id;
    const { text, options, correct, marks = 1 } = await req.json();
    
    if (!text || !options || typeof correct !== 'number') {
      return NextResponse.json({ message: 'Invalid question data.' }, { status: 400 });
    }

    // Verify the quiz exists and belongs to the admin
    const quiz = await prisma.battleQuiz.findFirst({
      where: {
        id: quizId,
        createdById: decoded.userId
      }
    });

    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found or access denied.' }, { status: 404 });
    }

    const mcq = await prisma.battleQuizQuestion.create({
      data: {
        quizId,
        text,
        options,
        correct,
        marks,
      },
    });
    return NextResponse.json(mcq);
  } catch (error: any) {
    console.error('Battle Quiz question creation error:', error);
    return NextResponse.json({ message: error.message || 'Failed to add question.' }, { status: 500 });
  }
} 