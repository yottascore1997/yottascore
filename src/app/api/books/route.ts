import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCORS } from '@/lib/cors';
import { z } from 'zod';
import { calculateDistance, getBoundingBox } from '@/lib/distance';

// Validation schemas
const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  listingType: z.enum(['SELL', 'RENT', 'DONATE']),
  condition: z.enum(['NEW', 'EXCELLENT', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  price: z.number().positive().optional(),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  coverImage: z.string().optional(),
  additionalImages: z.array(z.string()).optional(),
});

const updateBookSchema = createBookSchema.partial();

// GET /api/books - Get all books with filtering and search
export const GET = withCORS(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || '';
    const listingType = searchParams.get('listingType') || '';
    const condition = searchParams.get('condition') || '';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const location = searchParams.get('location') || '';
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : undefined;
    const userLat = searchParams.get('userLat') ? parseFloat(searchParams.get('userLat')!) : undefined;
    const userLng = searchParams.get('userLng') ? parseFloat(searchParams.get('userLng')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      isAvailable: true,
    };

    // Search in title
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    // Category filters
    if (category) {
      where.category = category;
    }
    if (subcategory) {
      where.subcategory = subcategory;
    }
    if (listingType) {
      where.listingType = listingType;
    }
    if (condition) {
      where.condition = condition;
    }

    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.OR = [
        ...(where.OR || []),
        {
          AND: [
            { price: { not: null } },
            ...(minPrice !== undefined ? [{ price: { gte: minPrice } }] : []),
            ...(maxPrice !== undefined ? [{ price: { lte: maxPrice } }] : []),
          ],
        },
        {
          AND: [
            { rentPrice: { not: null } },
            ...(minPrice !== undefined ? [{ rentPrice: { gte: minPrice } }] : []),
            ...(maxPrice !== undefined ? [{ rentPrice: { lte: maxPrice } }] : []),
          ],
        },
      ];
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Distance filter (if user coordinates provided)
    if (userLat && userLng && radius) {
      const boundingBox = getBoundingBox(userLat, userLng, radius);
      
      where.latitude = {
        gte: boundingBox.minLat,
        lte: boundingBox.maxLat,
      };
      where.longitude = {
        gte: boundingBox.minLng,
        lte: boundingBox.maxLng,
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'views') {
      orderBy.views = sortOrder;
    } else if (sortBy === 'likes') {
      orderBy.likes = sortOrder;
    } else if (sortBy === 'distance') {
      // Distance sorting will be handled after fetching data
      orderBy.createdAt = 'desc'; // Default fallback
    }

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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.bookListing.count({ where }),
    ]);

    // Calculate average ratings, parse JSON fields, and add distance
    let booksWithRatings = books.map(book => {
      const avgRating = book.bookReviews.length > 0
        ? book.bookReviews.reduce((sum, review) => sum + review.rating, 0) / book.bookReviews.length
        : 0;

      // Calculate distance if user coordinates provided
      let distance = null;
      if (userLat && userLng && book.latitude && book.longitude) {
        distance = calculateDistance(userLat, userLng, book.latitude, book.longitude);
      }

      return {
        ...book,
        additionalImages: book.additionalImages ? JSON.parse(book.additionalImages as string) : [],
        averageRating: avgRating,
        totalReviews: book.bookReviews.length,
        totalLikes: book._count.bookLikes,
        distance: distance ? Math.round(distance * 10) / 10 : null, // Round to 1 decimal place
      };
    });

    // Sort by distance if requested
    if (sortBy === 'distance' && userLat && userLng) {
      booksWithRatings.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return sortOrder === 'asc' ? a.distance - b.distance : b.distance - a.distance;
      });
    }

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
      },
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
});

// POST /api/books - Create a new book listing
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
    const validatedData = createBookSchema.parse(body);

    // Check if user has a book profile
    let userBookProfile = await prisma.userBookProfile.findUnique({
      where: { userId: decoded.userId },
    });

    // Create book profile if it doesn't exist
    if (!userBookProfile) {
      const locationParts = validatedData.location.split(',');
      userBookProfile = await prisma.userBookProfile.create({
        data: {
          userId: decoded.userId,
          city: locationParts[0]?.trim() || validatedData.location,
          state: locationParts[1]?.trim() || '',
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
        },
      });
    }

    // Create the book listing
    const book = await prisma.bookListing.create({
      data: {
        ...validatedData,
        sellerId: decoded.userId,
        author: 'Unknown', // Default author since we removed it from form
        language: 'English', // Default language
        additionalImages: validatedData.additionalImages ? JSON.stringify(validatedData.additionalImages) : null,
      },
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
      },
    });

    // Update user's total listings count
    await prisma.userBookProfile.update({
      where: { userId: decoded.userId },
      data: {
        totalListings: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error('Error creating book:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create book listing' },
      { status: 500 }
    );
  }
});
