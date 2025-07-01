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

    // Check if user already has a referral code
    const existingUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { referralCode: true }
    });

    if (existingUser?.referralCode) {
      return NextResponse.json({ 
        message: 'Referral code already exists',
        referralCode: existingUser.referralCode 
      });
    }

    // Generate unique referral code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let referralCode;
    let isUnique = false;
    
    while (!isUnique) {
      referralCode = generateCode();
      const existing = await prisma.user.findUnique({
        where: { referralCode }
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // Update user with referral code
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { referralCode }
    });

    return NextResponse.json({ 
      message: 'Referral code generated successfully',
      referralCode 
    });

  } catch (error) {
    console.error('Error generating referral code:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}); 