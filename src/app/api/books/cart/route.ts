import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';

/**
 * GET /api/books/cart
 * Get all books in user's cart
 */
export const GET = withCORS(async (request: NextRequest) => {
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

    // Fetch cart items
    const cartItems = await prisma.bookCart.findMany({
      where: {
        userId: decoded.userId,
      },
      include: {
        book: {
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
                    averageRating: true,
                    totalReviews: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by seller for easy messaging
    const groupedBySeller = cartItems.reduce((acc: any, item) => {
      const sellerId = item.book.sellerId;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller: item.book.seller,
          books: [],
          totalAmount: 0,
        };
      }
      acc[sellerId].books.push(item.book);
      acc[sellerId].totalAmount += item.book.price || item.book.rentPrice || 0;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        cartItems: cartItems.map(item => ({
          ...item,
          book: {
            ...item.book,
            additionalImages: item.book.additionalImages 
              ? JSON.parse(item.book.additionalImages as string) 
              : [],
          },
        })),
        groupedBySeller: Object.values(groupedBySeller),
        totalItems: cartItems.length,
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/books/cart
 * Add book to cart
 */
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
    const { bookId } = body;

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Check if book exists and is available
    const book = await prisma.bookListing.findUnique({
      where: { id: bookId },
      select: { 
        id: true, 
        sellerId: true, 
        isAvailable: true, 
        status: true 
      },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    if (!book.isAvailable || book.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Book is not available' },
        { status: 400 }
      );
    }

    // Can't add own book to cart
    if (book.sellerId === decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'You cannot add your own book to cart' },
        { status: 400 }
      );
    }

    // Check if already in cart
    const existingCartItem = await prisma.bookCart.findUnique({
      where: {
        userId_bookId: {
          userId: decoded.userId,
          bookId: bookId,
        },
      },
    });

    if (existingCartItem) {
      return NextResponse.json(
        { success: false, error: 'Book is already in your cart' },
        { status: 400 }
      );
    }

    // Add to cart
    const cartItem = await prisma.bookCart.create({
      data: {
        userId: decoded.userId,
        bookId: bookId,
      },
      include: {
        book: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Book added to cart',
      data: cartItem,
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/books/cart?bookId=xxx
 * Remove book from cart
 */
export const DELETE = withCORS(async (request: NextRequest) => {
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

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Delete from cart
    await prisma.bookCart.delete({
      where: {
        userId_bookId: {
          userId: decoded.userId,
          bookId: bookId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Book removed from cart',
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from cart' },
      { status: 500 }
    );
  }
});

