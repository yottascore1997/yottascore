import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { normalizeUploadUrl } from '@/lib/upload';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/** GET - Who liked you (they liked you, you haven't liked them back) */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const likedMe = await prisma.studyPartnerLike.findMany({
      where: { targetUserId: decoded.userId, action: 'like' },
      include: {
        user: { select: { id: true, name: true, profilePhoto: true } },
      },
    });

    const myLikesOnThem = await prisma.studyPartnerLike.findMany({
      where: {
        userId: decoded.userId,
        targetUserId: { in: likedMe.map((l) => l.userId) },
      },
      select: { targetUserId: true },
    });
    const myLikedSet = new Set(myLikesOnThem.map((l) => l.targetUserId));

    const whoLikedYou = likedMe
      .filter((l) => !myLikedSet.has(l.userId))
      .map((l) => ({
        userId: l.user.id,
        name: l.user.name,
        profilePhoto: normalizeUploadUrl(l.user.profilePhoto) ?? l.user.profilePhoto,
        likedAt: l.createdAt,
      }));

    return NextResponse.json(whoLikedYou);
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('[study-partner who-liked-you GET]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
