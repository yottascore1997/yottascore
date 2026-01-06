import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: Request, { params }: { params: { examId: string } }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the exam and participant data
    const exam = await prisma.practiceExam.findUnique({
      where: { id: params.examId },
      include: {
        questions: true
      }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

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

    if (!participant.completedAt) {
      return NextResponse.json({ error: 'Exam not completed yet' }, { status: 403 });
    }

    // Calculate detailed result (same as submit endpoint)
    const answers = participant.answers as Record<string, number> || {};
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
    const score = participant.score || (totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0);

    // Calculate time taken
    let timeTakenSeconds: number | null = null;
    if (participant.startedAt && participant.completedAt) {
      const startTime = new Date(participant.startedAt).getTime();
      const endTime = new Date(participant.completedAt).getTime();
      timeTakenSeconds = Math.max(0, Math.round((endTime - startTime) / 1000));
    }

    const timeTakenMinutes = timeTakenSeconds !== null ? Math.round(timeTakenSeconds / 60) : null;

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

    // Calculate rank
    const participants = await prisma.practiceExamParticipant.findMany({
      where: {
        examId: params.examId,
        completedAt: {
          not: null
        }
      }
    });

    const enhancedParticipants = participants.map((p) => {
      let timeTaken: number | null = null;
      if (p.startedAt && p.completedAt) {
        const startTime = new Date(p.startedAt).getTime();
        const endTime = new Date(p.completedAt).getTime();
        timeTaken = Math.round((endTime - startTime) / 1000);
      }
      return {
        ...p,
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

    // Return detailed result (same format as submit endpoint)
    return NextResponse.json({
      success: true,
      result: {
        score,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        unattempted,
        totalMarks,
        earnedMarks,
        answers,
        completedAt: participant.completedAt.toISOString(),
        timeTakenSeconds,
        timeTakenMinutes,
        timeTakenFormatted: formatTimeTaken(timeTakenSeconds),
        rank: currentRank,
        totalParticipants: sortedParticipants.length
      }
    });
  } catch (error) {
    console.error('Error fetching practice exam result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

