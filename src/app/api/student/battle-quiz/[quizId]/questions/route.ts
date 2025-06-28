import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

export const GET = withCORS(async (
  req: Request,
  { params }: { params: { quizId: string } }
) => {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = params;
    console.log('Looking for quiz with ID:', quizId);

    // Verify the quiz exists and is active
    const quiz = await prisma.battleQuiz.findFirst({
      where: {
        id: quizId,
        isActive: true
      }
    });

    console.log('Found quiz:', quiz);

    if (!quiz) {
      // Let's check if the quiz exists but is inactive
      const inactiveQuiz = await prisma.battleQuiz.findUnique({
        where: { id: quizId }
      });
      
      if (inactiveQuiz) {
        return NextResponse.json({ 
          message: 'Quiz exists but is not active.',
          quizId: quizId,
          isActive: inactiveQuiz.isActive
        }, { status: 404 });
      } else {
        return NextResponse.json({ 
          message: 'Quiz not found.',
          quizId: quizId
        }, { status: 404 });
      }
    }

    // Get questions for this quiz
    const questions = await prisma.battleQuizQuestion.findMany({
      where: { quizId },
      orderBy: { createdAt: 'asc' },
    });

    console.log('Found questions:', questions.length);

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error('Battle Quiz questions fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}); 