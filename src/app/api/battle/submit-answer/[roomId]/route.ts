import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Submit answer
export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = params;
    const body = await request.json();
    const { questionIndex, answerIndex } = body;

    if (questionIndex === undefined || answerIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Question index and answer index are required' },
        { status: 400 }
      );
    }

    // Check if room exists and battle is active
    const room = await prisma.battleRoom.findUnique({
      where: { id: roomId },
      include: {
        players: {
          where: { userId: decoded.userId }
        },
        battleQuestions: {
          where: { questionIndex },
          include: {
            question: true
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    if (room.status !== 'PLAYING') {
      return NextResponse.json(
        { success: false, error: 'Battle not active' },
        { status: 400 }
      );
    }

    // Check if user is in the room
    if (room.players.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Not in this room' },
        { status: 400 }
      );
    }

    // Check if question exists
    if (room.battleQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    const battleQuestion = room.battleQuestions[0];
    const question = battleQuestion.question;

    // Check if answer is valid
    if (answerIndex < 0 || answerIndex >= question.options.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid answer index' },
        { status: 400 }
      );
    }

    // Check if already answered this question
    const existingAnswer = await prisma.battleAnswer.findFirst({
      where: {
        roomId,
        userId: decoded.userId,
        questionIndex
      }
    });

    if (existingAnswer) {
      return NextResponse.json(
        { success: false, error: 'Already answered this question' },
        { status: 400 }
      );
    }

    // Check if time is up
    const now = new Date();
    const questionStartTime = battleQuestion.startedAt;
    const timeLimit = 10; // 10 seconds
    const timeElapsed = (now.getTime() - questionStartTime.getTime()) / 1000;

    if (timeElapsed > timeLimit) {
      return NextResponse.json(
        { success: false, error: 'Time limit exceeded' },
        { status: 400 }
      );
    }

    // Check if answer is correct
    const isCorrect = answerIndex === question.correctAnswer;
    const timeSpent = Math.floor(timeElapsed);

    // Calculate score (10 points for correct answer + speed bonus)
    let score = 0;
    if (isCorrect) {
      score = 10;
      // Speed bonus: up to 5 points for answering quickly
      if (timeSpent <= 3) score += 5;
      else if (timeSpent <= 5) score += 3;
      else if (timeSpent <= 7) score += 1;
    }

    // Save answer
    await prisma.battleAnswer.create({
      data: {
        roomId,
        userId: decoded.userId,
        questionIndex,
        answerIndex,
        isCorrect,
        timeSpent,
        score
      }
    });

    // Update player score
    await prisma.battlePlayer.update({
      where: {
        roomId_userId: {
          roomId,
          userId: decoded.userId
        }
      },
      data: {
        score: {
          increment: score
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Answer submitted',
      isCorrect,
      score,
      timeSpent
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
