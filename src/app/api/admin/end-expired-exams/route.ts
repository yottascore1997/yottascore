import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { withCORS } from '@/lib/cors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Function to check and end expired exams
async function checkAndEndExpiredExams() {
  try {
    console.log(`⏰ Checking for expired live exams...`);
    
    const now = new Date();
    
    // Find live exams that have ended (endTime is in the past)
    const expiredExams = await prisma.liveExam.findMany({
      where: {
        isLive: true,
        endTime: {
          lt: now
        }
      },
      select: {
        id: true,
        title: true,
        endTime: true
      }
    });
    
    if (expiredExams.length === 0) {
      console.log(`   - No expired exams found`);
      return { ended: 0, exams: [] };
    }
    
    console.log(`   - Found ${expiredExams.length} expired exams to end`);
    
    const endedExams: Array<{ id: string; title: string; endTime: Date | null }> = [];
    
    for (const exam of expiredExams) {
      console.log(`   - Ending exam: ${exam.title} (ID: ${exam.id})`);
      
      // Update exam status to not live
      await prisma.liveExam.update({
        where: { id: exam.id },
        data: { isLive: false }
      });
      
      endedExams.push({
        id: exam.id,
        title: exam.title,
        endTime: exam.endTime
      });
      
      console.log(`   - Successfully ended exam: ${exam.title}`);
    }
    
    console.log(`   - Completed ending ${expiredExams.length} expired exams`);
    
    return { ended: expiredExams.length, exams: endedExams };
    
  } catch (error) {
    console.error(`❌ Error checking and ending expired exams:`, error);
    throw error;
  }
}

export const POST = withCORS(async (req: Request) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await checkAndEndExpiredExams();
    
    return NextResponse.json({
      success: true,
      message: `Successfully ended ${result.ended} expired exams`,
      ...result
    });
    
  } catch (error) {
    console.error('Error ending expired exams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const GET = withCORS(async (req: Request) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all live exams that might expire soon
    const now = new Date();
    const soon = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    const liveExams = await prisma.liveExam.findMany({
      where: {
        isLive: true,
        endTime: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        endTime: true,
        isLive: true
      },
      orderBy: {
        endTime: 'asc'
      }
    });
    
    // Categorize exams
    type ExamType = typeof liveExams[number];
    const expired = liveExams.filter((exam: ExamType) => exam.endTime && new Date(exam.endTime) < now);
    const expiringSoon = liveExams.filter((exam: ExamType) => 
      exam.endTime && 
      new Date(exam.endTime) >= now && 
      new Date(exam.endTime) <= soon
    );
    const active = liveExams.filter((exam: ExamType) => 
      exam.endTime && new Date(exam.endTime) > soon
    );
    
    return NextResponse.json({
      success: true,
      data: {
        expired,
        expiringSoon,
        active,
        total: liveExams.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching exam status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
