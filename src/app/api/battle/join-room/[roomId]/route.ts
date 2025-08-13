import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Join battle room
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

    // Check if room exists
    const room = await prisma.battleRoom.findUnique({
      where: { id: roomId },
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
      }
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if room is full
    if (room.players.length >= room.maxPlayers) {
      return NextResponse.json(
        { success: false, error: 'Room is full' },
        { status: 400 }
      );
    }

    // Check if battle already started
    if (room.status !== 'waiting') {
      return NextResponse.json(
        { success: false, error: 'Battle already in progress' },
        { status: 400 }
      );
    }

    // Check if user is already in the room
    const existingPlayer = room.players.find(player => player.userId === decoded.userId);
    if (existingPlayer) {
      return NextResponse.json(
        { success: false, error: 'Already in this room' },
        { status: 400 }
      );
    }

    // Add player to room
    await prisma.battlePlayer.create({
      data: {
        roomId: roomId,
        userId: decoded.userId,
        score: 0,
        isReady: false,
        isOnline: true
      }
    });

    // Get updated room data
    const updatedRoom = await prisma.battleRoom.findUnique({
      where: { id: roomId },
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
      }
    });

    return NextResponse.json({
      success: true,
      room: {
        id: updatedRoom!.id,
        name: updatedRoom!.name,
        players: updatedRoom!.players.map(player => ({
          id: player.user.id,
          name: player.user.name,
          avatar: player.user.profilePhoto,
          score: player.score,
          isReady: player.isReady,
          isOnline: player.isOnline
        })),
        maxPlayers: updatedRoom!.maxPlayers,
        status: updatedRoom!.status,
        category: updatedRoom!.category
      }
    });

  } catch (error) {
    console.error('Error joining battle room:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
