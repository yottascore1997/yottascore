import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

/**
 * GET /api/books/my-listings
 * Get all book listings created by the authenticated user
 */
export const GET = withCORS(async (request: NextRequest) => {
  try {
    // Verify authentication
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || ''; // Filter by status
    const listingType = searchParams.get('listingType') || ''; // Filter by type

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      sellerId: decoded.userId, // Only user's own listings
    };

    // Optional filters
    if (status) {
      where.status = status;
    }
    if (listingType) {
      where.listingType = listingType;
    }

    // Fetch user's book listings
    const [books, total] = await Promise.all([
      prisma.bookListing.findMany({
        where,
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
              rating: true,
            },
          },
          _count: {
            select: {
              bookLikes: true,
              bookReviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookListing.count({ where }),
    ]);

    // Calculate average ratings and parse JSON fields
    const booksWithRatings = books.map(book => {
      const avgRating = book.bookReviews.length > 0
        ? book.bookReviews.reduce((sum, review) => sum + review.rating, 0) / book.bookReviews.length
        : 0;

      return {
        ...book,
        additionalImages: book.additionalImages ? JSON.parse(book.additionalImages as string) : [],
        averageRating: avgRating,
        totalReviews: book.bookReviews.length,
        totalLikes: book._count.bookLikes,
      };
    });

    // Get summary statistics
    const stats = await prisma.bookListing.groupBy({
      by: ['status'],
      where: { sellerId: decoded.userId },
      _count: true,
    });

    const summary = {
      total: total,
      active: stats.find(s => s.status === 'ACTIVE')?._count || 0,
      sold: stats.find(s => s.status === 'SOLD')?._count || 0,
      rented: stats.find(s => s.status === 'RENTED')?._count || 0,
      inactive: stats.find(s => s.status === 'INACTIVE')?._count || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        books: booksWithRatings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch your book listings' },
      { status: 500 }
    );
  }
});

