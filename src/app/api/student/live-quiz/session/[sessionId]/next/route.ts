import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/** POST: Advance to next question (when timer ends). Body: { expectedIndex }.
 * If session.currentQuestionIndex === expectedIndex, advances and returns new question.
 * Otherwise returns current state (so client can sync). */
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

    const { sessionId } = await params;
    const body = await req.json().catch(() => ({}));
    const expectedIndex = typeof body.expectedIndex === 'number' ? body.expectedIndex : 0;

    const session = await prisma.liveQuizSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const questionIds = (session.questionIds as string[]) || [];
    const currentIndex = session.currentQuestionIndex;

    if (currentIndex !== expectedIndex) {
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
      return NextResponse.json({
        session: {
          id: session.id,
          title: session.title,
          currentQuestionIndex: session.currentQuestionIndex,
          status: session.status,
          totalQuestions: session.totalQuestions,
          timePerQuestion: session.timePerQuestion,
        },
        currentQuestion: currentQuestion as object | null,
        advanced: false,
      });
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= session.totalQuestions) {
      await prisma.liveQuizSession.update({
        where: { id: sessionId },
        data: { status: 'FINISHED', currentQuestionIndex: nextIndex },
      });
      return NextResponse.json({
        session: {
          id: session.id,
          title: session.title,
          currentQuestionIndex: nextIndex,
          status: 'FINISHED',
          totalQuestions: session.totalQuestions,
          timePerQuestion: session.timePerQuestion,
        },
        currentQuestion: null,
        advanced: true,
        finished: true,
      });
    }

    await prisma.liveQuizSession.update({
      where: { id: sessionId },
      data: { currentQuestionIndex: nextIndex },
    });

    const q = await prisma.questionBankItem.findUnique({
      where: { id: questionIds[nextIndex] },
    });
    const currentQuestion = q
      ? {
          id: q.id,
          text: q.text,
          options: (q.options as string[]) || [],
          correct: q.correct ?? 0,
          questionIndex: nextIndex,
        }
      : null;

    const updated = await prisma.liveQuizSession.findUnique({
      where: { id: sessionId },
    });

    return NextResponse.json({
      session: updated
        ? {
            id: updated.id,
            title: updated.title,
            categoryId: updated.categoryId,
            currentQuestionIndex: updated.currentQuestionIndex,
            status: updated.status,
            totalQuestions: updated.totalQuestions,
            timePerQuestion: updated.timePerQuestion,
            startedAt: updated.startedAt,
          }
        : null,
      currentQuestion: currentQuestion as object | null,
      advanced: true,
      finished: false,
    });
  } catch (e) {
    console.error('Live quiz next error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
