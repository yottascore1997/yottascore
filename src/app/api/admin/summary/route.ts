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

    // Get total users
    const totalUsers = await prisma.user.count({
      where: { role: 'STUDENT' }
    });

    // Get total live exams
    const totalExams = await prisma.liveExam.count();

    // Get total revenue (sum of all entry fees)
    const totalRevenue = await prisma.liveExam.aggregate({
      _sum: {
        totalCollection: true
      }
    });

    // Get recent activities (last 5 live exams)
    const recentActivities = await prisma.liveExam.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        createdBy: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      totalUsers,
      totalExams,
      totalRevenue: totalRevenue._sum.totalCollection || 0,
      recentActivities: recentActivities.map(exam => ({
        id: exam.id,
        title: exam.title,
        createdAt: exam.createdAt,
        createdBy: exam.createdBy.name
      }))
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new NextResponse('Invalid token', { status: 401 });
    }
    console.error('[ADMIN_SUMMARY_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 