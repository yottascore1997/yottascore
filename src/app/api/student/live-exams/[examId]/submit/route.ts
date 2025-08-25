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
      if (selectedOptionIndex === question.correctAnswer) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    }

    const totalQuestions = exam.questions.length;
    const score = (correctAnswers / totalQuestions) * 100;

    // Calculate time taken
    const startTime = new Date(participant.startedAt).getTime();
    const endTime = new Date().getTime();
    const timeTakenSeconds = Math.round((endTime - startTime) / 1000);
    const timeTakenMinutes = Math.round(timeTakenSeconds / 60);

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

    // Get current rank and prize amount
    const allParticipants = await prisma.liveExamParticipant.findMany({
      where: { 
        examId: params.examId,
        completedAt: { not: null }
      },
      include: { user: { select: { name: true } } },
      orderBy: [
        { score: 'desc' },
        { completedAt: 'asc' }
      ]
    });

    // Calculate rank
    let currentRank = 0;
    for (let i = 0; i < allParticipants.length; i++) {
      if (allParticipants[i].userId === decoded.userId) {
        currentRank = i + 1;
        break;
      }
    }

    // Calculate prize amount based on rank
    const totalPrizePool = exam.spots * exam.entryFee;
    const winningPool = totalPrizePool * 0.9;
    let prizeAmount = 0;

    if (currentRank === 1) {
      prizeAmount = Math.floor(winningPool * 0.20);
    } else if (currentRank === 2) {
      prizeAmount = Math.floor(winningPool * 0.15);
    } else if (currentRank === 3) {
      prizeAmount = Math.floor(winningPool * 0.10);
    } else if (currentRank >= 4 && currentRank <= 10) {
      prizeAmount = Math.floor(winningPool * 0.25 / 7);
    } else if (currentRank >= 11 && currentRank <= 25) {
      prizeAmount = Math.floor(winningPool * 0.30 / 15);
    }

    // Format time taken
    const formatTimeTaken = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      } else {
        return `${remainingSeconds}s`;
      }
    };

    return NextResponse.json({
      // Basic Results
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      unattempted,
      
      // Time Information
      examDuration: exam.duration, // Total exam duration in minutes
      timeTakenSeconds,
      timeTakenMinutes,
      timeTakenFormatted: formatTimeTaken(timeTakenSeconds),
      
      // Rank and Prize
      currentRank,
      prizeAmount,
      
      // Additional Details
      examTitle: exam.title,
      completedAt: new Date().toISOString(),
      
      // Performance Analysis
      accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
      timeEfficiency: exam.duration > 0 ? Math.round((timeTakenMinutes / exam.duration) * 100) : 0,
      
      // Success message
      message: `Exam completed successfully! You scored ${Math.round(score * 100) / 100}% and secured rank #${currentRank}`
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 