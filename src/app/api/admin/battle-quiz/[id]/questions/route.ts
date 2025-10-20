import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const questions = await prisma.battleQuizQuestion.findMany({
      where: { quizId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(questions);
  } catch (error: any) {
    console.error('Battle Quiz questions fetch error:', error);
    return NextResponse.json({ message: error.message || 'Failed to fetch questions.' }, { status: 500 });
  }
} 