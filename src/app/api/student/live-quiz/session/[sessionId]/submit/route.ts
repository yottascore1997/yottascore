import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const ACTIVE_WINDOW_MS = 45_000;
const TOP_LEADERBOARD_COUNT = 6;

/** POST: Submit answer for a question; returns updated leaderboard (top 6) + myRank */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(authHeader.split(' ')[1]);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decoded.userId;

    const { sessionId } = await params;
    const body = await req.json().catch(() => ({}));
    const questionIndex = body.questionIndex as number | undefined;
    const answerIndex = body.answerIndex as number | undefined;
    const timeSpentMs = typeof body.timeSpentMs === 'number' ? body.timeSpentMs : 0;

    if (typeof questionIndex !== 'number' || questionIndex < 0) {
      return NextResponse.json(
        { error: 'questionIndex required (number)' },
        { status: 400 }
      );
    }

    const session = await prisma.liveQuizSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.status === 'FINISHED') {
      return NextResponse.json(
        { error: 'Quiz has ended' },
        { status: 400 }
      );
    }

    const questionIds = (session.questionIds as string[]) || [];
    if (questionIndex >= questionIds.length) {
      return NextResponse.json(
        { error: 'Invalid question index' },
        { status: 400 }
      );
    }

    const questionId = questionIds[questionIndex];
    const question = await prisma.questionBankItem.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const correctIndex = question.correct ?? 0;
    const isCorrect =
      typeof answerIndex === 'number' && answerIndex >= 0 && answerIndex === correctIndex;
    const points = isCorrect ? 1 : 0;

    const participant = await prisma.liveQuizSessionParticipant.findUnique({
      where: {
        sessionId_userId: { sessionId, userId },
      },
    });
    if (!participant) {
      return NextResponse.json({ error: 'Not in this session' }, { status: 403 });
    }

    const answers = (participant.answers as Array<{ questionIndex: number }>) || [];
    if (answers.some((a) => a.questionIndex === questionIndex)) {
      return NextResponse.json(
        { error: 'Already answered this question' },
        { status: 400 }
      );
    }

    const newAnswers = [
      ...answers,
      {
        questionIndex,
        selectedOption: answerIndex,
        isCorrect,
        timeSpentMs,
      },
    ];

    await prisma.liveQuizSessionParticipant.update({
      where: {
        sessionId_userId: { sessionId, userId },
      },
      data: {
        score: participant.score + points,
        correctCount: participant.correctCount + (isCorrect ? 1 : 0),
        wrongCount: participant.wrongCount + (isCorrect ? 0 : 1),
        totalTimeMs: participant.totalTimeMs + timeSpentMs,
        answers: newAnswers as unknown as object,
        lastSeenAt: new Date(),
      },
    });

    const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const participants = await prisma.liveQuizSessionParticipant.findMany({
      where: { sessionId, status: 'PLAYING', lastSeenAt: { gte: activeSince } },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ score: 'desc' }, { correctCount: 'desc' }, { totalTimeMs: 'asc' }],
    });
    const leaderboard = participants.map((p, i) => ({
      rank: i + 1,
      userId: p.userId,
      name: p.user.name || 'Unknown',
      correctCount: p.correctCount,
      wrongCount: p.wrongCount,
      score: p.score,
      totalTimeMs: p.totalTimeMs,
    }));

    const topLeaderboard = leaderboard.slice(0, TOP_LEADERBOARD_COUNT);
    const myEntry = leaderboard.find((e) => e.userId === userId) ?? null;
    const myRank = myEntry ? myEntry.rank : 0;

    return NextResponse.json({
      isCorrect,
      leaderboard: topLeaderboard,
      playingCount: participants.length,
      myRank,
      myEntry,
    });
  } catch (e) {
    console.error('Live quiz submit error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
