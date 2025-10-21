import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Mark player as ready
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
        }
      }
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if user is in the room
    const player = room.players.find(p => p.userId === decoded.userId);
    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Not in this room' },
        { status: 400 }
      );
    }

    // Update player ready status
    await prisma.battlePlayer.update({
      where: { id: player.id },
      data: { isReady: !player.isReady }
    });

    // Check if all players are ready
    const allPlayersReady = room.players.every(p => p.isReady || p.userId === decoded.userId);
    const updatedPlayer = room.players.find(p => p.userId === decoded.userId);
    const newReadyStatus = updatedPlayer ? !updatedPlayer.isReady : true;

    // If all players are ready and room has 2 players, start the battle
    if (allPlayersReady && newReadyStatus && room.players.length === 2) {
      await prisma.battleRoom.update({
        where: { id: roomId },
        data: { status: 'PLAYING' }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Player is ready',
      isReady: newReadyStatus,
      allPlayersReady: allPlayersReady && newReadyStatus
    });

  } catch (error) {
    console.error('Error updating player ready status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
