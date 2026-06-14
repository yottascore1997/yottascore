import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { normalizeUploadUrl } from '@/lib/upload'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function ageFromDateOfBirth(dateOfBirth: Date | string | null): number | null {
  if (!dateOfBirth) return null
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
  if (isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age >= 0 ? age : null
}

type DiscoveryRow = {
  id: string
  userId: string
  bio: string | null
  subjects: unknown
  photos: unknown
  examType: string | null
  goals: string | null
  studyTimeFrom: string | null
  studyTimeTo: string | null
  studyTimeSlot: string | null
  gender: string | null
  dateOfBirth: Date | null
  language: string | null
  city: string | null
  userName: string | null
  userProfilePhoto: string | null
  emailVerified: Date | null
}

/** GET - Discovery feed (optimized SQL, excludes liked/passed/blocked) */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as {
      userId: string
      role: string
    }
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const language = searchParams.get('language') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 30)
    const userId = decoded.userId

    const languageFilter = language
      ? Prisma.sql`AND p.language = ${language}`
      : Prisma.empty

    const rows = await prisma.$queryRaw<DiscoveryRow[]>`
      SELECT
        p.id,
        p.userId,
        p.bio,
        p.subjects,
        p.photos,
        p.examType,
        p.goals,
        p.studyTimeFrom,
        p.studyTimeTo,
        p.studyTimeSlot,
        p.gender,
        p.dateOfBirth,
        p.language,
        p.city,
        u.name AS userName,
        u.profilePhoto AS userProfilePhoto,
        u.emailVerified
      FROM StudyPartnerProfile p
      INNER JOIN users u ON u.id = p.userId
      WHERE p.isActive = true
        AND p.userId != ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM StudyPartnerLike l
          WHERE l.userId = ${userId} AND l.targetUserId = p.userId
        )
        AND NOT EXISTS (
          SELECT 1 FROM UserBlock b
          WHERE (b.blockerId = ${userId} AND b.blockedId = p.userId)
             OR (b.blockerId = p.userId AND b.blockedId = ${userId})
        )
        ${languageFilter}
      ORDER BY p.updatedAt DESC
      LIMIT ${limit}
    `

    const list = rows.map((p) => {
      const photos = Array.isArray(p.photos) ? (p.photos as string[]) : []
      const primaryPhoto = photos[0] || p.userProfilePhoto
      const age = ageFromDateOfBirth(p.dateOfBirth)
      const subjects = Array.isArray(p.subjects) ? (p.subjects as string[]) : []

      return {
        id: p.id,
        userId: p.userId,
        bio: p.bio,
        subjects,
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
        name: p.userName,
        profilePhoto: normalizeUploadUrl(primaryPhoto) || primaryPhoto,
        verified: !!p.emailVerified,
      }
    })

    const response = NextResponse.json(list)
    response.headers.set('Cache-Control', 'private, max-age=15')
    return response
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
