import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';
import { z } from 'zod';

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  isbn: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  rentPrice: z.number().positive().optional(),
  listingType: z.enum(['SELL', 'RENT', 'DONATE']).optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).optional(),
  category: z.string().min(1).optional(),
  subcategory: z.string().optional(),
  class: z.string().optional(),
  subject: z.string().optional(),
  examType: z.string().optional(),
  language: z.string().optional(),
  pages: z.number().positive().optional(),
  publisher: z.string().optional(),
  publishedYear: z.number().positive().optional(),
  edition: z.string().optional(),
  location: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  coverImage: z.string().url().optional(),
  additionalImages: z.array(z.string().url()).optional(),
  isAvailable: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'RENTED', 'DONATED', 'INACTIVE', 'REMOVED']).optional(),
});

// GET /api/books/[id] - Get a specific book
export const GET = withCORS(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const book = await prisma.bookListing.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            phoneNumber: true,
            bookProfile: {
              select: {
                isVerified: true,
                city: true,
                state: true,
                averageRating: true,
                totalReviews: true,
                totalListings: true,
                totalSales: true,
                totalRentals: true,
                totalDonations: true,
              },
            },
          },
        },
        bookLikes: {
          select: {
            userId: true,
          },
        },
        bookReviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            isVerified: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            bookLikes: true,
            bookReviews: true,
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

    // Calculate average rating
    const avgRating = book.bookReviews.length > 0
      ? book.bookReviews.reduce((sum, review) => sum + review.rating, 0) / book.bookReviews.length
      : 0;

    // Increment view count
    await prisma.bookListing.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...book,
        additionalImages: book.additionalImages ? JSON.parse(book.additionalImages as string) : [],
        averageRating: avgRating,
        totalReviews: book._count.bookReviews,
        totalLikes: book._count.bookLikes,
      },
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch book' },
      { status: 500 }
    );
  }
});

// PUT /api/books/[id] - Update a specific book
export const PUT = withCORS(async (
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

    const body = await request.json();
    const validatedData = updateBookSchema.parse(body);

    // Check if book exists and user owns it
    const existingBook = await prisma.bookListing.findUnique({
      where: { id: params.id },
      select: { sellerId: true },
    });

    if (!existingBook) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    if (existingBook.sellerId !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this book' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    if (validatedData.availableFrom) {
      updateData.availableFrom = new Date(validatedData.availableFrom);
    }
    if (validatedData.availableUntil) {
      updateData.availableUntil = new Date(validatedData.availableUntil);
    }

    const book = await prisma.bookListing.update({
      where: { id: params.id },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bookProfile: {
              select: {
                isVerified: true,
                city: true,
                state: true,
                averageRating: true,
                totalReviews: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error('Error updating book:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update book' },
      { status: 500 }
    );
  }
});

// DELETE /api/books/[id] - Delete a specific book
export const DELETE = withCORS(async (
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

    // Check if book exists and user owns it
    const existingBook = await prisma.bookListing.findUnique({
      where: { id: params.id },
      select: { sellerId: true },
    });

    if (!existingBook) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    if (existingBook.sellerId !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this book' },
        { status: 403 }
      );
    }

    // Soft delete by updating status
    await prisma.bookListing.update({
      where: { id: params.id },
      data: { 
        status: 'REMOVED',
        isAvailable: false,
      },
    });

    // Update user's total listings count
    await prisma.userBookProfile.update({
      where: { userId: decoded.userId },
      data: {
        totalListings: { decrement: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Book listing deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete book' },
      { status: 500 }
    );
  }
});
