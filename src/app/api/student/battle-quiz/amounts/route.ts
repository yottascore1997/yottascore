import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Default amounts if no custom amounts are set
const DEFAULT_AMOUNTS = [5, 10, 25, 35, 50, 75, 100];

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
    }

    // Get custom amounts for this category
    const customAmounts = await prisma.battleQuizAmount.findMany({
      where: {
        categoryId: categoryId,
        isActive: true
      },
      orderBy: {
        amount: 'asc'
      }
    });

    // If no custom amounts, return default amounts
    if (customAmounts.length === 0) {
      const defaultAmounts = DEFAULT_AMOUNTS.map(amount => ({
        id: `default_${amount}`,
        categoryId: categoryId,
        amount: amount,
        isActive: true,
        maxPlayers: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      return NextResponse.json(defaultAmounts);
    }

    return NextResponse.json(customAmounts);
  } catch (error: any) {
    console.error('Error fetching battle quiz amounts:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
} 