import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { examId: string } }) {
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
    const { examId } = params;
    const exam = await prisma.liveExam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        duration: true,
        spots: true,
        spotsLeft: true,
        entryFee: true,
        prizePool: true,
        isLive: true,
      },
    });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error fetching exam details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 