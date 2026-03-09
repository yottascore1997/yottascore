import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/** POST - Like or pass. Body: { targetUserId, action: 'like' | 'pass' } */
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
    const { targetUserId, action } = body;
    if (!targetUserId || !['like', 'pass'].includes(action)) {
      return NextResponse.json({ error: 'targetUserId and action (like|pass) required' }, { status: 400 });
    }
    if (targetUserId === decoded.userId) {
      return NextResponse.json({ error: 'Cannot like/pass yourself' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const like = await prisma.studyPartnerLike.upsert({
      where: {
        userId_targetUserId: { userId: decoded.userId, targetUserId },
      },
      create: {
        userId: decoded.userId,
        targetUserId,
        action,
      },
      update: { action },
    });

    let newMatch = null;
    if (action === 'like') {
      const theyLikedMe = await prisma.studyPartnerLike.findUnique({
        where: {
          userId_targetUserId: { userId: targetUserId, targetUserId: decoded.userId },
        },
      });
      if (theyLikedMe?.action === 'like') {
        const [u1, u2] = [decoded.userId, targetUserId].sort();
        newMatch = await prisma.studyPartnerMatch.upsert({
          where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
          create: { user1Id: u1, user2Id: u2 },
          update: {},
          include: {
            user1: { select: { id: true, name: true, profilePhoto: true } },
            user2: { select: { id: true, name: true, profilePhoto: true } },
          },
        });
      }
    }

    return NextResponse.json({ like, newMatch });
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('[study-partner like POST]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
