import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { examId: string } }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { examId } = params;
    const participants = await prisma.liveExamParticipant.findMany({
      where: { examId },
      include: { user: { select: { name: true, id: true } } },
      orderBy: [
        { score: 'desc' },
        { completedAt: 'asc' }
      ]
    });
    // Fetch winnings for this exam
    const winnings = await prisma.liveExamWinner.findMany({
      where: { examId },
      select: { rank: true, prizeAmount: true }
    });
    const winningsMap = new Map(winnings.map(w => [w.rank, w.prizeAmount]));
    const leaderboard = participants.map((p, i) => ({
      rank: i + 1,
      name: p.user?.name || 'Anonymous',
      userId: p.user?.id,
      score: p.score || 0,
      prizeAmount: winningsMap.get(i + 1) || 0
    }));
    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 