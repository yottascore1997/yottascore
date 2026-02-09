import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const joinExamSchema = z.object({
  examId: z.string(),
  requestId: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);
    
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validatedFields = joinExamSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Invalid fields', details: validatedFields.error.errors },
        { status: 400 }
      );
    }

    const { examId, requestId } = validatedFields.data;

    // Get exam details
    const exam = await prisma.liveExam.findUnique({
      where: { id: examId }
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    if (!exam.isLive) {
      return NextResponse.json(
        { error: 'Exam is not live yet' },
        { status: 400 }
      );
    }

    if (exam.spotsLeft <= 0) {
      return NextResponse.json(
        { error: 'No spots available' },
        { status: 400 }
      );
    }

    // Get user's wallet balance
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { wallet: true }
    });

    if (!user || user.wallet < exam.entryFee) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 }
      );
    }

    // Start a transaction to:
    // 1. Deduct entry fee from user's wallet
    // 2. Add user as participant
    // 3. Update spots left
    const result = await prisma.$transaction(
      async (tx) => {
        // Idempotency: if already joined, return existing participant
        const existingParticipant = await tx.liveExamParticipant.findUnique({
          where: {
            examId_userId: {
              examId: examId,
              userId: decoded.userId
            }
          }
        });

        if (existingParticipant) {
          return existingParticipant;
        }

        if (requestId) {
          const existingPayment = await tx.transaction.findUnique({
            where: { requestId }
          });

          if (!existingPayment) {
            throw new Error('PAYMENT_NOT_FOUND');
          }

          if (existingPayment.userId !== decoded.userId) {
            throw new Error('PAYMENT_USER_MISMATCH');
          }

          if (Math.abs(existingPayment.amount) !== exam.entryFee) {
            throw new Error('PAYMENT_AMOUNT_MISMATCH');
          }
        } else {
          // Deduct entry fee only if wallet has enough balance
          const walletUpdate = await tx.user.updateMany({
            where: {
              id: decoded.userId,
              wallet: { gte: exam.entryFee }
            },
            data: { wallet: { decrement: exam.entryFee } }
          });

          if (walletUpdate.count === 0) {
            throw new Error('INSUFFICIENT_WALLET');
          }

          // Create transaction record
          await tx.transaction.create({
            data: {
              userId: decoded.userId,
              amount: -exam.entryFee,
              type: 'EXAM_ENTRY',
              status: 'COMPLETED',
              description: `Joined live exam ${exam.title || examId}`
            }
          });
        }

        // Add participant
        const participant = await tx.liveExamParticipant.create({
          data: {
            examId,
            userId: decoded.userId,
            paid: true
          }
        });

        // Update spots left and collections
        await tx.liveExam.update({
          where: { id: examId },
          data: {
            spotsLeft: { decrement: 1 },
            totalCollection: { increment: exam.entryFee }
          }
        });

        return participant;
      },
      {
        timeout: 15000,
        maxWait: 5000,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error joining exam:', error);

    if (error instanceof Error && error.message === 'INSUFFICIENT_WALLET') {
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'PAYMENT_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Payment not found for this requestId' },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'PAYMENT_USER_MISMATCH') {
      return NextResponse.json(
        { error: 'Payment does not belong to this user' },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'PAYMENT_AMOUNT_MISMATCH') {
      return NextResponse.json(
        { error: 'Payment amount does not match exam entry fee' },
        { status: 400 }
      );
    }

    if (error instanceof Error && 'code' in error && error.code === 'P2028') {
      return NextResponse.json(
        { error: 'Exam join timed out. Please retry in a moment.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 