import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/** GET - Hub stats in one request (profile snippet + counts) */
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

    const userId = decoded.userId

    const [profile, matchesCount, likedMeRows] = await Promise.all([
      prisma.studyPartnerProfile.findUnique({
        where: { userId },
        select: { bio: true },
      }),
      prisma.studyPartnerMatch.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          unmatchedAt: null,
        },
      }),
      prisma.studyPartnerLike.findMany({
        where: { targetUserId: userId, action: 'like' },
        select: { userId: true },
      }),
    ])

    let whoLikedCount = 0
    const likedMeIds = likedMeRows.map((r) => r.userId)
    if (likedMeIds.length > 0) {
      const alreadyLikedBack = await prisma.studyPartnerLike.count({
        where: {
          userId,
          action: 'like',
          targetUserId: { in: likedMeIds },
        },
      })
      whoLikedCount = likedMeIds.length - alreadyLikedBack
    }

    return NextResponse.json({
      profile: profile ?? { bio: null },
      matchesCount,
      whoLikedCount,
    })
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
