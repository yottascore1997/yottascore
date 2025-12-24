import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
    const exam = await prisma.practiceExam.findUnique({
      where: { id: params.id },
      include: { questions: true },
    });
    if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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
    const { title, description, instructions, startTime, endTime, duration, spots, category, subcategory } = body;
    const exam = await prisma.practiceExam.update({
      where: { id: params.id },
      data: {
        title,
        description,
        instructions,
        category,
        subcategory,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : null,
        duration,
        spots,
      },
    });
    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    // Check if exam exists
    const exam = await prisma.practiceExam.findUnique({
      where: { id: params.id },
      select: { id: true, createdById: true }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Verify the exam belongs to the admin
    if (exam.createdById !== decoded.userId) {
      return NextResponse.json({ error: 'You can only delete your own exams' }, { status: 403 });
    }

    // Delete related data first (due to foreign key constraints)
    // 1. Delete all participants
    await prisma.practiceExamParticipant.deleteMany({
      where: { examId: params.id }
    });

    // 2. Delete all questions
    await prisma.practiceExamQuestion.deleteMany({
      where: { examId: params.id }
    });

    // 3. Now delete the exam
    await prisma.practiceExam.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Exam deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting exam:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Cannot delete exam. It has related records that need to be removed first.',
        details: error.meta?.field_name 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to delete exam'
    }, { status: 500 });
  }
} 