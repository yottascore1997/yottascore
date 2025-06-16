import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get user wallet balance
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { wallet: true }
    });

    // Get user transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      balance: user?.wallet ?? 0,
      transactions
    });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 