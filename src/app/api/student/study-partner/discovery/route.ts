import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { normalizeUploadUrl } from '@/lib/upload';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function ageFromDateOfBirth(dateOfBirth: Date | string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

/** GET - Discovery feed: users with study partner profile, not blocked, not already liked/passed. Optional filters. */
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

    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const myActions = await prisma.studyPartnerLike.findMany({
      where: { userId: decoded.userId },
      select: { targetUserId: true },
    });
    const excludedIds = new Set([decoded.userId, ...myActions.map((a) => a.targetUserId)]);

    const blockedMe = await prisma.userBlock.findMany({
      where: { blockedId: decoded.userId },
      select: { blockerId: true },
    });
    blockedMe.forEach((b) => excludedIds.add(b.blockerId));
    const blockedByMe = await prisma.userBlock.findMany({
      where: { blockerId: decoded.userId },
      select: { blockedId: true },
    });
    blockedByMe.forEach((b) => excludedIds.add(b.blockedId));

    const where: any = {
      userId: { notIn: Array.from(excludedIds) },
      isActive: true,
    };
    if (language) where.language = language;

    const profiles = await prisma.studyPartnerProfile.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, profilePhoto: true, emailVerified: true },
        },
      },
    });

    const list = profiles.map((p) => {
      const photos = (p.photos as string[]) || [];
      const primaryPhoto = photos[0] || p.user.profilePhoto;
      const age = ageFromDateOfBirth(p.dateOfBirth);
      return {
        id: p.id,
        userId: p.userId,
        bio: p.bio,
        subjects: (p.subjects as string[]) || [],
        photos: photos.map((u) => normalizeUploadUrl(u) || u),
        examType: p.examType,
        goals: p.goals,
        studyTimeFrom: p.studyTimeFrom,
        studyTimeTo: p.studyTimeTo,
        studyTimeSlot: p.studyTimeSlot,
        gender: p.gender,
        age,
        language: p.language,
        city: p.city,
        name: p.user.name,
        profilePhoto: normalizeUploadUrl(primaryPhoto) || primaryPhoto,
        verified: !!p.user.emailVerified,
      };
    });

    return NextResponse.json(list);
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('[study-partner discovery GET]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
