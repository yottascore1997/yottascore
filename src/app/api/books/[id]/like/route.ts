import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

// POST /api/books/[id]/like - Like or unlike a book
export const POST = withCORS(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
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

    // Check if user already liked this book
    const existingLike = await prisma.bookLike.findUnique({
      where: {
        userId_bookId: {
          userId: decoded.userId,
          bookId: params.id,
        },
      },
    });

    if (existingLike) {
      // Unlike the book
      await prisma.bookLike.delete({
        where: {
          userId_bookId: {
            userId: decoded.userId,
            bookId: params.id,
          },
        },
      });

      // Decrement likes count
      await prisma.bookListing.update({
        where: { id: params.id },
        data: { likes: { decrement: 1 } },
      });

      return NextResponse.json({
        success: true,
        liked: false,
        message: 'Book unliked successfully',
      });
    } else {
      // Like the book
      await prisma.bookLike.create({
        data: {
          userId: decoded.userId,
          bookId: params.id,
        },
      });

      // Increment likes count
      await prisma.bookListing.update({
        where: { id: params.id },
        data: { likes: { increment: 1 } },
      });

      return NextResponse.json({
        success: true,
        liked: true,
        message: 'Book liked successfully',
      });
    }
  } catch (error) {
    console.error('Error toggling book like:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle book like' },
      { status: 500 }
    );
  }
});

// GET /api/books/[id]/like - Check if user liked the book
export const GET = withCORS(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
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

    const like = await prisma.bookLike.findUnique({
      where: {
        userId_bookId: {
          userId: decoded.userId,
          bookId: params.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      liked: !!like,
    });
  } catch (error) {
    console.error('Error checking book like:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check book like status' },
      { status: 500 }
    );
  }
});
