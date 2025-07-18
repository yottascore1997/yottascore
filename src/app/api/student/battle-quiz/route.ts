import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch battle quiz leaderboard and user stats
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'leaderboard') {
      // Fetch global leaderboard
      const leaderboard = await prisma.user.findMany({
        where: {
          battleStats: {
            isNot: null
          }
        },
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          battleStats: {
            select: {
              wins: true,
              totalMatches: true,
              winRate: true,
              level: true,
              currentStreak: true
            }
          }
        },
        orderBy: [
          { battleStats: { level: 'desc' } },
          { battleStats: { wins: 'desc' } },
          { battleStats: { winRate: 'desc' } }
        ],
        take: 50
      });

      return NextResponse.json(leaderboard.map((user, index) => ({
        rank: index + 1,
        user: {
          id: user.id,
          name: user.name,
          profilePhoto: user.profilePhoto
        },
        stats: user.battleStats!
      })));
    }

    if (type === 'stats') {
      // Fetch user's battle stats
      const userStats = await prisma.userBattleStats.findUnique({
        where: { userId: decoded.userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              wallet: true
            }
          }
        }
      });

      if (!userStats) {
        // Create default stats for new user
        const defaultStats = await prisma.userBattleStats.create({
          data: {
            userId: decoded.userId,
            totalMatches: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            level: 1,
            experience: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalPrizeMoney: 0,
            averageResponseTime: 0,
            fastestAnswer: 0,
            totalCorrectAnswers: 0
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                wallet: true
              }
            }
          }
        });

        return NextResponse.json({
          user: defaultStats.user,
          battleStats: defaultStats
        });
      }

      return NextResponse.json({
        user: userStats.user,
        battleStats: userStats
      });
    }

    // Default: return available categories for battle quiz
    const categories = await prisma.questionCategory.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            questions: true
          }
        }
      },
      where: {
        questions: {
          some: {}
        }
      }
    });

    return NextResponse.json(categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      questionCount: cat._count.questions
    })));

  } catch (error) {
    console.error('Error in battle quiz API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create private room
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
    const { categoryId, timePerQuestion = 15, questionCount = 10 } = body;

    // Generate unique room code
    const roomCode = generateRoomCode();

    // Create private room
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
        maxPlayers: 2,
        createdById: decoded.userId,
        status: 'WAITING'
      }
    });

    // Add creator as participant
    await prisma.battleQuizParticipant.create({
      data: {
        battleQuizId: room.id,
        userId: decoded.userId,
        status: 'JOINED',
        isHost: true
      }
    });

    return NextResponse.json({
      roomCode: room.roomCode,
      roomId: room.id,
      categoryId,
      timePerQuestion,
      questionCount
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