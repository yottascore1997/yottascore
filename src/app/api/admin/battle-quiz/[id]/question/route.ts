import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quizId = parseInt(params.id, 10);
    const { question, options, correct } = await req.json();
    if (!question || !options || typeof correct !== 'number') {
      return NextResponse.json({ message: 'Invalid question data.' }, { status: 400 });
    }
    const mcq = await prisma.battleQuizQuestion.create({
      data: {
        quizId,
        question,
        options,
        correct,
      },
    });
    return NextResponse.json(mcq);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to add question.' }, { status: 500 });
  }
} 