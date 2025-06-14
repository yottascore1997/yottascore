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
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const exams = await prisma.liveExam.findMany({
      where: {
        endTime: { lt: now },
        winningsDistributed: false
      },
      select: {
        id: true,
        title: true,
        endTime: true,
        totalCollection: true,
        prizePool: true,
        spots: true,
        winningsDistributed: true
      },
      orderBy: {
        endTime: 'desc'
      }
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching ended exams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 