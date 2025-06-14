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
    const attempt = await prisma.liveExamParticipant.findUnique({
      where: {
        examId_userId: {
          examId,
          userId: decoded.userId
        }
      },
      select: {
        score: true,
        completedAt: true,
        answers: true
      }
    });
    return NextResponse.json(attempt);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 