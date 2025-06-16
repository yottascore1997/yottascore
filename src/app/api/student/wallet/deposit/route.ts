import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    // Update wallet balance
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { wallet: { increment: amount } },
      select: { wallet: true }
    });

    // Add transaction record
    await prisma.transaction.create({
      data: {
        userId: decoded.userId,
        amount,
        type: 'DEPOSIT',
        status: 'SUCCESS'
      }
    });

    return NextResponse.json({
      message: 'Deposit successful',
      balance: user.wallet
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 