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
    const exams = await prisma.practiceExam.findMany({
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        title: true,
        spots: true,
        spotsLeft: true,
        startTime: true,
        endTime: true,
      },
    });
    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { title, description, instructions, startTime, endTime, duration, spots, questions, category, subcategory } = body;
    if (!title || !startTime || !duration || !spots || !category || !subcategory) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    console.log('Creating exam with data:', {
      title,
      description,
      instructions,
      category,
      subcategory,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      duration,
      spots,
      spotsLeft: spots,
      createdById: decoded.userId,
      questionsCount: questions?.length || 0
    });
    
    // Try creating without questions first
    const examData = {
      title,
      description,
      instructions,
      category,
      subcategory,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      duration,
      spots,
      spotsLeft: spots,
      createdById: decoded.userId,
    };
    
    console.log('Exam data without questions:', examData);
    
    const exam = await prisma.practiceExam.create({
      data: examData,
    });
    
    console.log('Exam created successfully:', exam.id);
    
    // If there are questions, add them separately
    if (questions && Array.isArray(questions) && questions.length > 0) {
      console.log('Adding questions:', questions.length);
      for (const q of questions) {
        await prisma.practiceExamQuestion.create({
          data: {
            examId: exam.id,
            text: q.text,
            options: q.options,
            correct: q.correct,
            marks: q.marks || 1,
          },
        });
      }
      console.log('Questions added successfully');
    }
    
    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error creating practice exam:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 