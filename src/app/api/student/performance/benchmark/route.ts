import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all completed practice exam participants
    const allParticipants = await prisma.practiceExamParticipant.findMany({
      where: {
        completedAt: { not: null },
        score: { not: null }
      },
      include: {
        exam: {
          include: {
            questions: true
          }
        }
      }
    });

    if (allParticipants.length === 0) {
      return NextResponse.json({
        top10Percent: null,
        top25Percent: null,
        median: null,
        message: 'Not enough data for benchmark calculation'
      });
    }

    // Calculate performance metrics for all participants
    const participantMetrics = allParticipants.map((participant) => {
      const answers = (participant.answers as Record<string, number>) || {};
      const questions = participant.exam.questions;
      
      let correctAnswers = 0;
      let attemptedCount = 0;

      questions.forEach((question) => {
        const selectedOption = answers[question.id];
        if (selectedOption !== undefined) {
          attemptedCount++;
          if (selectedOption === question.correct) {
            correctAnswers++;
          }
        }
      });

      const accuracy = attemptedCount > 0 ? (correctAnswers / attemptedCount) * 100 : 0;
      const score = participant.score || 0;
      
      let timePerQuestion: number | null = null;
      if (participant.startedAt && participant.completedAt) {
        const timeTakenSeconds = (new Date(participant.completedAt).getTime() - new Date(participant.startedAt).getTime()) / 1000;
        timePerQuestion = questions.length > 0 ? timeTakenSeconds / questions.length : null;
      }

      const attemptRatio = questions.length > 0 ? attemptedCount / questions.length : 0;

      return {
        score,
        accuracy,
        timePerQuestion: timePerQuestion || 0,
        attemptRatio
      };
    });

    // Sort by score (descending)
    participantMetrics.sort((a, b) => b.score - a.score);

    // Calculate percentiles
    const total = participantMetrics.length;
    const top10Index = Math.floor(total * 0.1);
    const top25Index = Math.floor(total * 0.25);
    const medianIndex = Math.floor(total * 0.5);

    const top10Percent = participantMetrics.slice(0, Math.max(1, top10Index));
    const top25Percent = participantMetrics.slice(0, Math.max(1, top25Index));
    const medianSlice = participantMetrics.slice(medianIndex - 1, medianIndex + 1);

    const calculateAverage = (slice: typeof participantMetrics) => {
      if (slice.length === 0) return null;
      return {
        avgScore: slice.reduce((sum, p) => sum + p.score, 0) / slice.length,
        avgAccuracy: slice.reduce((sum, p) => sum + p.accuracy, 0) / slice.length,
        avgTimePerQuestion: slice
          .filter(p => p.timePerQuestion > 0)
          .reduce((sum, p) => sum + p.timePerQuestion, 0) / 
          slice.filter(p => p.timePerQuestion > 0).length || null,
        avgAttemptRatio: slice.reduce((sum, p) => sum + p.attemptRatio, 0) / slice.length
      };
    };

    return NextResponse.json({
      top10Percent: calculateAverage(top10Percent),
      top25Percent: calculateAverage(top25Percent),
      median: calculateAverage(medianSlice),
      totalParticipants: total
    });
  } catch (error) {
    console.error('Error calculating benchmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

