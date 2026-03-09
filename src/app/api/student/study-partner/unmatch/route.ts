import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/** POST - Unmatch: body { otherUserId } */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { otherUserId } = body;
    if (!otherUserId) {
      return NextResponse.json({ error: 'otherUserId required' }, { status: 400 });
    }

    const [u1, u2] = [decoded.userId, otherUserId].sort();
    const match = await prisma.studyPartnerMatch.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    });
    if (!match || match.unmatchedAt) {
      return NextResponse.json({ error: 'Match not found or already unmatched' }, { status: 404 });
    }

    await prisma.studyPartnerMatch.update({
      where: { id: match.id },
      data: { unmatchedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Unmatched' });
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('[study-partner unmatch POST]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
