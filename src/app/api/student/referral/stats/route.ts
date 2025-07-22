import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

export const GET = withCORS(async (req: NextRequest) => {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get user's referral data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        referralCode: true,
        referralCount: true,
        totalReferralEarnings: true,
        referredBy: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get list of users referred by this user
    const referrals = await prisma.referral.findMany({
      where: { referrerId: decoded.userId },
      include: {
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            createdAt: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    // Get referrer info if user was referred by someone
    let referrerInfo = null;
    if (user.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: user.referredBy },
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true
        }
      });
      referrerInfo = referrer;
    }

    return NextResponse.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      totalEarnings: user.totalReferralEarnings,
      referredBy: user.referredBy,
      referrerInfo,
      referrals: referrals.map((ref: any) => ({
        id: ref.referred.id,
        name: ref.referred.name,
        email: ref.referred.email,
        profilePhoto: ref.referred.profilePhoto,
        joinedAt: ref.joinedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}); 