'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookListing, BookReview } from '@/types/books';
import { 
  HeartIcon, 
  MapPinIcon, 
  StarIcon, 
  EyeIcon, 
  UserIcon,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface BookDetailPageProps {
  params: { id: string };
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  const router = useRouter();
  const [book, setBook] = useState<BookListing | null>(null);
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    fetchBookDetails();
    const token = localStorage.getItem('token');
    if (token) {
      checkUserInteractions();
    }
  }, [params.id]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/books/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setBook(data.data);
      } else {
        console.error('Failed to fetch book:', data.error);
      }
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserInteractions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [likeResponse, wishlistResponse] = await Promise.all([
        fetch(`/api/books/${params.id}/like`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/books/${params.id}/wishlist`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      const [likeData, wishlistData] = await Promise.all([
        likeResponse.json(),
        wishlistResponse.json(),
      ]);

      if (likeData.success) {
        setIsLiked(likeData.liked);
      }
      if (wishlistData.success) {
        setIsInWishlist(wishlistData.inWishlist);
      }
    } catch (error) {
      console.error('Error checking user interactions:', error);
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`/api/books/${params.id}/like`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setIsLiked(data.liked);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`/api/books/${params.id}/wishlist`, {
        method: isInWishlist ? 'DELETE' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setIsInWishlist(!isInWishlist);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleContactSeller = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (!contactMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      // Create a transaction record
      const response = await fetch('/api/books/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: book.id,
          transactionType: book.listingType,
          message: contactMessage,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Open WhatsApp with pre-filled message
        const whatsappMessage = `Hi! I'm interested in your book "${book.title}". ${contactMessage}`;
        const whatsappUrl = `https://wa.me/${book.seller.phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, '_blank');
        
        setShowContactForm(false);
        setContactMessage('');
      } else {
        alert('Failed to initiate contact. Please try again.');
      }
    } catch (error) {
      console.error('Error contacting seller:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleReport = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    // Implement report functionality
    alert('Report functionality will be implemented');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h1>
          <p className="text-gray-600 mb-6">The book you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/books')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse Books
          </button>
        </div>
      </div>
    );
  }

  const getPriceDisplay = () => {
    if (book.listingType === 'DONATE') {
      return 'Free';
    }
    if (book.listingType === 'RENT' && book.rentPrice) {
      return `₹${book.rentPrice}/day`;
    }
    if (book.price) {
      return `₹${book.price}`;
    }
    return 'Price on request';
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'bg-green-100 text-green-800';
      case 'LIKE_NEW': return 'bg-blue-100 text-blue-800';
      case 'GOOD': return 'bg-yellow-100 text-yellow-800';
      case 'FAIR': return 'bg-orange-100 text-orange-800';
      case 'POOR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getListingTypeColor = (type: string) => {
    switch (type) {
      case 'SELL': return 'bg-blue-100 text-blue-800';
      case 'RENT': return 'bg-purple-100 text-purple-800';
      case 'DONATE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Book Images */}
              <div className="aspect-[4/3] bg-gray-100">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📚</div>
                      <div className="text-lg">No Image Available</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{book.title}</h1>
                    <p className="text-lg text-gray-600">by {book.author}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleLike}
                      className={`p-2 rounded-full transition-colors ${
                        isLiked 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isLiked ? (
                        <HeartSolidIcon className="w-5 h-5" />
                      ) : (
                        <HeartIcon className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={handleWishlist}
                      className={`p-2 rounded-full transition-colors ${
                        isInWishlist 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <HeartIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                      <ShareIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getListingTypeColor(book.listingType)}`}>
                    {book.listingType}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getConditionColor(book.condition)}`}>
                    {book.condition.replace('_', ' ')}
                  </span>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                    {book.category}
                  </span>
                  {book.subcategory && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                      {book.subcategory}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  {getPriceDisplay()}
                </div>

                {/* Description */}
                {book.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{book.description}</p>
                  </div>
                )}

                {/* Book Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {book.isbn && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">ISBN:</span>
                      <p className="text-gray-900">{book.isbn}</p>
                    </div>
                  )}
                  {book.pages && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Pages:</span>
                      <p className="text-gray-900">{book.pages}</p>
                    </div>
                  )}
                  {book.publisher && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Publisher:</span>
                      <p className="text-gray-900">{book.publisher}</p>
                    </div>
                  )}
                  {book.publishedYear && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Published:</span>
                      <p className="text-gray-900">{book.publishedYear}</p>
                    </div>
                  )}
                  {book.edition && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Edition:</span>
                      <p className="text-gray-900">{book.edition}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Language:</span>
                    <p className="text-gray-900">{book.language}</p>
                  </div>
                </div>

                {/* Academic Details */}
                {(book.class || book.subject || book.examType) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Academic Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {book.class && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Class:</span>
                          <p className="text-gray-900">{book.class}</p>
                        </div>
                      )}
                      {book.subject && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Subject:</span>
                          <p className="text-gray-900">{book.subject}</p>
                        </div>
                      )}
                      {book.examType && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Exam Type:</span>
                          <p className="text-gray-900">{book.examType}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center text-gray-600 mb-6">
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  <span>{book.location}</span>
                  {book.distance && (
                    <span className="ml-2 text-green-600">
                      ({book.distance.toFixed(1)} km away)
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{book.views} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="w-4 h-4" />
                    <span>{book.totalLikes || 0} likes</span>
                  </div>
                  {book.averageRating && book.averageRating > 0 && (
                    <div className="flex items-center space-x-1">
                      <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{book.averageRating.toFixed(1)} ({book.totalReviews || 0} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Seller Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                  {book.seller.image ? (
                    <img
                      src={book.seller.image}
                      alt={book.seller.name || book.seller.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {book.seller.name || book.seller.username}
                  </h4>
                  {book.seller.bookProfile?.isVerified && (
                    <p className="text-sm text-green-600">✓ Verified Seller</p>
                  )}
                  {book.seller.bookProfile?.city && (
                    <p className="text-sm text-gray-500">
                      {book.seller.bookProfile.city}, {book.seller.bookProfile.state}
                    </p>
                  )}
                </div>
              </div>

              {book.seller.bookProfile && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Listings:</span>
                    <span className="text-gray-900">{book.seller.bookProfile.totalListings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rating:</span>
                    <span className="text-gray-900">
                      {book.seller.bookProfile.averageRating.toFixed(1)} ⭐
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reviews:</span>
                    <span className="text-gray-900">{book.seller.bookProfile.totalReviews}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-3">
                {/* WhatsApp Button */}
                {book.seller.phoneNumber && (
                  <button
                    onClick={() => {
                      const message = `Hi! I'm interested in your book "${book.title}" on ExamIndia. Is it still available?`;
                      const whatsappUrl = `https://wa.me/${book.seller.phoneNumber}?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <span>WhatsApp Seller</span>
                  </button>
                )}

                <button
                  onClick={() => setShowContactForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>Contact Seller</span>
                </button>

                <button
                  onClick={handleWishlist}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                    isInWishlist
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <HeartIcon className="w-5 h-5" />
                  <span>{isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
                </button>

                <button
                  onClick={handleReport}
                  className="w-full bg-red-50 text-red-700 hover:bg-red-100 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <FlagIcon className="w-5 h-5" />
                  <span>Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Seller</h3>
              
              {/* Seller Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {book.seller.image ? (
                      <img
                        src={book.seller.image}
                        alt={book.seller.name || 'Seller'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 font-medium">
                        {book.seller.name?.charAt(0) || 'S'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{book.seller.name || 'Seller'}</p>
                    {book.seller.phoneNumber && (
                      <p className="text-sm text-gray-600">{book.seller.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* WhatsApp Button */}
              {book.seller.phoneNumber && (
                <button
                  onClick={() => {
                    const message = `Hi! I'm interested in your book "${book.title}" on ExamIndia. Is it still available?`;
                    const whatsappUrl = `https://wa.me/${book.seller.phoneNumber}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    setShowContactForm(false);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 mb-4"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span>Contact via WhatsApp</span>
                </button>
              )}

              {/* Custom Message Form */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or send a custom message:
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Write your message to the seller..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleContactSeller}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
