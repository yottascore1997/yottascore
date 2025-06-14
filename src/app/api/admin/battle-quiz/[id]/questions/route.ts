import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quizId = parseInt(params.id, 10);
    const questions = await prisma.battleQuizQuestion.findMany({
      where: { quizId },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(questions);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch questions.' }, { status: 500 });
  }
} 