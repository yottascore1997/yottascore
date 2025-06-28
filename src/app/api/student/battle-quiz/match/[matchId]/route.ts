import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

export const GET = withCORS(async (
  req: Request,
  { params }: { params: { matchId: string } }
) => {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = params;

    // Get match details
    const match = await prisma.battleQuizMatch.findUnique({
      where: { id: matchId },
      include: {
        quiz: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            questions: true
          }
        },
        player1: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        player2: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ message: 'Match not found.' }, { status: 404 });
    }

    // Check if user is part of this match
    if (match.player1Id !== decoded.userId && match.player2Id !== decoded.userId) {
      return NextResponse.json({ message: 'You are not part of this match.' }, { status: 403 });
    }

    // Determine if user is player1 or player2
    const isPlayer1 = match.player1Id === decoded.userId;
    const currentPlayer = isPlayer1 ? match.player1 : match.player2;
    const opponent = isPlayer1 ? match.player2 : match.player1;
    const currentScore = isPlayer1 ? match.player1Score : match.player2Score;
    const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;

    return NextResponse.json({
      match: {
        id: match.id,
        status: match.status,
        currentRound: match.currentRound,
        totalRounds: match.totalRounds,
        startTime: match.startTime,
        endTime: match.endTime,
        winner: match.winner,
        prizeAmount: match.prizeAmount
      },
      quiz: {
        id: match.quiz.id,
        title: match.quiz.title,
        description: match.quiz.description,
        entryAmount: match.quiz.entryAmount,
        category: match.quiz.category
      },
      currentPlayer: {
        ...currentPlayer,
        score: currentScore
      },
      opponent: {
        ...opponent,
        score: opponentScore
      },
      questions: match.quiz.questions
    });

  } catch (error: any) {
    console.error('Battle quiz match fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}); 