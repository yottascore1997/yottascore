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

    const { amount } = await req.json();
    
    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    // Check minimum withdrawal amount
    if (amount < 100) {
      return NextResponse.json({ 
        message: 'Minimum withdrawal amount is ₹100' 
      }, { status: 400 });
    }

    // Get user's current wallet balance and KYC status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        wallet: true,
        kycStatus: true
      }
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

    // Check KYC status for withdrawals above ₹1000
    if (amount > 1000 && user.kycStatus !== 'VERIFIED') {
      return NextResponse.json({ 
        message: 'KYC verification required for withdrawals above ₹1000. Please complete your KYC first.',
        kycStatus: user.kycStatus
      }, { status: 400 });
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Deduct amount from wallet
      const updatedUser = await tx.user.update({
        where: { id: decoded.userId },
        data: { wallet: { decrement: amount } },
        select: { wallet: true }
      });

      // Create withdrawal transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: decoded.userId,
          amount: -amount, // Negative amount for withdrawal
          type: 'WITHDRAWAL',
          status: 'PENDING', // Start with pending status
          description: `Withdrawal request of ₹${amount.toFixed(2)}`
        }
      });

      return { updatedUser, transaction };
    });

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawalAmount: amount,
      newBalance: result.updatedUser.wallet,
      transactionId: result.transaction.id,
      status: 'PENDING'
    });

  } catch (error) {
    console.error('Error in wallet withdrawal:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
});
