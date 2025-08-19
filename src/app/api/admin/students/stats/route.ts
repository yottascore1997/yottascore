import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized - No token provided', { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return new NextResponse('Unauthorized - Invalid token', { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return new NextResponse('Admin access required', { status: 403 });
    }

    // Get current date and month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Fetch all students
    const allStudents = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        participatedExams: true,
        participatedPracticeExams: true,
        battleQuizParticipations: true,
        referrerReferrals: true
      }
    });

    // Calculate statistics
    const totalStudents = allStudents.length;
    const activeStudents = totalStudents; // All students are considered active
    
    const newStudentsThisMonth = allStudents.filter(
      student => new Date(student.createdAt) >= monthStart
    ).length;

    const lastMonthStudents = allStudents.filter(
      student => new Date(student.createdAt) >= lastMonthStart && new Date(student.createdAt) < monthStart
    ).length;

    const growthRate = lastMonthStudents > 0 
      ? Math.round(((newStudentsThisMonth - lastMonthStudents) / lastMonthStudents) * 100)
      : newStudentsThisMonth > 0 ? 100 : 0;

    // Calculate exam statistics
    const totalExamsTaken = allStudents.reduce((sum, student) => 
      sum + student.participatedExams.length + student.participatedPracticeExams.length + student.battleQuizParticipations.length, 
    0);

    // Calculate wallet statistics
    const totalWinnings = allStudents.reduce((sum, student) => 
      sum + (student.wallet || 0), 
    0);

    const averageWalletBalance = totalStudents > 0 
      ? Math.round(totalWinnings / totalStudents) 
      : 0;

    // Calculate KYC statistics
    const kycVerifiedCount = allStudents.filter(
      student => student.kycStatus === 'VERIFIED'
    ).length;

    return NextResponse.json({
      totalStudents,
      activeStudents,
      newStudentsThisMonth,
      growthRate,
      totalExamsTaken,
      totalWinnings,
      averageWalletBalance,
      kycVerifiedCount
    });

  } catch (error) {
    console.error('Error fetching student stats:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
