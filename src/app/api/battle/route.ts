import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get available battle rooms
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

    // Get all available battle rooms
    const rooms = await prisma.battleRoom.findMany({
      where: {
        status: 'waiting',
        players: {
          some: {}
        }
      },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePhoto: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name,
        players: room.players.map(player => ({
          id: player.user.id,
          name: player.user.name,
          avatar: player.user.profilePhoto,
          score: player.score,
          isReady: player.isReady,
          isOnline: player.isOnline
        })),
        maxPlayers: room.maxPlayers,
        status: room.status,
        category: room.category,
        createdAt: room.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching battle rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create battle room
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
    const { name, categoryId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Create battle room
    const room = await prisma.battleRoom.create({
      data: {
        name,
        categoryId: categoryId || null,
        maxPlayers: 2,
        status: 'waiting',
        createdById: decoded.userId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    // Add creator as first player
    await prisma.battlePlayer.create({
      data: {
        roomId: room.id,
        userId: decoded.userId,
        score: 0,
        isReady: false,
        isOnline: true
      }
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        profilePhoto: true
      }
    });

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        players: [{
          id: user!.id,
          name: user!.name,
          avatar: user!.profilePhoto,
          score: 0,
          isReady: false,
          isOnline: true
        }],
        maxPlayers: room.maxPlayers,
        status: room.status,
        category: room.category
      }
    });

  } catch (error) {
    console.error('Error creating battle room:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
