import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addToWishlistSchema = z.object({
  notifyOnPriceDrop: z.boolean().default(true),
  notifyOnAvailability: z.boolean().default(true),
  maxPrice: z.number().positive().optional(),
  maxDistance: z.number().positive().optional(),
});

// POST /api/books/[id]/wishlist - Add book to wishlist
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decoded = token ? await verifyToken(token) : null;
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = addToWishlistSchema.parse(body);

    // Check if book exists
    const book = await prisma.bookListing.findUnique({
      where: { id: params.id },
      select: { id: true, sellerId: true },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if user already has this book in wishlist
    const existingWishlist = await prisma.bookWishlist.findUnique({
      where: {
        userId_bookId: {
          userId: decoded.userId,
          bookId: params.id,
        },
      },
    });

    if (existingWishlist) {
      return NextResponse.json(
        { success: false, error: 'Book is already in your wishlist' },
        { status: 400 }
      );
    }

    // Add to wishlist
    const wishlistItem = await prisma.bookWishlist.create({
      data: {
        userId: decoded.userId,
        bookId: params.id,
        notifyOnPriceDrop: validatedData.notifyOnPriceDrop,
        notifyOnAvailability: validatedData.notifyOnAvailability,
        maxPrice: validatedData.maxPrice,
        maxDistance: validatedData.maxDistance,
      },
    });

    return NextResponse.json({
      success: true,
      data: wishlistItem,
      message: 'Book added to wishlist successfully',
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to add book to wishlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id]/wishlist - Remove book from wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decoded = token ? await verifyToken(token) : null;
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if book is in user's wishlist
    const existingWishlist = await prisma.bookWishlist.findUnique({
      where: {
        userId_bookId: {
          userId: decoded.userId,
          bookId: params.id,
        },
      },
    });

    if (!existingWishlist) {
      return NextResponse.json(
        { success: false, error: 'Book is not in your wishlist' },
        { status: 404 }
      );
    }

    // Remove from wishlist
    await prisma.bookWishlist.delete({
      where: {
        userId_bookId: {
          userId: decoded.userId,
          bookId: params.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Book removed from wishlist successfully',
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove book from wishlist' },
      { status: 500 }
    );
  }
}

// GET /api/books/[id]/wishlist - Check if book is in user's wishlist
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decoded = token ? await verifyToken(token) : null;
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const wishlistItem = await prisma.bookWishlist.findUnique({
      where: {
        userId_bookId: {
          userId: decoded.userId,
          bookId: params.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      inWishlist: !!wishlistItem,
      data: wishlistItem,
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check wishlist status' },
      { status: 500 }
    );
  }
}
