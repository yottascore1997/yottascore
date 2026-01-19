import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { examId: string } }) {
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
    const { examId } = params;
    
    // Get exam details to check start time
    const exam = await prisma.liveExam.findUnique({
      where: { id: examId },
      select: { startTime: true }
    });
    
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }
    
    // Check if exam has started
    const now = new Date();
    const startTime = new Date(exam.startTime);
    
    if (now < startTime) {
      return NextResponse.json({ 
        error: 'Exam has not started yet',
        startTime: exam.startTime,
        timeUntilStart: startTime.getTime() - now.getTime()
      }, { status: 403 });
    }
    
    // Check if user is a participant
    const participant = await prisma.liveExamParticipant.findUnique({
      where: {
        examId_userId: {
          examId,
          userId: decoded.userId,
        },
      },
    });
    if (!participant) {
      return NextResponse.json({ error: 'You are not a participant in this exam.' }, { status: 403 });
    }
    // Fetch questions for the exam
    const questions = await prisma.question.findMany({
      where: { examId },
      select: {
        id: true,
        text: true,
        type: true,
        options: true,
      },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 