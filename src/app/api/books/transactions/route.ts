import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';
import { z } from 'zod';

const createTransactionSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  transactionType: z.enum(['SELL', 'RENT', 'DONATE']),
  message: z.string().min(1, 'Message is required'),
});

// POST /api/books/transactions - Create a new transaction
export const POST = withCORS(async (request: NextRequest) => {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    // Check if book exists and get seller details
    const book = await prisma.bookListing.findUnique({
      where: { id: validatedData.bookId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    if (book.sellerId === decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot contact yourself' },
        { status: 400 }
      );
    }

    // Check if transaction already exists
    const existingTransaction = await prisma.bookTransaction.findFirst({
      where: {
        bookId: validatedData.bookId,
        buyerId: decoded.userId,
        status: 'PENDING',
      },
    });

    if (existingTransaction) {
      return NextResponse.json(
        { success: false, error: 'You have already contacted this seller' },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await prisma.bookTransaction.create({
      data: {
        bookId: validatedData.bookId,
        buyerId: decoded.userId,
        sellerId: book.sellerId,
        transactionType: validatedData.transactionType,
        status: 'PENDING',
        buyerNotes: validatedData.message,
      },
      include: {
        book: {
          select: {
            title: true,
            price: true,
            rentPrice: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
});
