import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: Request, { params }: { params: { examId: string } }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const participants = await prisma.practiceExamParticipant.findMany({
      where: { examId: params.examId },
      include: { user: { select: { name: true, id: true } } },
      orderBy: [
        { score: 'desc' },
        { completedAt: 'asc' }
      ]
    });
    const leaderboard = participants.map((p, i) => ({
      rank: i + 1,
      name: p.user?.name || 'Anonymous',
      userId: p.user?.id,
      score: p.score || 0
    }));
    return NextResponse.json(leaderboard);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 