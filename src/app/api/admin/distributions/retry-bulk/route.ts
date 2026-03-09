import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
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

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const limit = Math.min(parseInt(String(body.limit || 50), 10) || 50, 200);

    let toProcess;
    if (ids.length > 0) {
      toProcess = await prisma.winningsDistribution.findMany({
        where: { id: { in: ids } },
        take: limit
      });
    } else {
      // default: process FAILED or PENDING
      toProcess = await prisma.winningsDistribution.findMany({
        where: { status: { in: ['FAILED', 'PENDING'] } },
        orderBy: { updatedAt: 'asc' },
        take: limit
      });
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    for (const dist of toProcess) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.winningsDistribution.update({
            where: { id: dist.id },
            data: { status: 'PROCESSING', attempts: { increment: 1 }, lastAttemptAt: new Date() }
          });

          const requestId = `distribution:${dist.examId}:${dist.userId}`;
          const existingTx = await tx.transaction.findUnique({ where: { requestId } });
          if (!existingTx) {
            await tx.user.update({
              where: { id: dist.userId },
              data: { wallet: { increment: dist.prizeAmount } }
            });
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
          await tx.liveExamWinner.updateMany({
            where: { examId: dist.examId, userId: dist.userId },
            data: { paid: true }
          });
          await tx.winningsDistribution.update({
            where: { id: dist.id },
            data: { status: 'SUCCESS', lastError: null }
          });
        });
        results.push({ id: dist.id, success: true });
      } catch (e) {
        await prisma.winningsDistribution.update({
          where: { id: dist.id },
          data: { status: 'FAILED', lastError: String(e), lastAttemptAt: new Date() }
        });
        results.push({ id: dist.id, success: false, error: String(e) });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Error in bulk retry:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

