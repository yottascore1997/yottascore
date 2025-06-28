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

    const categories = await prisma.questionCategory.findMany({
      where: {
        createdById: decoded.userId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            questions: true,
            battleQuizzes: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Question categories fetch error:', error);
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

    const { name, description, color } = await req.json();
    
    if (!name) {
      return NextResponse.json({ message: 'Category name is required.' }, { status: 400 });
    }

    // Check if category name already exists
    const existingCategory = await prisma.questionCategory.findFirst({
      where: {
        name: name.trim(),
        createdById: decoded.userId
      }
    });

    if (existingCategory) {
      return NextResponse.json({ message: 'Category with this name already exists.' }, { status: 400 });
    }

    const category = await prisma.questionCategory.create({
      data: {
        name: name.trim(),
        description,
        color,
        createdById: decoded.userId,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Question category creation error:', error);
    return NextResponse.json({ message: error.message || 'Failed to create category.' }, { status: 500 });
  }
} 