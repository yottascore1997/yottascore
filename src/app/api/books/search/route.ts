import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// GET /api/books/search - Advanced search with location-based filtering
export async function GET(request: NextRequest) {
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
    const classFilter = searchParams.get('class') || '';
    const subjectFilter = searchParams.get('subject') || '';
    const examTypeFilter = searchParams.get('examType') || '';
    const languageFilter = searchParams.get('language') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      isAvailable: true,
    };

    // Search in title, author, description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
      ];
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
    if (classFilter) {
      where.class = classFilter;
    }
    if (subjectFilter) {
      where.subject = subjectFilter;
    }
    if (examTypeFilter) {
      where.examType = examTypeFilter;
    }
    if (languageFilter) {
      where.language = languageFilter;
    }

    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceConditions = [];
      
      if (listingType === 'SELL' || !listingType) {
        priceConditions.push({
          AND: [
            { price: { not: null } },
            ...(minPrice !== undefined ? [{ price: { gte: minPrice } }] : []),
            ...(maxPrice !== undefined ? [{ price: { lte: maxPrice } }] : []),
          ],
        });
      }
      
      if (listingType === 'RENT' || !listingType) {
        priceConditions.push({
          AND: [
            { rentPrice: { not: null } },
            ...(minPrice !== undefined ? [{ rentPrice: { gte: minPrice } }] : []),
            ...(maxPrice !== undefined ? [{ rentPrice: { lte: maxPrice } }] : []),
          ],
        });
      }

      if (priceConditions.length > 0) {
        where.OR = [
          ...(where.OR || []),
          ...priceConditions,
        ];
      }
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Get all books first (for distance calculation)
    const allBooks = await prisma.bookListing.findMany({
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
    });

    // Filter by distance if user coordinates provided
    let filteredBooks = allBooks;
    if (userLat && userLng && radius) {
      filteredBooks = allBooks.filter(book => {
        if (!book.latitude || !book.longitude) return false;
        const distance = calculateDistance(userLat, userLng, book.latitude, book.longitude);
        return distance <= radius;
      });
    }

    // Sort books
    filteredBooks.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'price') {
        const aPrice = a.price || a.rentPrice || 0;
        const bPrice = b.price || b.rentPrice || 0;
        comparison = aPrice - bPrice;
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'views') {
        comparison = a.views - b.views;
      } else if (sortBy === 'likes') {
        comparison = a.likes - b.likes;
      } else if (sortBy === 'distance' && userLat && userLng) {
        const aDistance = a.latitude && a.longitude 
          ? calculateDistance(userLat, userLng, a.latitude, a.longitude)
          : Infinity;
        const bDistance = b.latitude && b.longitude 
          ? calculateDistance(userLat, userLng, b.latitude, b.longitude)
          : Infinity;
        comparison = aDistance - bDistance;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Paginate results
    const total = filteredBooks.length;
    const paginatedBooks = filteredBooks.slice(skip, skip + limit);

    // Calculate average ratings and add distance
    const booksWithMetadata = paginatedBooks.map(book => {
      const avgRating = book.bookReviews.length > 0
        ? book.bookReviews.reduce((sum, review) => sum + review.rating, 0) / book.bookReviews.length
        : 0;

      const distance = (userLat && userLng && book.latitude && book.longitude)
        ? calculateDistance(userLat, userLng, book.latitude, book.longitude)
        : null;

      return {
        ...book,
        averageRating: avgRating,
        totalReviews: book._count.bookReviews,
        totalLikes: book._count.bookLikes,
        distance,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        books: booksWithMetadata,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        filters: {
          search,
          category,
          subcategory,
          listingType,
          condition,
          minPrice,
          maxPrice,
          location,
          radius,
          class: classFilter,
          subject: subjectFilter,
          examType: examTypeFilter,
          language: languageFilter,
        },
      },
    });
  } catch (error) {
    console.error('Error searching books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search books' },
      { status: 500 }
    );
  }
}
