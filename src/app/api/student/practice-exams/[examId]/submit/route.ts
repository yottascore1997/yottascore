import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request, { params }: { params: { examId: string } }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { answers } = await request.json();
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }
    // Get the exam and questions
    const exam = await prisma.practiceExam.findUnique({
      where: { id: params.examId },
      include: {
        questions: true
      }
    });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    // Check if user is a participant
    const participant = await prisma.practiceExamParticipant.findUnique({
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
    let totalMarks = 0;
    let earnedMarks = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unattempted = 0;
    
    for (const question of exam.questions) {
      const selectedOptionIndex = answers[question.id];
      totalMarks += question.marks;
      
      if (selectedOptionIndex === undefined) {
        unattempted++;
        continue;
      }
      
      if (selectedOptionIndex === question.correct) {
        correctAnswers++;
        earnedMarks += question.marks;
      } else {
        wrongAnswers++;
      }
    }
    
    const totalQuestions = exam.questions.length;
    const score = totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0;
    
    // Record completion time to reuse consistently
    const completionTime = new Date();

    // Save the result
    const updatedParticipant = await prisma.practiceExamParticipant.update({
      where: {
        examId_userId: {
          examId: params.examId,
          userId: decoded.userId
        }
      },
      data: {
        score,
        answers: answers,
        completedAt: completionTime
      }
    });

    // Calculate time taken for the current attempt
    let timeTakenSeconds: number | null = null;
    if (participant.startedAt) {
      const startTime = new Date(participant.startedAt).getTime();
      timeTakenSeconds = Math.max(
        0,
        Math.round((completionTime.getTime() - startTime) / 1000)
      );
    }

    const timeTakenMinutes =
      timeTakenSeconds !== null ? Math.round(timeTakenSeconds / 60) : null;

    const formatTimeTaken = (seconds: number | null) => {
      if (seconds === null) return null;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
      }
      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${remainingSeconds}s`;
    };

    // Compute current rank similar to leaderboard calculation
    const participants = await prisma.practiceExamParticipant.findMany({
      where: {
        examId: params.examId,
        completedAt: {
          not: null
        }
      }
    });

    const enhancedParticipants = participants.map((participant) => {
      let timeTaken: number | null = null;

      if (participant.startedAt && participant.completedAt) {
        const startTime = new Date(participant.startedAt).getTime();
        const endTime = new Date(participant.completedAt).getTime();
        timeTaken = Math.round((endTime - startTime) / 1000); // seconds
      }

      return {
        ...participant,
        timeTaken
      };
    });

    const sortedParticipants = enhancedParticipants.sort((a, b) => {
      const aScore = a.score ?? 0;
      const bScore = b.score ?? 0;

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      if (a.timeTaken !== null && b.timeTaken !== null) {
        return a.timeTaken - b.timeTaken;
      }

      if (a.timeTaken !== null && b.timeTaken === null) {
        return -1;
      }

      if (a.timeTaken === null && b.timeTaken !== null) {
        return 1;
      }

      if (a.completedAt && b.completedAt) {
        return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
      }

      return 0;
    });

    const currentRankIndex = sortedParticipants.findIndex(
      (p) => p.userId === decoded.userId
    );
    const currentRank = currentRankIndex >= 0 ? currentRankIndex + 1 : null;

    // Return detailed result data for the beautiful result page
    return NextResponse.json({
      success: true,
      redirectTo: `/student/practice-exams/${params.examId}/result`,
      result: {
        score,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        unattempted,
        totalMarks,
        earnedMarks,
        answers,
        completedAt: completionTime.toISOString(),
        timeTakenSeconds,
        timeTakenMinutes,
        timeTakenFormatted: formatTimeTaken(timeTakenSeconds),
        rank: currentRank,
        totalParticipants: sortedParticipants.length
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 