import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const DEFAULT_QUESTION_COUNT = 10;
/** Max questions per round; use 0 or very high to allow "unlimited" (all in bank). */
const MAX_QUESTIONS_PER_ROUND = 0; // 0 = use all questions in category
const DEFAULT_TIME_PER_QUESTION = 10;
const ACTIVE_WINDOW_MS = 45_000;

/** POST: Join current PLAYING session for category (Always-on). */
export async function POST(req: Request) {
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

    const body = await req.json().catch(() => ({}));
    const categoryId = body.categoryId as string | undefined;
    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId required' }, { status: 400 });
    }

    const category = await prisma.questionCategory.findFirst({
      where: { id: categoryId, isActive: true },
      include: {
        _count: { select: { questions: true } },
      },
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const totalInBank = category._count.questions || 0;
    const questionCount =
      MAX_QUESTIONS_PER_ROUND > 0
        ? Math.min(MAX_QUESTIONS_PER_ROUND, totalInBank || DEFAULT_QUESTION_COUNT)
        : totalInBank;
    if (questionCount < 1) {
      return NextResponse.json(
        { error: 'No questions in this category' },
        { status: 400 }
      );
    }

    // Find current PLAYING session (always-on) or create a new one
    let session = await prisma.liveQuizSession.findFirst({
      where: { categoryId, status: 'PLAYING' },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      const items = await prisma.questionBankItem.findMany({
        where: { categoryId, isActive: true },
        select: { id: true },
        take: Math.max(questionCount, questionCount * 2),
      });
      const shuffled = items.sort(() => Math.random() - 0.5);
      const questionIds = shuffled.slice(0, questionCount).map((q) => q.id);

      if (questionIds.length < 1) {
        return NextResponse.json(
          { error: 'No questions available in this category' },
          { status: 400 }
        );
      }

      session = await prisma.liveQuizSession.create({
        data: {
          categoryId,
          title: category.name,
          status: 'PLAYING',
          totalQuestions: questionIds.length,
          timePerQuestion: DEFAULT_TIME_PER_QUESTION,
          questionIds: questionIds as unknown as object,
          startedAt: new Date(),
        },
      });
    }

    await prisma.liveQuizSessionParticipant.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId } },
      create: {
        sessionId: session.id,
        userId,
        status: 'PLAYING',
        lastSeenAt: new Date(),
      },
      update: {
        status: 'PLAYING',
        lastSeenAt: new Date(),
      },
    });

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
      where: { sessionId: session.id, status: 'PLAYING', lastSeenAt: { gte: activeSince } },
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
      leaderboard,
      playingCount: participants.length,
    });
  } catch (e) {
    console.error('Live quiz join error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
