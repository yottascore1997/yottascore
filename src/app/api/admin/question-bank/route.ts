import { NextRequest, NextResponse } from 'next/server';
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
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const difficulty = searchParams.get('difficulty');

    const questions = await prisma.questionBankItem.findMany({
      where: {
        createdById: decoded.userId,
        isActive: true,
        ...(categoryId && { categoryId }),
        ...(difficulty && { difficulty: difficulty as any }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Question bank fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { text, options, correct, explanation, difficulty, tags, categoryId } = await req.json();
    
    if (!text || !options || typeof correct !== 'number' || !categoryId) {
      return NextResponse.json({ message: 'Question text, options, correct answer, and category are required.' }, { status: 400 });
    }

    // Verify category exists and belongs to admin
    const category = await prisma.questionCategory.findFirst({
      where: {
        id: categoryId,
        createdById: decoded.userId
      }
    });

    if (!category) {
      return NextResponse.json({ message: 'Category not found or access denied.' }, { status: 404 });
    }

    const question = await prisma.questionBankItem.create({
      data: {
        text,
        options,
        correct,
        explanation,
        difficulty: difficulty || 'MEDIUM',
        tags,
        categoryId,
        createdById: decoded.userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    return NextResponse.json(question);
  } catch (error: any) {
    console.error('Question bank creation error:', error);
    return NextResponse.json({ message: error.message || 'Failed to create question.' }, { status: 500 });
  }
} 