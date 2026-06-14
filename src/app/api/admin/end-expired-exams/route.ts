import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { withCORS } from '@/lib/cors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Function to check and end expired exams
async function checkAndEndExpiredExams() {
  try {
    const now = new Date();
    
    // Find live exams that have ended (endTime is in the past) OR already ended but not converted
    const expiredExams = await prisma.liveExam.findMany({
      where: {
        endTime: {
          lt: now
        },
        convertedToPractice: false
      },
      include: {
        questions: true
      }
    });
    
    if (expiredExams.length === 0) {
      return { ended: 0, exams: [], convertedToPractice: 0 };
    }
    
    const endedExams: Array<{ id: string; title: string; endTime: Date | null }> = [];
    let convertedToPractice = 0;
    
    for (const exam of expiredExams) {
      // Update exam status to not live if still live
      if (exam.isLive) {
        await prisma.liveExam.update({
          where: { id: exam.id },
          data: { isLive: false }
        });
      }
      
      // Convert to practice exam only if not already converted
      if (!exam.convertedToPractice) {
        try {
          // Create practice exam
          const practiceExam = await prisma.practiceExam.create({
            data: {
              title: `${exam.title} (Practice)`,
              description: exam.description,
              instructions: exam.instructions,
              duration: exam.duration,
              spots: exam.spots,
              spotsLeft: exam.spots,
              startTime: exam.startTime,
              endTime: exam.endTime,
              logoUrl: exam.imageUrl,
              category: exam.category || 'General',
              subcategory: 'Live Exam Archive',
              createdById: exam.createdById,
            }
          });
          
          // Copy questions
          if (exam.questions && exam.questions.length > 0) {
            for (const q of exam.questions) {
              await prisma.practiceExamQuestion.create({
                data: {
                  examId: practiceExam.id,
                  text: q.text,
                  options: q.options,
                  correct: q.correctAnswer,
                  marks: 1,
                }
              });
            }
          }
          
          // Mark as converted
          await prisma.liveExam.update({
            where: { id: exam.id },
            data: { convertedToPractice: true }
          });
          
          convertedToPractice++;
        } catch (convertError) {
          console.error('Error converting live exam to practice:', convertError);
        }
      }
      
      endedExams.push({
        id: exam.id,
        title: exam.title,
        endTime: exam.endTime
      });
      
    }
    
    return { ended: expiredExams.length, exams: endedExams, convertedToPractice };
    
  } catch (error) {
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
      message: `Successfully ended ${result.ended} expired exams and converted ${result.convertedToPractice} to practice exams`,
      ...result
    });
    
  } catch (error) {
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
