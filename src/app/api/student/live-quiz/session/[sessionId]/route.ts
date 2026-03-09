import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const ACTIVE_WINDOW_MS = 45_000;
const TOP_LEADERBOARD_COUNT = 6;

/** GET: Session state, current question, leaderboard (top 6), playing count, myRank */
export async function GET(
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
    const session = await prisma.liveQuizSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Keep participant "active" while they are on this page
    if (userId) {
      await prisma.liveQuizSessionParticipant.upsert({
        where: { sessionId_userId: { sessionId, userId } },
        create: {
          sessionId,
          userId,
          status: 'PLAYING',
          lastSeenAt: new Date(),
        },
        update: {
          status: 'PLAYING',
          lastSeenAt: new Date(),
        },
      });
    }

    const questionIds = (session.questionIds as string[]) || [];
    const currentIndex = session.currentQuestionIndex;
    let currentQuestion = null;
    if (questionIds.length > 0 && currentIndex < questionIds.length) {
      const q = await prisma.questionBankItem.findUnique({
        where: { id: questionIds[currentIndex] },
      });
      if (q) {
        currentQuestion = {
          id: q.id,
          text: q.text,
          options: (q.options as string[]) || [],
          correct: q.correct ?? 0,
          questionIndex: currentIndex,
        };
      }
    }

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
      session: {
        id: session.id,
        title: session.title,
        categoryId: session.categoryId,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.totalQuestions,
        timePerQuestion: session.timePerQuestion,
        startedAt: session.startedAt,
      },
      currentQuestion: currentQuestion as object | null,
      leaderboard: topLeaderboard,
      playingCount: participants.length,
      myRank,
      myEntry,
    });
  } catch (e) {
    console.error('Live quiz session get error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
