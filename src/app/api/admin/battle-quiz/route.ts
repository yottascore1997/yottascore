import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    console.log('Received request to fetch battle quizzes');
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header or invalid format');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      console.log('Token decoded:', { userId: decoded.userId, role: decoded.role });
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      console.log('User is not an admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all battle quizzes
    const battleQuizzes = await prisma.liveExam.findMany({
      where: {
        createdById: decoded.userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        duration: true,
        spots: true,
        spotsLeft: true,
        entryFee: true,
        prizePool: true,
        isLive: true,
        _count: {
          select: {
            participants: true,
            winners: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${battleQuizzes.length} battle quizzes`);
    return NextResponse.json(battleQuizzes);
  } catch (error) {
    console.error('[BATTLE_QUIZ_GET] Detailed error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, entryAmount } = await req.json();
    if (!title || !entryAmount) {
      return NextResponse.json({ message: 'Title and entry amount are required.' }, { status: 400 });
    }
    const quiz = await prisma.battleQuiz.create({
      data: {
        title,
        description,
        entryAmount,
      },
    });
    return NextResponse.json(quiz);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create quiz.' }, { status: 500 });
  }
} 