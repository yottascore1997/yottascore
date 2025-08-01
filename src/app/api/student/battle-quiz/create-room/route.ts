import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, timePerQuestion = 15, questionCount = 10, maxPlayers = 2 } = body;

    // Validate input
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category exists and has questions
    const category = await prisma.questionCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category._count.questions < questionCount) {
      return NextResponse.json({ 
        error: `Category only has ${category._count.questions} questions, but ${questionCount} requested` 
      }, { status: 400 });
    }

    // Generate unique room code
    const roomCode = generateRoomCode();

    // Create private room in database
    const room = await prisma.battleQuiz.create({
      data: {
        title: `Private Room ${roomCode}`,
        description: 'Private battle room',
        entryAmount: 0, // Free for private rooms
        categoryId,
        questionCount,
        timePerQuestion,
        isPrivate: true,
        roomCode,
        maxPlayers,
        createdById: decoded.userId,
        status: 'WAITING'
      }
    });

    // Add creator as participant
    await prisma.battleQuizParticipant.create({
      data: {
        quizId: room.id,
        userId: decoded.userId,
        status: 'WAITING',
        answers: []
      }
    });

    console.log(`Private room created: ${roomCode} by user ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      roomCode: room.roomCode,
      roomId: room.id,
      categoryId,
      timePerQuestion,
      questionCount,
      maxPlayers
    });

  } catch (error) {
    console.error('Error creating private room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 