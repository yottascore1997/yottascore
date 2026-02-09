import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

export const POST = withCORS(async (req: Request) => {
  let requestId: string | undefined;
  let decodedUserId: string | undefined;
  let examIdValue: string | undefined;
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    decodedUserId = decoded.userId;

    const body = await req.json();
    const { amount, examId, description } = body;
    requestId = body.requestId;
    examIdValue = examId;
    
    // Validate required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ message: 'Description is required' }, { status: 400 });
    }

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json({ message: 'requestId is required' }, { status: 400 });
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(
      async (tx) => {
        // Idempotency: if requestId already processed, return existing transaction
        const existing = await tx.transaction.findUnique({
          where: { requestId }
        });

        if (existing) {
          const currentUser = await tx.user.findUnique({
            where: { id: decoded.userId },
            select: { wallet: true }
          });

          return { existingTransaction: existing, currentWallet: currentUser?.wallet ?? null };
        }

        // Deduct amount from wallet
        const walletUpdate = await tx.user.updateMany({
          where: {
            id: decoded.userId,
            wallet: { gte: amount }
          },
          data: { wallet: { decrement: amount } }
        });

        if (walletUpdate.count === 0) {
          throw new Error('INSUFFICIENT_WALLET');
        }

        const updatedUser = await tx.user.findUnique({
          where: { id: decoded.userId },
          select: { wallet: true }
        });

        // Create transaction record with metadata
        const transaction = await tx.transaction.create({
          data: {
            userId: decoded.userId,
            amount: -amount, // Negative amount for deduction
            type: 'DEDUCTION',
            status: 'SUCCESS',
            description: examId ? `${description || 'Wallet deduction'} (Exam: ${examId})` : description || null,
            requestId
          }
        });

        return { updatedUser, transaction };
      },
      {
        timeout: 15000, // allow up to 15 seconds for the transaction block
        maxWait: 5000,  // wait up to 5 seconds to obtain a transaction slot
      }
    );

    if ('existingTransaction' in result && result.existingTransaction) {
      return NextResponse.json({
        message: 'Deduction already processed',
        deductedAmount: amount,
        newBalance: result.currentWallet,
        description: description,
        examId: examId || null,
        transactionId: result.existingTransaction.id,
        requestId
      });
    }

    return NextResponse.json({
      message: 'Deduction successful',
      deductedAmount: amount,
      newBalance: result.updatedUser?.wallet ?? null,
      description: description,
      examId: examId || null,
      transactionId: result.transaction.id,
      requestId
    });

  } catch (error) {
    console.error('Error in wallet deduction:', error);

    if (error instanceof Error && error.message === 'INSUFFICIENT_WALLET') {
      return NextResponse.json({
        message: 'Insufficient wallet balance'
      }, { status: 400 });
    }

    if (error instanceof Error && 'code' in error && error.code === 'P2002' && requestId) {
      const existing = await prisma.transaction.findUnique({
        where: { requestId }
      });

      if (existing && decodedUserId) {
        const user = await prisma.user.findUnique({
          where: { id: decodedUserId },
          select: { wallet: true }
        });

        return NextResponse.json({
          message: 'Deduction already processed',
          deductedAmount: Math.abs(existing.amount),
          newBalance: user?.wallet ?? null,
          description: existing.description,
          examId: examIdValue || null,
          transactionId: existing.id,
          requestId
        });
      }
    }

    if (error instanceof Error && 'code' in error && error.code === 'P2028') {
      return NextResponse.json({
        message: 'Wallet deduction timed out. Please try again in a moment.'
      }, { status: 503 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}); 