import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get total students
    const totalStudents = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    // Get total exams
    const totalExams = await prisma.liveExam.count();

    // Get exams taken (completed participations)
    const examsTaken = await prisma.liveExamParticipant.count({
      where: { completedAt: { not: null } }
    });

    // Get total revenue
    const totalRevenue = await prisma.liveExam.aggregate({
      _sum: {
        totalCollection: true
      }
    });

    // Get active users (users who participated in exams in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await prisma.liveExamParticipant.count({
      where: {
        startedAt: { gte: thirtyDaysAgo }
      },
      distinct: ['userId']
    });

    // Get average score
    const averageScoreResult = await prisma.liveExamParticipant.aggregate({
      where: { score: { not: null } },
      _avg: { score: true }
    });

    // Get completion rate
    const totalParticipations = await prisma.liveExamParticipant.count();
    const completedParticipations = await prisma.liveExamParticipant.count({
      where: { completedAt: { not: null } }
    });
    const completionRate = totalParticipations > 0 ? (completedParticipations / totalParticipations) * 100 : 0;

    // Get monthly growth (new users this month vs last month)
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const thisMonthUsers = await prisma.user.count({
      where: {
        role: 'STUDENT',
        createdAt: { gte: thisMonth }
      }
    });
    
    const lastMonthUsers = await prisma.user.count({
      where: {
        role: 'STUDENT',
        createdAt: { gte: lastMonth, lt: thisMonth }
      }
    });
    
    const monthlyGrowth = lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

    // Get exam stats
    const liveExams = await prisma.liveExam.count({
      where: { isLive: true }
    });

    const completedExams = await prisma.liveExam.count({
      where: { endTime: { lt: new Date() } }
    });

    const upcomingExams = await prisma.liveExam.count({
      where: { 
        startTime: { gt: new Date() },
        isLive: false
      }
    });

    const totalParticipants = await prisma.liveExamParticipant.count();

    // Generate sample revenue data (last 6 months)
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      revenueData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.floor(Math.random() * 50000) + 10000,
        participants: Math.floor(Math.random() * 200) + 50
      });
    }

    // Generate sample exam performance data
    const examPerformance = [
      { examName: 'JEE Main', participants: 150, averageScore: 75, completionRate: 85 },
      { examName: 'NEET', participants: 120, averageScore: 82, completionRate: 90 },
      { examName: 'CAT', participants: 80, averageScore: 68, completionRate: 75 },
      { examName: 'GATE', participants: 95, averageScore: 71, completionRate: 80 },
      { examName: 'UPSC', participants: 200, averageScore: 65, completionRate: 70 }
    ];

    // Generate sample user growth data
    const userGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      userGrowth.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        newUsers: Math.floor(Math.random() * 100) + 20,
        activeUsers: Math.floor(Math.random() * 300) + 100
      });
    }

    // Generate sample category distribution
    const categoryDistribution = [
      { category: 'Engineering', count: 35, percentage: 35 },
      { category: 'Medical', count: 25, percentage: 25 },
      { category: 'Management', count: 20, percentage: 20 },
      { category: 'Civil Services', count: 15, percentage: 15 },
      { category: 'Others', count: 5, percentage: 5 }
    ];

    // Get recent activities
    const recentActivities = await prisma.liveExam.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
        participants: { select: { id: true } }
      }
    });

    const activities = recentActivities.map(exam => ({
      description: `New exam "${exam.title}" created by ${exam.createdBy.name}`,
      timestamp: exam.createdAt
    }));

    return NextResponse.json({
      totalStudents,
      totalExams,
      examsTaken,
      totalRevenue: totalRevenue._sum.totalCollection || 0,
      activeUsers,
      averageScore: Math.round(averageScoreResult._avg.score || 0),
      completionRate: Math.round(completionRate),
      monthlyGrowth: Math.round(monthlyGrowth),
      recentActivities: activities,
      examStats: {
        liveExams,
        completedExams,
        upcomingExams,
        totalParticipants
      },
      revenueData,
      examPerformance,
      userGrowth,
      categoryDistribution
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 });
    }
    console.error('[ADMIN_SUMMARY_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 