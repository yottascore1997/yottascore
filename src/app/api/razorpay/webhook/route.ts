import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ message: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle payment captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      // Find the transaction
      const transaction = await prisma.transaction.findFirst({
        where: {
          razorpayOrderId: orderId,
          status: 'PENDING'
        }
      });

      if (transaction) {
        // Update transaction status
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'SUCCESS',
            razorpayPaymentId: payment.id,
            razorpaySignature: payment.signature
          }
        });

        // Add amount to user wallet
        await prisma.user.update({
          where: { id: transaction.userId },
          data: { wallet: { increment: transaction.amount } }
        });
      }
    }

    // Handle payment failed event
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      // Find and update the transaction
      const transaction = await prisma.transaction.findFirst({
        where: {
          razorpayOrderId: orderId,
          status: 'PENDING'
        }
      });

      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            razorpayPaymentId: payment.id
          }
        });
      }
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ 
      message: 'Webhook processing failed',
      error: error.message 
    }, { status: 500 });
  }
}
