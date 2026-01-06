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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get last N completed practice exams
    const attempts = await prisma.practiceExamParticipant.findMany({
      where: {
        userId: decoded.userId,
        completedAt: { not: null },
        score: { not: null }
      },
      include: {
        exam: {
          include: {
            questions: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: limit
    });

    // Calculate performance metrics for each attempt
    const performanceData = attempts.map((attempt) => {
      const answers = (attempt.answers as Record<string, number>) || {};
      const questions = attempt.exam.questions;
      
      let correctAnswers = 0;
      let totalMarks = 0;
      let earnedMarks = 0;
      let attemptedCount = 0;

      questions.forEach((question) => {
        totalMarks += question.marks || 1;
        const selectedOption = answers[question.id];
        
        if (selectedOption !== undefined) {
          attemptedCount++;
          if (selectedOption === question.correct) {
            correctAnswers++;
            earnedMarks += question.marks || 1;
          }
        }
      });

      const accuracy = attemptedCount > 0 ? (correctAnswers / attemptedCount) * 100 : 0;
      const score = attempt.score || (totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0);
      
      // Calculate time per question
      let timePerQuestion: number | null = null;
      if (attempt.startedAt && attempt.completedAt) {
        const timeTakenSeconds = (new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000;
        timePerQuestion = questions.length > 0 ? timeTakenSeconds / questions.length : null;
      }

      return {
        examId: attempt.examId,
        examTitle: attempt.exam.title,
        examCategory: attempt.exam.category,
        score,
        accuracy,
        correctAnswers,
        totalQuestions: questions.length,
        attemptedCount,
        timePerQuestion,
        completedAt: attempt.completedAt?.toISOString(),
        totalMarks,
        earnedMarks
      };
    });

    // Calculate overall statistics
    const totalAttempts = performanceData.length;
    if (totalAttempts === 0) {
      return NextResponse.json({
        attempts: [],
        statistics: null,
        message: 'Not enough data. Complete at least 5 practice exams for rank prediction.'
      });
    }

    const avgAccuracy = performanceData.reduce((sum, p) => sum + p.accuracy, 0) / totalAttempts;
    const avgScore = performanceData.reduce((sum, p) => sum + p.score, 0) / totalAttempts;
    const avgTimePerQuestion = performanceData
      .filter(p => p.timePerQuestion !== null)
      .reduce((sum, p) => sum + (p.timePerQuestion || 0), 0) / 
      performanceData.filter(p => p.timePerQuestion !== null).length;

    // Calculate consistency (lower variance = higher consistency)
    const scores = performanceData.map(p => p.score);
    const meanScore = avgScore;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / totalAttempts;
    const consistency = Math.max(0, 100 - (variance / 10)); // Normalize to 0-100

    // Calculate attempt ratio (how many questions attempted vs total)
    const avgAttemptRatio = performanceData.reduce((sum, p) => {
      return sum + (p.attemptedCount / p.totalQuestions);
    }, 0) / totalAttempts;

    return NextResponse.json({
      attempts: performanceData,
      statistics: {
        totalAttempts,
        avgAccuracy,
        avgScore,
        avgTimePerQuestion: avgTimePerQuestion || null,
        consistency,
        avgAttemptRatio,
        hasEnoughData: totalAttempts >= 5
      }
    });
  } catch (error) {
    console.error('Error fetching performance history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

