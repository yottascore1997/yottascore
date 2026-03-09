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

    const now = new Date();
    // Allow optional single-exam distribution via request body or query param
    let exams = [];
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const requestedExamId = (body && body.examId) || url.searchParams.get('examId');
    if (requestedExamId) {
      const exam = await prisma.liveExam.findUnique({
        where: { id: String(requestedExamId) }
      });
      if (!exam) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
      }
      if (exam.winningsDistributed) {
        return NextResponse.json({ message: 'Winnings already distributed for this exam.' });
      }
      if (exam.endTime && exam.endTime > now) {
        return NextResponse.json({ error: 'Exam has not ended yet' }, { status: 400 });
      }
      exams = [exam];
    } else {
      // Find all exams that have ended and not distributed winnings
      exams = await prisma.liveExam.findMany({
        where: {
          endTime: { lt: now },
          winningsDistributed: false
        }
      });
    }

    let distributedCount = 0;
    // Process each exam in its own DB transaction with a row lock to avoid races
    for (const exam of exams) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Lock the exam row for update to prevent concurrent processing
          // Raw query used because Prisma doesn't expose SELECT ... FOR UPDATE directly
          const locked = await tx.$queryRawUnsafe(
            `SELECT id, winningsDistributed FROM LiveExam WHERE id = ? FOR UPDATE`,
            exam.id
          );
          // locked may be an array result depending on driver
          const lockedRow = Array.isArray(locked) ? locked[0] : locked;
          if (!lockedRow) {
            return { skipped: true, reason: 'exam-not-found' };
          }
          if (lockedRow.winningsDistributed) {
            return { skipped: true, reason: 'already-distributed' };
          }

          // Fetch participants (deterministic order)
          const participants = await tx.liveExamParticipant.findMany({
            where: { examId: exam.id, completedAt: { not: null } },
            orderBy: [
              { score: 'desc' },
              { completedAt: 'asc' }
            ],
            take: 25
          });

          // Calculate prizes
          const totalPrizePool = (exam.spots ?? 0) * (exam.entryFee ?? 0);
          const winningPool = Math.floor(totalPrizePool * 0.9);
          const prizes: number[] = [];
          prizes[1] = Math.floor(winningPool * 0.20);
          prizes[2] = Math.floor(winningPool * 0.15);
          prizes[3] = Math.floor(winningPool * 0.10);
          const fourthToTenth = Math.floor(winningPool * 0.25 / 7);
          for (let i = 4; i <= 10; i++) prizes[i] = fourthToTenth;
          const eleventhToTwentyFifth = Math.floor(winningPool * 0.30 / 15);
          for (let i = 11; i <= 25; i++) prizes[i] = eleventhToTwentyFifth;

          // Enqueue distribution audit rows instead of performing payouts here.
          // This creates deterministic WinningsDistribution rows (idempotent)
          for (let i = 0; i < participants.length; i++) {
            const p = participants[i];
            const rank = i + 1;
            const prize = prizes[rank] || 0;
            if (prize <= 0) continue;

            // Skip if already created (idempotency)
            const existingDist = await tx.winningsDistribution.findFirst({
              where: { examId: exam.id, userId: p.userId }
            });
            if (existingDist) continue;

            // Create a LiveExamWinner record (paid will be false until processed)
            await tx.liveExamWinner.create({
              data: {
                examId: exam.id,
                userId: p.userId,
                rank,
                prizeAmount: prize,
                paid: false
              }
            });

            // Create distribution audit row
            await tx.winningsDistribution.create({
              data: {
                examId: exam.id,
                userId: p.userId,
                rank,
                prizeAmount: prize,
                status: 'PENDING'
              }
            });
          }

          // Mark exam as queued for distribution
          await tx.liveExam.update({
            where: { id: exam.id },
            data: { winningsDistributed: true }
          });

          return { skipped: false };
        });

        if (result && !result.skipped) distributedCount++;
      } catch (ex) {
        // Log and continue with other exams; do not mark as distributed on failure
        console.error(`Failed to distribute for exam ${exam.id}:`, ex);
      }
    }
    return NextResponse.json({ message: `Winnings distributed for ${distributedCount} exams.` });
  } catch (error) {
    console.error('Error distributing winnings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 