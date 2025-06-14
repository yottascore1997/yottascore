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

    // Check if user is a participant
    const participant = await prisma.liveExamParticipant.findUnique({
      where: {
        examId_userId: {
          examId,
          userId: decoded.userId
        }
      },
      include: {
        exam: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant in this exam' },
        { status: 403 }
      );
    }

    // Check if exam is live
    if (!participant.exam.isLive) {
      return NextResponse.json(
        { error: 'This exam is not live yet' },
        { status: 400 }
      );
    }

    return NextResponse.json({ participant });
  } catch (error) {
    console.error('Error checking participant status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 