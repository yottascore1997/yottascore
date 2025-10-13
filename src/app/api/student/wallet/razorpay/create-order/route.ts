import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

    const { amount, currency = 'INR' } = await req.json();
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    // Minimum amount validation (₹1)
    if (amount < 1) {
      return NextResponse.json({ message: 'Minimum amount is ₹1' }, { status: 400 });
    }

    // Maximum amount validation (₹1,00,000)
    if (amount > 100000) {
      return NextResponse.json({ message: 'Maximum amount is ₹1,00,000' }, { status: 400 });
    }

    const options = {
      amount: amount, // Frontend sends amount in paise
      currency: currency,
      receipt: `wallet_deposit_${decoded.userId}_${Date.now()}`,
      notes: {
        userId: decoded.userId,
        type: 'wallet_deposit'
      }
    };

    const order = await razorpay.orders.create(options);

    // Store pending transaction in database
    await prisma.transaction.create({
      data: {
        userId: decoded.userId,
        amount: amount / 100, // Convert paise to rupees for storage
        type: 'DEPOSIT',
        status: 'PENDING',
        razorpayOrderId: order.id,
        description: 'Wallet Deposit via Razorpay'
      }
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json({ 
      message: 'Failed to create payment order',
      error: error.message 
    }, { status: 500 });
  }
}
