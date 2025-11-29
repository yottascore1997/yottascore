import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const joinExamSchema = z.object({
  examId: z.string()
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

    const { examId } = validatedFields.data;

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

    // Check if user has already joined
    const existingParticipant = await prisma.liveExamParticipant.findUnique({
      where: {
        examId_userId: {
          examId: examId,
          userId: decoded.userId
        }
      }
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Already joined this exam' },
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
        // Deduct entry fee
        await tx.user.update({
          where: { id: decoded.userId },
          data: { wallet: { decrement: exam.entryFee } }
        });

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