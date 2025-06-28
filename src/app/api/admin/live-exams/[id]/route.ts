import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { withCORS } from '@/lib/cors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const patchHandler = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { isLive } = body;

    if (typeof isLive !== 'boolean') {
      return NextResponse.json({ message: 'isLive must be a boolean value' }, { status: 400 });
    }

    const updatedExam = await prisma.liveExam.update({
      where: { id },
      data: { isLive },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        questions: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        winners: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedExam);
  } catch (error) {
    console.error('Error updating live exam:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
};

const deleteHandler = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Delete related records first
    await prisma.liveExamParticipant.deleteMany({
      where: { examId: id }
    });

    await prisma.liveExamWinner.deleteMany({
      where: { examId: id }
    });

    await prisma.question.deleteMany({
      where: { examId: id }
    });

    // Delete the exam
    await prisma.liveExam.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting live exam:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
};

export const PATCH = withCORS(patchHandler);
export const DELETE = withCORS(deleteHandler);
export const OPTIONS = withCORS(() => new Response(null, { status: 204 })); 