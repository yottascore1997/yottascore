import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get overall referral statistics
    const totalReferrals = await prisma.referral.count();
    const totalReferralEarnings = await prisma.user.aggregate({
      _sum: { totalReferralEarnings: true }
    });

    // Get top referrers
    const topReferrers = await prisma.user.findMany({
      where: {
        referralCount: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        referralCode: true,
        referralCount: true,
        totalReferralEarnings: true,
        createdAt: true
      },
      orderBy: { referralCount: 'desc' },
      take: 20
    });

    // Get recent referrals
    const recentReferrals = await prisma.referral.findMany({
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        },
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' },
      take: 50
    });

    // Get users with referral codes but no referrals
    const usersWithCodes = await prisma.user.findMany({
      where: {
        referralCode: { not: null },
        referralCount: 0
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        referralCode: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      statistics: {
        totalReferrals,
        totalReferralEarnings: totalReferralEarnings._sum.totalReferralEarnings || 0,
        totalReferralBonus: totalReferrals * 100 // ₹100 per referral
      },
      topReferrers,
      recentReferrals: recentReferrals.map(ref => ({
        id: ref.id,
        code: ref.code,
        joinedAt: ref.joinedAt,
        referrer: ref.referrer,
        referred: ref.referred
      })),
      usersWithCodes
    });

  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 