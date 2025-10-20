import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/user/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decoded = token ? await verifyToken(token) : null;
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [wishlistItems, total] = await Promise.all([
      prisma.bookWishlist.findMany({
        where: { userId: decoded.userId },
        include: {
          book: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookWishlist.count({
        where: { userId: decoded.userId },
      }),
    ]);

    // Calculate average ratings for books
    const wishlistWithRatings = wishlistItems.map(item => {
      const avgRating = item.book.bookReviews.length > 0
        ? item.book.bookReviews.reduce((sum, review) => sum + review.rating, 0) / item.book.bookReviews.length
        : 0;

      return {
        ...item,
        book: {
          ...item.book,
          averageRating: avgRating,
          totalReviews: item.book._count.bookReviews,
          totalLikes: item.book._count.bookLikes,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        wishlist: wishlistWithRatings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}
