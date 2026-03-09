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

/** GET - Get current user's study partner profile (or create empty) */
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

    let profile = await prisma.studyPartnerProfile.findUnique({
      where: { userId: decoded.userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { name: true, profilePhoto: true, emailVerified: true, phoneNumber: true },
    });

    if (!profile) {
      profile = await prisma.studyPartnerProfile.create({
        data: { userId: decoded.userId, isActive: true },
      });
    }

    const photos = (profile.photos as string[]) || [];
    const age = ageFromDateOfBirth(profile.dateOfBirth);
    return NextResponse.json({
      ...profile,
      subjects: (profile.subjects as string[]) || [],
      photos: photos.map((u) => normalizeUploadUrl(u) || u),
      age,
      user: {
        name: user?.name,
        profilePhoto: normalizeUploadUrl(user?.profilePhoto) ?? user?.profilePhoto,
        emailVerified: !!user?.emailVerified,
        hasPhone: !!user?.phoneNumber,
      },
    });
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('[study-partner profile GET]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/** PATCH - Update study partner profile */
export async function PATCH(req: NextRequest) {
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
    const { bio, subjects, photos, examType, goals, studyTimeFrom, studyTimeTo, studyTimeSlot, gender, dateOfBirth, language, city, isActive } = body;

    const normalizedPhotos = (() => {
      if (!Array.isArray(photos) || photos.length === 0) return null;
      const filtered = (photos as (string | null)[]).filter((u): u is string => typeof u === 'string' && u.trim() !== '');
      return filtered.length > 0 ? filtered.slice(0, 4) : null;
    })();

    const dob = dateOfBirth ? new Date(dateOfBirth) : null;
    const dobValid = dob && !isNaN(dob.getTime()) ? dob : null;

    const profile = await prisma.studyPartnerProfile.upsert({
      where: { userId: decoded.userId },
      create: {
        userId: decoded.userId,
        bio: bio ?? null,
        subjects: Array.isArray(subjects) ? subjects : null,
        photos: normalizedPhotos,
        examType: examType ?? null,
        goals: goals ?? null,
        studyTimeFrom: studyTimeFrom ?? null,
        studyTimeTo: studyTimeTo ?? null,
        studyTimeSlot: studyTimeSlot ?? null,
        gender: gender ?? null,
        dateOfBirth: dobValid,
        language: language ?? null,
        city: city ?? null,
        isActive: isActive !== false,
      },
      update: {
        ...(bio !== undefined && { bio: bio || null }),
        ...(subjects !== undefined && { subjects: Array.isArray(subjects) ? subjects : null }),
        ...(photos !== undefined && { photos: normalizedPhotos }),
        ...(examType !== undefined && { examType: examType || null }),
        ...(goals !== undefined && { goals: goals || null }),
        ...(studyTimeFrom !== undefined && { studyTimeFrom: studyTimeFrom || null }),
        ...(studyTimeTo !== undefined && { studyTimeTo: studyTimeTo || null }),
        ...(studyTimeSlot !== undefined && { studyTimeSlot: studyTimeSlot || null }),
        ...(gender !== undefined && { gender: gender || null }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dobValid }),
        ...(language !== undefined && { language: language || null }),
        ...(city !== undefined && { city: city || null }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });

    const age = ageFromDateOfBirth(profile.dateOfBirth);
    return NextResponse.json({
      ...profile,
      subjects: (profile.subjects as string[]) || [],
      photos: (profile.photos as string[]) || [],
      age,
    });
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('[study-partner profile PATCH]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
