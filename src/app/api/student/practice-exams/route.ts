import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get category filter from query parameters
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    console.log('Practice exams request - Category filter:', category);
    
    // Build where clause for category filtering
    const whereClause = category ? { category } : {};
    
    const exams = await prisma.practiceExam.findMany({
      where: whereClause,
      orderBy: { startTime: 'asc' },
      include: {
        participants: {
          where: { userId: decoded.userId },
          select: { completedAt: true }
        }
      }
    });
    const examsWithAttempted = exams.map((exam: any) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      category: exam.category,
      subcategory: exam.subcategory,
      spots: exam.spots,
      spotsLeft: exam.spotsLeft,
      startTime: exam.startTime,
      endTime: exam.endTime,
      logoUrl: exam.logoUrl,
      attempted: exam.participants.length > 0 && !!exam.participants[0].completedAt
    }));
    return NextResponse.json(examsWithAttempted);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 