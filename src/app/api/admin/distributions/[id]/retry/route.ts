import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const dist = await prisma.winningsDistribution.findUnique({ where: { id } });
    if (!dist) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (dist.status === 'SUCCESS') return NextResponse.json({ message: 'Already processed' });

    // Process single distribution attempt atomically
    try {
      await prisma.$transaction(async (tx) => {
        // Mark processing
        await tx.winningsDistribution.update({
          where: { id },
          data: { status: 'PROCESSING', attempts: { increment: 1 }, lastAttemptAt: new Date() }
        });

        const requestId = `distribution:${dist.examId}:${dist.userId}`;

        // Idempotency: check existing transaction
        const existingTx = await tx.transaction.findUnique({ where: { requestId } });
        if (!existingTx) {
          // Credit wallet
          await tx.user.update({
            where: { id: dist.userId },
            data: { wallet: { increment: dist.prizeAmount } }
          });
          // Create transaction record
          await tx.transaction.create({
            data: {
              userId: dist.userId,
              amount: dist.prizeAmount,
              type: 'EXAM_WIN',
              status: 'COMPLETED',
              requestId
            }
          });
        }

        // Mark LiveExamWinner paid
        await tx.liveExamWinner.updateMany({
          where: { examId: dist.examId, userId: dist.userId },
          data: { paid: true }
        });

        // Mark distribution success
        await tx.winningsDistribution.update({
          where: { id },
          data: { status: 'SUCCESS', lastError: null }
        });
      });
      return NextResponse.json({ message: 'Processed' });
    } catch (procErr) {
      // Update failed status
      await prisma.winningsDistribution.update({
        where: { id },
        data: { status: 'FAILED', lastError: String(procErr), lastAttemptAt: new Date() }
      });
      console.error(`Error processing distribution ${id}:`, procErr);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('Error in retry endpoint:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

