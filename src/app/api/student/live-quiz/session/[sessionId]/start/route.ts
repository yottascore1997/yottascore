import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/** POST: Start session (WAITING -> PLAYING, set startedAt) */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(authHeader.split(' ')[1]);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { sessionId } = await params;
    const session = await prisma.liveQuizSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.status !== 'WAITING') {
      return NextResponse.json(
        { session: { status: session.status }, message: 'Already started or finished' },
        { status: 200 }
      );
    }

    const updated = await prisma.liveQuizSession.update({
      where: { id: sessionId },
      data: { status: 'PLAYING', startedAt: new Date() },
    });

    return NextResponse.json({ session: updated });
  } catch (e) {
    console.error('Live quiz start error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
