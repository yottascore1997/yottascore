import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';
import { normalizeUploadUrl } from '@/lib/upload';

export const GET = withCORS(async (req: Request) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);
    
    if (!decoded || decoded.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current time to filter expired exams
    const now = new Date();

    // Get all live exams (isLive = true) that haven't ended yet
    const liveExams = await prisma.liveExam.findMany({
      where: {
        isLive: true,
        endTime: {
          gt: now // Only show exams that haven't ended yet
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      include: {
        participants: {
          where: { userId: decoded.userId },
          select: { completedAt: true }
        }
      }
    });

    // Add attempted and normalize imageUrl (correct domain for old records)
    const examsWithAttempted = liveExams.map((exam: any) => ({
      ...exam,
      imageUrl: exam.imageUrl ? normalizeUploadUrl(exam.imageUrl) : exam.imageUrl,
      attempted: exam.participants.length > 0 && !!exam.participants[0].completedAt
    }));

    console.log(`Found ${liveExams.length} live exams`)
    console.log('Sample live exam data:', liveExams.length > 0 ? {
      id: liveExams[0].id,
      title: liveExams[0].title,
      imageUrl: liveExams[0].imageUrl,
      hasImageUrl: !!liveExams[0].imageUrl
    } : 'No live exams found')

    return NextResponse.json(examsWithAttempted);
  } catch (error) {
    console.error('Error fetching live exams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 