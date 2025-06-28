import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

export const POST = withCORS(async (
  req: NextRequest,
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
    const { questionId, selectedOption, timeTaken } = await req.json();

    if (!questionId || selectedOption === undefined) {
      return NextResponse.json({ message: 'Question ID and selected option are required.' }, { status: 400 });
    }

    // Get match details
    const match = await prisma.battleQuizMatch.findUnique({
      where: { id: matchId },
      include: {
        quiz: {
          include: {
            questions: true
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

    // Check if match is still active
    if (match.status !== 'PLAYING' && match.status !== 'STARTING') {
      return NextResponse.json({ message: 'Match is not active.' }, { status: 400 });
    }

    // Find the question
    const question = match.quiz.questions.find(q => q.id === questionId);
    if (!question) {
      return NextResponse.json({ message: 'Question not found.' }, { status: 404 });
    }

    // Check if answer is correct
    const isCorrect = question.correct === selectedOption;
    const points = isCorrect ? question.marks : 0;

    // Determine if user is player1 or player2
    const isPlayer1 = match.player1Id === decoded.userId;

    // Update match scores
    const updateData: any = {
      currentRound: match.currentRound + 1
    };

    if (isPlayer1) {
      updateData.player1Score = match.player1Score + points;
    } else {
      updateData.player2Score = match.player2Score + points;
    }

    // Check if match is finished (all rounds completed)
    if (match.currentRound + 1 >= match.totalRounds) {
      updateData.status = 'FINISHED';
      updateData.endTime = new Date();

      // Determine winner
      const finalPlayer1Score = isPlayer1 ? updateData.player1Score : match.player1Score;
      const finalPlayer2Score = isPlayer1 ? match.player2Score : updateData.player2Score;

      if (finalPlayer1Score > finalPlayer2Score) {
        updateData.winnerId = match.player1Id;
      } else if (finalPlayer2Score > finalPlayer1Score) {
        updateData.winnerId = match.player2Id;
      }
      // If scores are equal, no winner (tie)

      // Calculate prize amount (85% of total entry fees)
      const totalEntryFees = match.quiz.entryAmount * 2;
      const prizeAmount = totalEntryFees * 0.85;
      updateData.prizeAmount = prizeAmount;

      // Award prize to winner
      if (updateData.winnerId) {
        await prisma.user.update({
          where: { id: updateData.winnerId },
          data: {
            wallet: {
              increment: prizeAmount
            }
          }
        });

        // Create transaction record for the prize
        await prisma.transaction.create({
          data: {
            userId: updateData.winnerId,
            amount: prizeAmount,
            type: 'BATTLE_QUIZ_WIN',
            status: 'COMPLETED'
          }
        });

        // Create winner record
        await prisma.battleQuizWinner.create({
          data: {
            quizId: match.quizId,
            userId: updateData.winnerId,
            rank: 1,
            prizeAmount: prizeAmount,
            paid: true
          }
        });
      }
    } else {
      // Continue match
      updateData.status = 'PLAYING';
    }

    // Update match
    const updatedMatch = await prisma.battleQuizMatch.update({
      where: { id: matchId },
      data: updateData,
      include: {
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

    // Update participant's answers
    await prisma.battleQuizParticipant.updateMany({
      where: {
        matchId,
        userId: decoded.userId
      },
      data: {
        answers: {
          push: {
            questionId,
            selectedOption,
            isCorrect,
            points,
            timeTaken
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Answer submitted successfully!',
      isCorrect,
      points,
      match: {
        id: updatedMatch.id,
        status: updatedMatch.status,
        currentRound: updatedMatch.currentRound,
        totalRounds: updatedMatch.totalRounds,
        player1Score: updatedMatch.player1Score,
        player2Score: updatedMatch.player2Score,
        winner: updatedMatch.winner,
        prizeAmount: updatedMatch.prizeAmount
      }
    });

  } catch (error: any) {
    console.error('Battle quiz submit error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}); 