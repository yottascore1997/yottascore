import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

export const GET = withCORS(async (req: Request) => {
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

    // Get all live exams (isLive = true)
    const liveExams = await prisma.liveExam.findMany({
      where: {
        isLive: true
      },
      orderBy: {
        startTime: 'asc'
      },
      include: {
        participants: {
          where: { userId: decoded.userId },
          select: { completedAt: true }
        }
      }
    });

    // Add attempted: true/false for each exam
    const examsWithAttempted = liveExams.map(exam => ({
      ...exam,
      attempted: exam.participants.length > 0 && !!exam.participants[0].completedAt
    }));

    return NextResponse.json(examsWithAttempted);
  } catch (error) {
    console.error('Error fetching live exams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 