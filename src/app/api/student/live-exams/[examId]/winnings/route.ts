import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { examId: string } }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { examId } = params;
    const exam = await prisma.liveExam.findUnique({
      where: { id: examId },
      select: {
        spots: true,
        entryFee: true
      }
    });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    const totalSpots = exam.spots;
    const entryFee = exam.entryFee;
    const totalPrizePool = totalSpots * entryFee;
    const winningPool = totalPrizePool * 0.9;

    // Prize distribution logic
    const breakdown = [];
    // 1st: 20%
    breakdown.push({ rank: 1, prize: Math.floor(winningPool * 0.20) });
    // 2nd: 15%
    breakdown.push({ rank: 2, prize: Math.floor(winningPool * 0.15) });
    // 3rd: 10%
    breakdown.push({ rank: 3, prize: Math.floor(winningPool * 0.10) });
    // 4th-10th: 25% equally
    const fourthToTenth = Math.floor(winningPool * 0.25 / 7);
    for (let i = 4; i <= 10; i++) {
      breakdown.push({ rank: i, prize: fourthToTenth });
    }
    // 11th-25th: 30% equally
    const eleventhToTwentyFifth = Math.floor(winningPool * 0.30 / 15);
    for (let i = 11; i <= 25; i++) {
      breakdown.push({ rank: i, prize: eleventhToTwentyFifth });
    }
    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Error fetching winnings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 