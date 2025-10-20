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
    const quizzes = await prisma.battleQuiz.findMany({
      where: {
        createdById: decoded.userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        _count: {
          select: {
            participants: true,
            winners: true,
            questions: true,
            matches: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${quizzes.length} battle quizzes`);
    return NextResponse.json(quizzes);
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

    const { 
      title, 
      description, 
      entryAmount, 
      categoryId, 
      questionCount = 10,
      timePerQuestion = 15,
      isPrivate = false,
      maxPlayers = 2
    } = await req.json();
    if (!title || !categoryId) {
      return NextResponse.json({ message: 'Title and category are required.' }, { status: 400 });
    }

    // Allow free quizzes (entryAmount = 0)
    if (entryAmount === undefined || entryAmount === null) {
      return NextResponse.json({ message: 'Entry amount is required.' }, { status: 400 });
    }

    // Generate room code for private quizzes
    let roomCode: string | null = null;
    if (isPrivate) {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Verify category exists and belongs to admin
    const category = await prisma.questionCategory.findFirst({
      where: {
        id: categoryId,
        createdById: decoded.userId,
        isActive: true
      }
    });

    if (!category) {
      return NextResponse.json({ message: 'Category not found or access denied.' }, { status: 404 });
    }

    // Check if category has enough questions
    const availableQuestions = await prisma.questionBankItem.count({
      where: {
        categoryId,
        isActive: true
      }
    });

    if (availableQuestions < questionCount) {
      return NextResponse.json({ 
        message: `Category has only ${availableQuestions} questions available. Please select ${availableQuestions} or fewer questions.` 
      }, { status: 400 });
    }

    // Create the quiz
    const quiz = await prisma.battleQuiz.create({
      data: {
        title,
        description,
        entryAmount: parseFloat(entryAmount), // Can be 0 for free quizzes
        categoryId,
        questionCount,
        timePerQuestion,
        isPrivate,
        maxPlayers,
        roomCode,
        status: 'WAITING',
        createdById: decoded.userId,
      },
    });

    // Pick random questions from the category
    const allQuestions = await prisma.questionBankItem.findMany({
      where: {
        categoryId,
        isActive: true
      },
      select: {
        id: true,
        text: true,
        options: true,
        correct: true
      }
    });

    // Shuffle and pick random questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const randomQuestions = shuffled.slice(0, questionCount);

    // Add the random questions to the quiz
    for (const question of randomQuestions) {
      await prisma.battleQuizQuestion.create({
        data: {
          quizId: quiz.id,
          text: question.text,
          options: question.options || [],
          correct: question.correct,
          marks: 1,
        },
      });
    }

    return NextResponse.json({
      ...quiz,
      questionsAdded: randomQuestions.length
    });
  } catch (error: any) {
    console.error('Battle Quiz creation error:', error);
    return NextResponse.json({ message: error.message || 'Failed to create quiz.' }, { status: 500 });
  }
} 