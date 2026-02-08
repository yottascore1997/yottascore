import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const token = _request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const participant = await prisma.liveExamParticipant.findUnique({
      where: {
        examId_userId: {
          examId: params.examId,
          userId: decoded.userId,
        },
      },
      include: {
        user: { select: { name: true } },
        exam: { select: { title: true, category: true } },
      },
    });

    if (!participant || !participant.completedAt) {
      return NextResponse.json(
        { error: 'Certificate not found or exam not completed' },
        { status: 404 }
      );
    }

    const totalParticipants = await prisma.liveExamParticipant.count({
      where: { examId: params.examId, completedAt: { not: null } },
    });

    const allCompleted = await prisma.liveExamParticipant.findMany({
      where: { examId: params.examId, completedAt: { not: null } },
      orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
      select: { userId: true },
    });
    const rank =
      allCompleted.findIndex((p) => p.userId === decoded.userId) + 1 || 0;

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.yottascore.com');
    const verificationUrl = `${baseUrl}/verify/certificate/${participant.id}`;

    return NextResponse.json({
      userName: participant.user.name || 'Student',
      examTitle: participant.exam.title,
      category: participant.exam.category,
      completedAt: participant.completedAt.toISOString(),
      score: participant.score ?? 0,
      rank,
      totalParticipants,
      verificationId: participant.id,
      verificationUrl,
    });
  } catch (error) {
    console.error('Certificate fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
