import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    // Get token from headers (adjust if you use cookies)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Update user's wallet balance
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { wallet: { increment: 1000 } },
    });

    // Optionally, add a transaction record
    await prisma.transaction.create({
      data: {
        userId,
        amount: 1000,
        type: 'DEPOSIT',
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({ message: '₹1000 added to your wallet!', balance: updatedUser.wallet });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to add dummy balance' }, { status: 500 });
  }
} 