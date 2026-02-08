import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/student/certificates
 * Returns all live exams the user has completed, exam-wise (for "My Certificates").
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(authHeader.split(' ')[1]);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const participants = await prisma.liveExamParticipant.findMany({
      where: {
        userId: decoded.userId,
        completedAt: { not: null },
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            category: true,
            duration: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    const certificates = participants.map((p) => ({
      participantId: p.id,
      examId: p.examId,
      examTitle: p.exam.title,
      category: p.exam.category,
      duration: p.exam.duration,
      score: p.score ?? 0,
      completedAt: p.completedAt!.toISOString(),
      certificateUrl: `/student/live-exams/${p.examId}/certificate`,
    }));

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('[CERTIFICATES_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
