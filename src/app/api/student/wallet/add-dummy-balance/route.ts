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

    // Find or create wallet for the user
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId, balance: 0 } });
    }

    // Add 1000 to balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: 1000 } },
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

    return NextResponse.json({ message: '₹1000 added to your wallet!', balance: updatedWallet.balance });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to add dummy balance' }, { status: 500 });
  }
} 