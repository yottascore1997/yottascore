import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { gameId } = params;

    // Get the game with players and words (ordered for consistent mapping)
    const game = await prisma.spyGame.findUnique({
      where: { id: gameId },
      include: {
        players: {
          orderBy: { joinedAt: 'asc' }
        },
        words: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Find which word index this player should have
    const playerIndex = game.players.findIndex((p: any) => p.userId === decoded.userId);
    if (playerIndex === -1) {
      return NextResponse.json({ error: 'Player not found in game' }, { status: 404 });
    }

    // Get the word at the player's index
    const playerWordData = game.words[playerIndex];
    if (!playerWordData) {
      return NextResponse.json({ error: 'Word not assigned to player' }, { status: 404 });
    }

    return NextResponse.json({
      word: playerWordData.word,
      isSpy: playerWordData.isSpyWord
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('Error fetching player word:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 