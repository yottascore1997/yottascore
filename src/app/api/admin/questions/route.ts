import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Paginated, searchable questions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const search = searchParams.get('search') || '';

  const where = search
    ? { text: { contains: search, mode: 'insensitive' } }
    : {};

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: 'desc' },
      include: { exam: false },
    }),
  ]);

  return NextResponse.json({
    questions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

// POST: Add a new question
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, options, correct, examId } = body;

  if (!text || !options || correct == null) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const newQuestion = await prisma.question.create({
    data: {
      text,
      options,
      correctAnswer: correct,
      examId: examId || undefined,
    },
  });

  return NextResponse.json(newQuestion);
}

// DELETE: Delete a question by ID
export async function DELETE(req: NextRequest) {
  let id;
  // Try to get id from query param or body
  const { searchParams } = new URL(req.url);
  if (searchParams.has('id')) {
    id = searchParams.get('id');
  } else {
    const body = await req.json().catch(() => null);
    id = body?.id;
  }
  if (!id) {
    return NextResponse.json({ message: 'Missing question id' }, { status: 400 });
  }
  try {
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ message: 'Question not found or could not be deleted' }, { status: 404 });
  }
} 