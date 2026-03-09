import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { normalizeUploadUrl } from '@/lib/upload';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/** GET - List of matches */
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

    const matches = await prisma.studyPartnerMatch.findMany({
      where: {
        OR: [{ user1Id: decoded.userId }, { user2Id: decoded.userId }],
        unmatchedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user1: { select: { id: true, name: true, profilePhoto: true } },
        user2: { select: { id: true, name: true, profilePhoto: true } },
      },
    });

    const list = matches.map((m) => {
      const other = m.user1Id === decoded.userId ? m.user2 : m.user1;
      return {
        matchId: m.id,
        otherUser: {
          ...other,
          profilePhoto: normalizeUploadUrl(other.profilePhoto) ?? other.profilePhoto,
        },
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json(list);
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('[study-partner matches GET]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
