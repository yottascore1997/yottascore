import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Simplified cut-off mapping (can be expanded with actual exam data)
const CUTOFF_MAPPING: Record<string, Array<{ scoreRange: [number, number]; rankRange: [number, number] }>> = {
  'SSC_CGL': [
    { scoreRange: [145, 200], rankRange: [1, 2000] },
    { scoreRange: [135, 145], rankRange: [2000, 5000] },
    { scoreRange: [125, 135], rankRange: [5000, 10000] },
    { scoreRange: [115, 125], rankRange: [10000, 20000] },
    { scoreRange: [105, 115], rankRange: [20000, 40000] },
    { scoreRange: [95, 105], rankRange: [40000, 80000] },
    { scoreRange: [85, 95], rankRange: [80000, 150000] },
    { scoreRange: [75, 85], rankRange: [150000, 300000] },
    { scoreRange: [65, 75], rankRange: [300000, 500000] },
    { scoreRange: [0, 65], rankRange: [500000, 1000000] }
  ],
  'DEFAULT': [
    { scoreRange: [90, 200], rankRange: [1, 5000] },
    { scoreRange: [80, 90], rankRange: [5000, 15000] },
    { scoreRange: [70, 80], rankRange: [15000, 40000] },
    { scoreRange: [60, 70], rankRange: [40000, 100000] },
    { scoreRange: [50, 60], rankRange: [100000, 250000] },
    { scoreRange: [40, 50], rankRange: [250000, 500000] },
    { scoreRange: [0, 40], rankRange: [500000, 1000000] }
  ]
};

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
    const examType = searchParams.get('examType') || 'DEFAULT';
    const limit = 10;

    // Get user's performance history directly (no internal fetch)
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

    // Calculate performance metrics
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
      
      let timePerQuestion: number | null = null;
      if (attempt.startedAt && attempt.completedAt) {
        const timeTakenSeconds = (new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000;
        timePerQuestion = questions.length > 0 ? timeTakenSeconds / questions.length : null;
      }

      return {
        score,
        accuracy,
        attemptedCount,
        totalQuestions: questions.length,
        timePerQuestion,
        totalMarks,
        earnedMarks
      };
    });

    const totalAttempts = performanceData.length;
    if (totalAttempts < 5) {
      return NextResponse.json({
        hasEnoughData: false,
        message: 'Complete at least 5 practice exams to get rank prediction',
        requiredAttempts: 5,
        currentAttempts: totalAttempts
      });
    }

    // Calculate statistics
    const avgAccuracy = performanceData.reduce((sum, p) => sum + p.accuracy, 0) / totalAttempts;
    const avgScore = performanceData.reduce((sum, p) => sum + p.score, 0) / totalAttempts;
    const avgTimePerQuestion = performanceData
      .filter(p => p.timePerQuestion !== null)
      .reduce((sum, p) => sum + (p.timePerQuestion || 0), 0) / 
      performanceData.filter(p => p.timePerQuestion !== null).length;

    const scores = performanceData.map(p => p.score);
    const meanScore = avgScore;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - meanScore, 2), 0) / totalAttempts;
    const consistency = Math.max(0, 100 - (variance / 10));

    const avgAttemptRatio = performanceData.reduce((sum, p) => {
      return sum + (p.attemptedCount / p.totalQuestions);
    }, 0) / totalAttempts;

    const historyData = {
      statistics: {
        totalAttempts,
        avgAccuracy,
        avgScore,
        avgTimePerQuestion: avgTimePerQuestion || null,
        consistency,
        avgAttemptRatio,
        hasEnoughData: totalAttempts >= 5
      }
    };
    
    if (!historyData.statistics || !historyData.statistics.hasEnoughData) {
      return NextResponse.json({
        hasEnoughData: false,
        message: 'Complete at least 5 practice exams to get rank prediction',
        requiredAttempts: 5,
        currentAttempts: historyData.statistics?.totalAttempts || 0
      });
    }

    const stats = historyData.statistics;

    // Calculate Performance Index (PI)
    // PI = (Accuracy × 0.4) + (Attempt Ratio × 0.3) + (Speed Score × 0.2) + (Consistency × 0.1)
    
    // Normalize speed (lower time = higher score, max 100)
    const avgTimePerQuestion = stats.avgTimePerQuestion || 60; // Default 60 seconds
    const speedScore = Math.max(0, Math.min(100, 100 - (avgTimePerQuestion / 2))); // Normalize
    
    // Normalize attempt ratio to 0-100
    const attemptRatioScore = stats.avgAttemptRatio * 100;
    
    // Performance Index calculation
    const performanceIndex = 
      (stats.avgAccuracy * 0.4) +
      (attemptRatioScore * 0.3) +
      (speedScore * 0.2) +
      (stats.consistency * 0.1);

    // Map PI to score range (assuming PI correlates with exam score)
    // This is a simplified mapping - can be refined with actual data
    const projectedScore = performanceIndex * 0.9; // Scale down slightly for conservative estimate

    // Get cut-off mapping
    const cutoffTable = CUTOFF_MAPPING[examType] || CUTOFF_MAPPING['DEFAULT'];
    
    // Find rank range based on projected score
    let rankRange: [number, number] | null = null;
    for (const mapping of cutoffTable) {
      if (projectedScore >= mapping.scoreRange[0] && projectedScore < mapping.scoreRange[1]) {
        rankRange = mapping.rankRange;
        break;
      }
    }

    // If score is very high, use top range
    if (!rankRange) {
      const topMapping = cutoffTable[0];
      if (projectedScore >= topMapping.scoreRange[1]) {
        rankRange = [1, topMapping.rankRange[0]];
      } else {
        // If score is very low, use bottom range
        const bottomMapping = cutoffTable[cutoffTable.length - 1];
        rankRange = bottomMapping.rankRange;
      }
    }

    // Add some variance for range (make it wider for safety)
    const rangeWidth = rankRange[1] - rankRange[0];
    const adjustedRange: [number, number] = [
      Math.max(1, Math.floor(rankRange[0] - rangeWidth * 0.1)),
      Math.floor(rankRange[1] + rangeWidth * 0.1)
    ];

    return NextResponse.json({
      hasEnoughData: true,
      projectedScore: Math.round(projectedScore * 10) / 10,
      rankRange: adjustedRange,
      performanceIndex: Math.round(performanceIndex * 10) / 10,
      breakdown: {
        accuracy: Math.round(stats.avgAccuracy * 10) / 10,
        attemptRatio: Math.round(stats.avgAttemptRatio * 100 * 10) / 10,
        speedScore: Math.round(speedScore * 10) / 10,
        consistency: Math.round(stats.consistency * 10) / 10
      },
      disclaimer: 'Based on current performance trends. Not a guarantee, but a projection if you maintain similar performance.',
      examType
    });
  } catch (error) {
    console.error('Error calculating rank preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

