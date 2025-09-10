import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

export const POST = withCORS(async (req: NextRequest) => {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { referralCode } = await req.json();

    if (!referralCode) {
      return NextResponse.json({ message: 'Referral code is required' }, { status: 400 });
    }

    // Check if user already has a referrer
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { referredBy: true }
    });

    if (currentUser?.referredBy) {
      return NextResponse.json({ 
        message: 'You have already used a referral code' 
      }, { status: 400 });
    }

    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true, name: true }
    });

    if (!referrer) {
      return NextResponse.json({ 
        message: 'Invalid referral code' 
      }, { status: 400 });
    }

    // Prevent self-referral
    if (referrer.id === decoded.userId) {
      return NextResponse.json({ 
        message: 'Cannot use your own referral code' 
      }, { status: 400 });
    }

    // Check if referral already exists
    const existingReferral = await prisma.referral.findFirst({
      where: {
        OR: [
          { referrerId: referrer.id, referredId: decoded.userId },
          { referrerId: decoded.userId, referredId: referrer.id }
        ]
      }
    });

    if (existingReferral) {
      return NextResponse.json({ 
        message: 'Referral relationship already exists' 
      }, { status: 400 });
    }

    // Process the referral using transaction
    await prisma.$transaction(async (tx: any) => {
      // Update current user with referral info
      await tx.user.update({
        where: { id: decoded.userId },
        data: { referredBy: referralCode }
      });

      // Create referral record
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: decoded.userId,
          code: referralCode
        }
      });

      // Update referrer's stats and wallet
      await tx.user.update({
        where: { id: referrer.id },
        data: {
          referralCount: { increment: 1 },
          totalReferralEarnings: { increment: 50 },
          wallet: { increment: 50 }
        }
      });

      // Update referred user's wallet
      await tx.user.update({
        where: { id: decoded.userId },
        data: {
          wallet: { increment: 50 }
        }
      });

      // Create transaction record for referrer
      await tx.transaction.create({
        data: {
          userId: referrer.id,
          amount: 50,
          type: 'REFERRAL_BONUS',
          status: 'COMPLETED'
        }
      });

      // Create transaction record for referred user
      await tx.transaction.create({
        data: {
          userId: decoded.userId,
          amount: 50,
          type: 'REFERRAL_BONUS',
          status: 'COMPLETED'
        }
      });
    });

    return NextResponse.json({ 
      message: 'Referral code applied successfully! Both you and your friend earned ₹50 each.',
      referrerName: referrer.name
    });

  } catch (error) {
    console.error('Error applying referral code:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}); 