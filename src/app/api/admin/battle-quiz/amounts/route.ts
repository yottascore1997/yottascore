import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Default amounts for all categories
const DEFAULT_AMOUNTS = [5, 10, 25, 35, 50, 75, 100];

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (categoryId) {
      // Get amounts for specific category
      const amounts = await prisma.battleQuizAmount.findMany({
        where: {
          categoryId: categoryId,
          isActive: true
        },
        orderBy: {
          amount: 'asc'
        }
      });

      return NextResponse.json(amounts);
    } else {
      // Get all categories with their amounts
      const categories = await prisma.questionCategory.findMany({
        where: {
          isActive: true
        },
        include: {
          battleQuizAmounts: {
            where: {
              isActive: true
            },
            orderBy: {
              amount: 'asc'
            }
          }
        }
      });

      return NextResponse.json(categories);
    }
  } catch (error: any) {
    console.error('Error fetching battle quiz amounts:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { categoryId, amounts } = await req.json();

    if (!categoryId || !amounts || !Array.isArray(amounts)) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }

    // Verify category exists
    const category = await prisma.questionCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    // Delete existing amounts for this category
    await prisma.battleQuizAmount.deleteMany({
      where: { categoryId }
    });

    // Create new amounts
    const createdAmounts = await Promise.all(
      amounts.map(async (amount: number) => {
        return await prisma.battleQuizAmount.create({
          data: {
            categoryId,
            amount: parseFloat(amount.toString()),
            isActive: true,
            maxPlayers: 1000
          }
        });
      })
    );

    return NextResponse.json({
      message: 'Amounts updated successfully',
      amounts: createdAmounts
    });
  } catch (error: any) {
    console.error('Error updating battle quiz amounts:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id, isActive, maxPlayers } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'Amount ID is required' }, { status: 400 });
    }

    const updatedAmount = await prisma.battleQuizAmount.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        maxPlayers: maxPlayers !== undefined ? maxPlayers : undefined
      }
    });

    return NextResponse.json({
      message: 'Amount updated successfully',
      amount: updatedAmount
    });
  } catch (error: any) {
    console.error('Error updating battle quiz amount:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
} 