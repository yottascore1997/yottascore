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

    // Get user's performance history directly
    const limit = 10;
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

    // Calculate user statistics
    const performanceData = attempts.map((attempt) => {
      const answers = (attempt.answers as Record<string, number>) || {};
      const questions = attempt.exam.questions;
      
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
      const score = attempt.score || 0;
      
      let timePerQuestion: number | null = null;
      if (attempt.startedAt && attempt.completedAt) {
        const timeTakenSeconds = (new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000;
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

    const totalAttempts = performanceData.length;
    if (totalAttempts < 5) {
      return NextResponse.json({
        hasEnoughData: false,
        message: 'Complete at least 5 practice exams to get improvement suggestions'
      });
    }

    const userStats = {
      avgAccuracy: performanceData.reduce((sum, p) => sum + p.accuracy, 0) / totalAttempts,
      avgTimePerQuestion: performanceData
        .filter(p => p.timePerQuestion > 0)
        .reduce((sum, p) => sum + p.timePerQuestion, 0) / 
        performanceData.filter(p => p.timePerQuestion > 0).length || null,
      avgAttemptRatio: performanceData.reduce((sum, p) => sum + p.attemptRatio, 0) / totalAttempts,
      consistency: (() => {
        const scores = performanceData.map(p => p.score);
        const meanScore = scores.reduce((sum, s) => sum + s, 0) / totalAttempts;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / totalAttempts;
        return Math.max(0, 100 - (variance / 10));
      })()
    };

    // Get benchmark data
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
        hasEnoughData: false,
        message: 'Not enough benchmark data available'
      });
    }

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

    participantMetrics.sort((a, b) => b.score - a.score);
    const total = participantMetrics.length;
    const top25Index = Math.floor(total * 0.25);
    const top25Percent = participantMetrics.slice(0, Math.max(1, top25Index));

    const benchmark = {
      avgAccuracy: top25Percent.reduce((sum, p) => sum + p.accuracy, 0) / top25Percent.length,
      avgTimePerQuestion: top25Percent
        .filter(p => p.timePerQuestion > 0)
        .reduce((sum, p) => sum + p.timePerQuestion, 0) / 
        top25Percent.filter(p => p.timePerQuestion > 0).length || null,
      avgAttemptRatio: top25Percent.reduce((sum, p) => sum + p.attemptRatio, 0) / top25Percent.length
    };

    const historyData = { statistics: { ...userStats, hasEnoughData: true } };
    const benchmarkData = { top25Percent: benchmark };

    if (!historyData.statistics || !historyData.statistics.hasEnoughData) {
      return NextResponse.json({
        hasEnoughData: false,
        message: 'Complete at least 5 practice exams to get improvement suggestions'
      });
    }

    if (!benchmarkData.top25Percent) {
      return NextResponse.json({
        suggestions: [],
        message: 'Not enough benchmark data available'
      });
    }

    const userStats = historyData.statistics;
    const benchmark = benchmarkData.top25Percent; // Compare with top 25%

    const suggestions: Array<{
      area: string;
      current: number;
      target: number;
      improvement: number;
      priority: 'high' | 'medium' | 'low';
      action: string;
    }> = [];

    // 1. Accuracy improvement
    if (userStats.avgAccuracy < benchmark.avgAccuracy) {
      const improvement = benchmark.avgAccuracy - userStats.avgAccuracy;
      suggestions.push({
        area: 'Accuracy',
        current: Math.round(userStats.avgAccuracy * 10) / 10,
        target: Math.round(benchmark.avgAccuracy * 10) / 10,
        improvement: Math.round(improvement * 10) / 10,
        priority: improvement > 10 ? 'high' : improvement > 5 ? 'medium' : 'low',
        action: `Focus on accuracy. Practice more questions in weak areas. Target: +${Math.round(improvement)}% accuracy.`
      });
    }

    // 2. Speed improvement
    if (benchmark.avgTimePerQuestion && userStats.avgTimePerQuestion) {
      if (userStats.avgTimePerQuestion > benchmark.avgTimePerQuestion) {
        const improvement = ((userStats.avgTimePerQuestion - benchmark.avgTimePerQuestion) / userStats.avgTimePerQuestion) * 100;
        suggestions.push({
          area: 'Speed',
          current: Math.round(userStats.avgTimePerQuestion * 10) / 10,
          target: Math.round(benchmark.avgTimePerQuestion * 10) / 10,
          improvement: Math.round(improvement * 10) / 10,
          priority: improvement > 20 ? 'high' : improvement > 10 ? 'medium' : 'low',
          action: `Improve speed. Practice time-bound tests. Target: Reduce time per question by ${Math.round(improvement)}%.`
        });
      }
    }

    // 3. Attempt ratio improvement
    if (userStats.avgAttemptRatio < benchmark.avgAttemptRatio) {
      const improvement = (benchmark.avgAttemptRatio - userStats.avgAttemptRatio) * 100;
      suggestions.push({
        area: 'Attempt Ratio',
        current: Math.round(userStats.avgAttemptRatio * 100 * 10) / 10,
        target: Math.round(benchmark.avgAttemptRatio * 100 * 10) / 10,
        improvement: Math.round(improvement * 10) / 10,
        priority: improvement > 15 ? 'high' : improvement > 8 ? 'medium' : 'low',
        action: `Attempt more questions. Don't skip questions - even guessing is better. Target: +${Math.round(improvement)}% attempt rate.`
      });
    }

    // 4. Consistency improvement
    if (userStats.consistency < 80) {
      suggestions.push({
        area: 'Consistency',
        current: Math.round(userStats.consistency * 10) / 10,
        target: 85,
        improvement: Math.round((85 - userStats.consistency) * 10) / 10,
        priority: userStats.consistency < 60 ? 'high' : 'medium',
        action: `Maintain consistency. Take regular practice tests. Avoid missing tests. Target: ${Math.round(85 - userStats.consistency)}% more consistency.`
      });
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    // Calculate overall improvement needed
    const avgImprovement = suggestions.length > 0
      ? suggestions.reduce((sum, s) => sum + s.improvement, 0) / suggestions.length
      : 0;

    return NextResponse.json({
      hasEnoughData: true,
      suggestions,
      summary: {
        totalAreas: suggestions.length,
        avgImprovement: Math.round(avgImprovement * 10) / 10,
        estimatedRankImprovement: suggestions.length > 0 ? 'Significant' : 'Minimal'
      },
      nextSteps: suggestions.slice(0, 3).map(s => s.action) // Top 3 actionable steps
    });
  } catch (error) {
    console.error('Error generating improvement suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

