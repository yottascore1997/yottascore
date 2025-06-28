import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
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

    const quizId = params.id;
    const { isActive, title, description, entryAmount } = await req.json();

    // Verify the quiz exists and belongs to the admin
    const existingQuiz = await prisma.battleQuiz.findFirst({
      where: {
        id: quizId,
        createdById: decoded.userId
      }
    });

    if (!existingQuiz) {
      return NextResponse.json({ message: 'Quiz not found or access denied.' }, { status: 404 });
    }

    // Update the quiz
    const updatedQuiz = await prisma.battleQuiz.update({
      where: { id: quizId },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(entryAmount && { entryAmount: parseFloat(entryAmount) }),
      },
    });

    return NextResponse.json(updatedQuiz);
  } catch (error: any) {
    console.error('Battle Quiz update error:', error);
    return NextResponse.json({ message: error.message || 'Failed to update quiz.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
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

    const quizId = params.id;

    // Verify the quiz exists and belongs to the admin
    const existingQuiz = await prisma.battleQuiz.findFirst({
      where: {
        id: quizId,
        createdById: decoded.userId
      }
    });

    if (!existingQuiz) {
      return NextResponse.json({ message: 'Quiz not found or access denied.' }, { status: 404 });
    }

    // Delete the quiz (this will cascade delete questions, participants, and winners)
    await prisma.battleQuiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({ message: 'Quiz deleted successfully.' });
  } catch (error: any) {
    console.error('Battle Quiz deletion error:', error);
    return NextResponse.json({ message: error.message || 'Failed to delete quiz.' }, { status: 500 });
  }
} 