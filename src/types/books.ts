export interface BookListing {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  price?: number;
  rentPrice?: number;
  listingType: 'SELL' | 'RENT' | 'DONATE';
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  category: string;
  subcategory?: string;
  class?: string;
  subject?: string;
  examType?: string;
  language: string;
  pages?: number;
  publisher?: string;
  publishedYear?: number;
  edition?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  isAvailable: boolean;
  availableFrom?: string;
  availableUntil?: string;
  coverImage?: string;
  additionalImages?: string[];
  status: 'ACTIVE' | 'SOLD' | 'RENTED' | 'DONATED' | 'INACTIVE' | 'REMOVED';
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    name?: string;
    username?: string;
    image?: string;
    phoneNumber?: string;
    bookProfile?: {
      isVerified: boolean;
      city?: string;
      state?: string;
      totalListings?: number;
      averageRating: number;
      totalReviews: number;
    };
  };
  averageRating?: number;
  totalReviews?: number;
  totalLikes?: number;
  distance?: number;
}

export interface BookFilters {
  search: string;
  category: string;
  subcategory: string;
  listingType: string;
  condition: string;
  minPrice?: number;
  maxPrice?: number;
  location: string;
  radius: number;
  class: string;
  subject: string;
  examType: string;
  language: string;
  sortBy?: string;
}

export interface BookReview {
  id: string;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    username?: string;
    image?: string;
  };
}

export interface BookWishlist {
  id: string;
  userId: string;
  bookId: string;
  notifyOnPriceDrop: boolean;
  notifyOnAvailability: boolean;
  maxPrice?: number;
  maxDistance?: number;
  createdAt: string;
  book: BookListing;
}

export interface BookTransaction {
  id: string;
  transactionType: 'SALE' | 'RENTAL' | 'DONATION';
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  amount?: number;
  currency: string;
  paymentMethod?: string;
  paymentId?: string;
  startDate?: string;
  endDate?: string;
  returnDate?: string;
  isReturned: boolean;
  meetingLocation?: string;
  meetingTime?: string;
  sellerNotes?: string;
  buyerNotes?: string;
  createdAt: string;
  updatedAt: string;
  book: BookListing;
  buyer: {
    id: string;
    name?: string;
    username?: string;
    image?: string;
  };
  seller: {
    id: string;
    name?: string;
    username?: string;
    image?: string;
  };
}

export interface UserBookProfile {
  id: string;
  userId: string;
  isVerified: boolean;
  verificationType?: 'COLLEGE_EMAIL' | 'STUDENT_ID' | 'COLLEGE_ID' | 'AADHAR_VERIFIED';
  collegeEmail?: string;
  studentId?: string;
  collegeName?: string;
  graduationYear?: number;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  preferredLanguage: string;
  maxDistance: number;
  notificationSettings?: Record<string, any>;
  totalListings: number;
  totalSales: number;
  totalRentals: number;
  totalDonations: number;
  averageRating: number;
  totalReviews: number;
  badges?: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    username?: string;
    image?: string;
    email?: string;
  };
}

export interface BookCategories {
  [key: string]: {
    name: string;
    subcategories: string[];
  };
}

export const BOOK_CATEGORIES: BookCategories = {
  'Academic': {
    name: 'Academic',
    subcategories: ['Textbooks', 'Reference Books', 'Study Materials', 'Lab Manuals'],
  },
  'Exam Preparation': {
    name: 'Exam Preparation',
    subcategories: ['Engineering', 'Medical', 'Civil Services', 'Banking', 'SSC', 'Railway', 'Defense', 'Other'],
  },
  'Literature': {
    name: 'Literature',
    subcategories: ['Fiction', 'Non-Fiction', 'Poetry', 'Drama', 'Biography', 'Autobiography'],
  },
  'Language Learning': {
    name: 'Language Learning',
    subcategories: ['English', 'Hindi', 'Sanskrit', 'French', 'German', 'Spanish', 'Other'],
  },
  'Technical': {
    name: 'Technical',
    subcategories: ['Computer Science', 'Engineering', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
  },
  'Business': {
    name: 'Business',
    subcategories: ['Management', 'Finance', 'Marketing', 'Economics', 'Commerce'],
  },
  'Arts & Design': {
    name: 'Arts & Design',
    subcategories: ['Fine Arts', 'Graphic Design', 'Architecture', 'Photography', 'Music'],
  },
  'Other': {
    name: 'Other',
    subcategories: ['General Knowledge', 'Self Help', 'Religion', 'Philosophy', 'History', 'Geography'],
  },
};

export const BOOK_CONDITIONS = [
  { value: 'NEW', label: 'New', description: 'Brand new, never used' },
  { value: 'LIKE_NEW', label: 'Like New', description: 'Excellent condition, minimal wear' },
  { value: 'GOOD', label: 'Good', description: 'Good condition, some wear but functional' },
  { value: 'FAIR', label: 'Fair', description: 'Fair condition, noticeable wear' },
  { value: 'POOR', label: 'Poor', description: 'Poor condition, significant wear' },
];

export const LISTING_TYPES = [
  { value: 'SELL', label: 'Sell', description: 'Sell the book permanently' },
  { value: 'RENT', label: 'Rent', description: 'Rent the book for a period' },
  { value: 'DONATE', label: 'Donate', description: 'Give away for free' },
];

export const DISTANCE_OPTIONS = [
  { value: 1, label: '1 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
];

export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'likes', label: 'Most Liked' },
  { value: 'distance', label: 'Nearest First' },
];
