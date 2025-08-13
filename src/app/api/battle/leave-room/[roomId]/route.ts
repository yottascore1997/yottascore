import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Leave battle room
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
        players: true
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

    // Remove player from room
    await prisma.battlePlayer.delete({
      where: { id: player.id }
    });

    // If no players left, delete the room
    const remainingPlayers = await prisma.battlePlayer.count({
      where: { roomId }
    });

    if (remainingPlayers === 0) {
      await prisma.battleRoom.delete({
        where: { id: roomId }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Left room successfully'
    });

  } catch (error) {
    console.error('Error leaving battle room:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
