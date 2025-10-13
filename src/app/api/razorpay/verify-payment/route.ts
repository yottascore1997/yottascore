import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ message: 'Missing payment details' }, { status: 400 });
    }

    // Verify the payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json({ message: 'Invalid payment signature' }, { status: 400 });
    }

    // Find the pending transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: decoded.userId,
        razorpayOrderId: razorpay_order_id,
        status: 'PENDING'
      }
    });

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Update transaction status and add to wallet
    const result = await prisma.$transaction(async (tx) => {
      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        }
      });

      // Add amount to user wallet
      const user = await tx.user.update({
        where: { id: decoded.userId },
        data: { wallet: { increment: transaction.amount } },
        select: { wallet: true }
      });

      return { updatedTransaction, user };
    });

    return NextResponse.json({
      success: true,                    // Frontend expects 'success' field
      message: 'Payment verified and wallet updated successfully',
      wallet_balance: result.user.wallet,  // Frontend expects 'wallet_balance'
      transactionId: result.updatedTransaction.id
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      message: 'Payment verification failed',
      error: error.message 
    }, { status: 500 });
  }
}
