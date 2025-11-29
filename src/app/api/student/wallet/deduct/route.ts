import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

export const POST = withCORS(async (req: Request) => {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { amount, examId, description } = await req.json();
    
    // Validate required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ message: 'Description is required' }, { status: 400 });
    }

    // Get user's current wallet balance
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { wallet: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user has sufficient balance
    if (user.wallet < amount) {
      return NextResponse.json({ 
        message: 'Insufficient wallet balance',
        currentBalance: user.wallet,
        requiredAmount: amount
      }, { status: 400 });
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(
      async (tx) => {
        // Deduct amount from wallet
        const updatedUser = await tx.user.update({
          where: { id: decoded.userId },
          data: { wallet: { decrement: amount } },
          select: { wallet: true }
        });

        // Create transaction record with metadata
        const transaction = await tx.transaction.create({
          data: {
            userId: decoded.userId,
            amount: -amount, // Negative amount for deduction
            type: 'DEDUCTION',
            status: 'SUCCESS',
            description: examId ? `${description || 'Wallet deduction'} (Exam: ${examId})` : description || null
          }
        });

        return { updatedUser, transaction };
      },
      {
        timeout: 15000, // allow up to 15 seconds for the transaction block
        maxWait: 5000,  // wait up to 5 seconds to obtain a transaction slot
      }
    );

    return NextResponse.json({
      message: 'Deduction successful',
      deductedAmount: amount,
      newBalance: result.updatedUser.wallet,
      description: description,
      examId: examId || null,
      transactionId: result.transaction.id
    });

  } catch (error) {
    console.error('Error in wallet deduction:', error);

    if (error instanceof Error && 'code' in error && error.code === 'P2028') {
      return NextResponse.json({
        message: 'Wallet deduction timed out. Please try again in a moment.'
      }, { status: 503 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}); 