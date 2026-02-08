import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const participant = await prisma.liveExamParticipant.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true } },
        exam: { select: { title: true, category: true } },
      },
    });

    if (!participant || !participant.completedAt) {
      return NextResponse.json(
        { valid: false, error: 'Certificate not found or invalid' },
        { status: 404 }
      );
    }

    const totalParticipants = await prisma.liveExamParticipant.count({
      where: { examId: participant.examId, completedAt: { not: null } },
    });
    const allCompleted = await prisma.liveExamParticipant.findMany({
      where: { examId: participant.examId, completedAt: { not: null } },
      orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
      select: { userId: true },
    });
    const rank =
      allCompleted.findIndex((p) => p.userId === participant.userId) + 1 || 0;

    return NextResponse.json({
      valid: true,
      userName: participant.user.name || 'Student',
      examTitle: participant.exam.title,
      category: participant.exam.category,
      completedAt: participant.completedAt.toISOString(),
      score: participant.score ?? 0,
      rank,
      totalParticipants,
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
