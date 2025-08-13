import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Validation schema for live exam creation
const createLiveExamSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  instructions: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number().min(1),
  spots: z.number().min(1),
  entryFee: z.number().min(0),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number()
  }))
});

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

    const liveExams = await prisma.liveExam.findMany({
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

    return NextResponse.json(liveExams);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('[LIVE_EXAMS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log('Received request to create live exam');
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header or invalid format');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      console.log('Token decoded:', { userId: decoded.userId, role: decoded.role });
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      console.log('User is not an admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    console.log('Request body:', body);

    let validatedData;
    try {
      validatedData = createLiveExamSchema.parse(body);
      console.log('Validated data:', validatedData);
    } catch (error) {
      console.error('Validation error:', error);
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error instanceof z.ZodError ? error.errors : 'Invalid data format'
      }, { status: 400 });
    }

    const totalCollection = validatedData.spots * validatedData.entryFee;
    const prizePool = totalCollection * 0.9; // 90% goes to prize pool

    console.log('Creating live exam with data:', {
      title: validatedData.title,
      description: validatedData.description,
      instructions: validatedData.instructions,
      category: validatedData.category,
      imageUrl: validatedData.imageUrl,
      startTime: new Date(validatedData.startTime),
      endTime: new Date(validatedData.endTime),
      duration: validatedData.duration,
      spots: validatedData.spots,
      spotsLeft: validatedData.spots,
      entryFee: validatedData.entryFee,
      totalCollection,
      prizePool,
      createdById: decoded.userId,
      questionsCount: validatedData.questions.length
    });

    const liveExam = await prisma.liveExam.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        category: validatedData.category,
        imageUrl: validatedData.imageUrl,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        duration: validatedData.duration,
        spots: validatedData.spots,
        spotsLeft: validatedData.spots,
        entryFee: validatedData.entryFee,
        totalCollection,
        prizePool,
        createdById: decoded.userId,
        questions: {
          create: validatedData.questions.map((q: any) => ({
            text: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer
          }))
        }
      }
    });

    console.log('Live exam created successfully:', liveExam);
    return NextResponse.json(liveExam);
  } catch (error) {
    console.error('[LIVE_EXAMS_POST] Detailed error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 