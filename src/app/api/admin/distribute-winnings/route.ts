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
    // Find all exams that have ended and not distributed winnings
    const exams = await prisma.liveExam.findMany({
      where: {
        endTime: { lt: now },
        winningsDistributed: false
      }
    });

    let distributedCount = 0;
    for (const exam of exams) {
      // Get all participants, sorted by score desc, completedAt asc
      const participants = await prisma.liveExamParticipant.findMany({
        where: { examId: exam.id, completedAt: { not: null } },
        orderBy: [
          { score: 'desc' },
          { completedAt: 'asc' }
        ]
      });
      // Calculate winnings as per your logic
      const totalPrizePool = exam.spots * exam.entryFee;
      const winningPool = totalPrizePool * 0.9;
      const prizes = [];
      prizes[1] = Math.floor(winningPool * 0.20);
      prizes[2] = Math.floor(winningPool * 0.15);
      prizes[3] = Math.floor(winningPool * 0.10);
      const fourthToTenth = Math.floor(winningPool * 0.25 / 7);
      for (let i = 4; i <= 10; i++) prizes[i] = fourthToTenth;
      const eleventhToTwentyFifth = Math.floor(winningPool * 0.30 / 15);
      for (let i = 11; i <= 25; i++) prizes[i] = eleventhToTwentyFifth;

      // Distribute winnings to top 25 participants
      for (let i = 0; i < Math.min(25, participants.length); i++) {
        const p = participants[i];
        const prize = prizes[i + 1] || 0;
        if (prize > 0) {
          // Update wallet
          await prisma.user.update({
            where: { id: p.userId },
            data: { wallet: { increment: prize } }
          });
          // Create transaction record
          await prisma.transaction.create({
            data: {
              userId: p.userId,
              amount: prize,
              type: 'EXAM_WIN',
              status: 'COMPLETED'
            }
          });
        }
      }
      // Mark exam as winnings distributed
      await prisma.liveExam.update({
        where: { id: exam.id },
        data: { winningsDistributed: true }
      });
      distributedCount++;
    }
    return NextResponse.json({ message: `Winnings distributed for ${distributedCount} exams.` });
  } catch (error) {
    console.error('Error distributing winnings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 