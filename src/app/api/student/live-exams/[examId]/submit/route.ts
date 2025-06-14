import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { answers } = await request.json();
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    // Get the exam and questions
    const exam = await prisma.liveExam.findUnique({
      where: { id: params.examId },
      include: {
        questions: true
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check if user is a participant
    const participant = await prisma.liveExamParticipant.findUnique({
      where: {
        examId_userId: {
          examId: params.examId,
          userId: decoded.userId
        }
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant in this exam' }, { status: 403 });
    }

    // Calculate results
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unattempted = 0;

    for (const question of exam.questions) {
      const selectedOptionIndex = answers[question.id];
      if (selectedOptionIndex === undefined) {
        unattempted++;
        continue;
      }
      if (selectedOptionIndex === question.correct) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    }

    const totalQuestions = exam.questions.length;
    const score = (correctAnswers / totalQuestions) * 100;

    // Save the result
    await prisma.liveExamParticipant.update({
      where: {
        examId_userId: {
          examId: params.examId,
          userId: decoded.userId
        }
      },
      data: {
        score,
        answers: answers,
        completedAt: new Date()
      }
    });

    return NextResponse.json({
      score,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      unattempted
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 