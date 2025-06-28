import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

export const POST = withCORS(async (req: NextRequest) => {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { quizId, opponentId } = await req.json();

    if (!quizId) {
      return NextResponse.json({ message: 'Quiz ID is required.' }, { status: 400 });
    }

    // Verify quiz exists and is active
    const quiz = await prisma.battleQuiz.findFirst({
      where: {
        id: quizId,
        isActive: true
      }
    });

    if (!quiz) {
      return NextResponse.json({ message: 'Quiz not found or inactive.' }, { status: 404 });
    }

    // Check if user has enough balance
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { wallet: true }
    });

    if (!user || user.wallet < quiz.entryAmount) {
      return NextResponse.json({ 
        message: `Insufficient balance. Required: ₹${quiz.entryAmount}, Available: ₹${user?.wallet || 0}` 
      }, { status: 400 });
    }

    // Check if user is already in an active match for this quiz
    const activeMatch = await prisma.battleQuizMatch.findFirst({
      where: {
        quizId,
        OR: [
          { player1Id: decoded.userId },
          { player2Id: decoded.userId }
        ],
        status: { in: ['WAITING', 'STARTING', 'PLAYING'] }
      }
    });

    if (activeMatch) {
      return NextResponse.json({ message: 'You are already in an active match for this quiz.' }, { status: 400 });
    }

    // Deduct entry amount from wallet
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        wallet: {
          decrement: quiz.entryAmount
        }
      }
    });

    // Create transaction record for the deduction
    await prisma.transaction.create({
      data: {
        userId: decoded.userId,
        amount: -quiz.entryAmount,
        type: 'BATTLE_QUIZ_ENTRY',
        status: 'COMPLETED'
      }
    });

    // Create participation record
    const participation = await prisma.battleQuizParticipant.create({
      data: {
        quizId,
        userId: decoded.userId,
        status: 'WAITING',
        score: 0,
        answers: []
      }
    });

    // If opponent is specified, create a direct match
    if (opponentId) {
      // Check if opponent is available
      const opponentParticipation = await prisma.battleQuizParticipant.findFirst({
        where: {
          quizId,
          userId: opponentId,
          status: 'WAITING'
        }
      });

      if (opponentParticipation) {
        // Create match
        const match = await prisma.battleQuizMatch.create({
          data: {
            quizId,
            player1Id: decoded.userId,
            player2Id: opponentId,
            status: 'STARTING',
            currentRound: 0,
            totalRounds: 5,
            player1Score: 0,
            player2Score: 0,
            startTime: new Date(),
            endTime: null
          }
        });

        // Update both participations
        await prisma.battleQuizParticipant.updateMany({
          where: {
            quizId,
            userId: { in: [decoded.userId, opponentId] }
          },
          data: {
            status: 'PLAYING',
            matchId: match.id
          }
        });

        return NextResponse.json({
          message: 'Match created successfully!',
          matchId: match.id,
          opponentId
        });
      }
    }

    // Look for available opponent (random matching)
    const availableOpponent = await prisma.battleQuizParticipant.findFirst({
      where: {
        quizId,
        userId: { not: decoded.userId },
        status: 'WAITING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (availableOpponent) {
      // Create match with random opponent
      const match = await prisma.battleQuizMatch.create({
        data: {
          quizId,
          player1Id: availableOpponent.userId,
          player2Id: decoded.userId,
          status: 'STARTING',
          currentRound: 0,
          totalRounds: 5,
          player1Score: 0,
          player2Score: 0,
          startTime: new Date(),
          endTime: null
        }
      });

      // Update both participations
      await prisma.battleQuizParticipant.updateMany({
        where: {
          quizId,
          userId: { in: [decoded.userId, availableOpponent.userId] }
        },
        data: {
          status: 'PLAYING',
          matchId: match.id
        }
      });

      return NextResponse.json({
        message: 'Opponent found! Match starting...',
        matchId: match.id,
        opponent: {
          id: availableOpponent.user.id,
          name: availableOpponent.user.name,
          image: availableOpponent.user.image
        }
      });
    }

    // No opponent found, wait for one
    return NextResponse.json({
      message: 'Waiting for opponent...',
      participationId: participation.id
    });

  } catch (error: any) {
    console.error('Battle quiz join error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}); 