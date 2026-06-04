import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { normalizeUploadUrl } from '@/lib/upload';

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
    type: z.enum(["MCQ", "TRUE_FALSE"]).default("MCQ"),
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

    // Normalize imageUrl in response so old records show correct domain (yottascore.com)
    const normalized = liveExams.map((exam) => ({
      ...exam,
      imageUrl: exam.imageUrl ? normalizeUploadUrl(exam.imageUrl) : exam.imageUrl,
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
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
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
} catch (error) {
return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
let validatedData;
    try {
      validatedData = createLiveExamSchema.parse(body);
} catch (error) {
return NextResponse.json({ 
        error: 'Validation error', 
        details: error instanceof z.ZodError ? error.errors : 'Invalid data format'
      }, { status: 400 });
    }

    const totalCollection = validatedData.spots * validatedData.entryFee;
    const prizePool = totalCollection * 0.9; // 90% goes to prize pool

const imageUrlToSave = normalizeUploadUrl(validatedData.imageUrl);

    const liveExam = await prisma.liveExam.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        category: validatedData.category,
        imageUrl: imageUrlToSave,
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
            type: q.type || "MCQ",
            options: q.options,
            correctAnswer: q.correctAnswer
          }))
        }
      }
    });

// Set up auto-end timer for this exam if it has an endTime
    if (liveExam.endTime) {
      try {
        const endTimeDate = new Date(liveExam.endTime);
        const now = new Date();
        const timeUntilEnd = endTimeDate.getTime() - now.getTime();
        
        if (timeUntilEnd > 0) {
// Note: The actual timer will be set up by the socket server
          // This is just for logging purposes
        }
      } catch {}
    }
    
    return NextResponse.json(liveExam);
  } catch (error) {
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