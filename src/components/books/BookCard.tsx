'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookListing } from '@/types/books';
import { HeartIcon, MapPinIcon, StarIcon, EyeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface BookCardProps {
  book: BookListing;
}

export default function BookCard({ book }: BookCardProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/books/${book.id}/like`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setIsLiked(data.liked);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/books/${book.id}/wishlist`, {
        method: isInWishlist ? 'DELETE' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setIsInWishlist(!isInWishlist);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/books/cart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId: book.id }),
      });
      const data = await response.json();
      
      if (data.success) {
        setIsInCart(true);
        alert('Book added to cart! 🛒');
      } else {
        alert(data.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/books/${book.id}`);
  };

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
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Book Image */}
      <div className="relative">
        <div className="aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📚</div>
                <div className="text-sm">No Image</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex flex-col space-y-2">
          <button
            onClick={handleLike}
            disabled={loading}
            className={`p-2 rounded-full shadow-sm transition-colors ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Like"
          >
            {isLiked ? (
              <HeartSolidIcon className="w-4 h-4" />
            ) : (
              <HeartIcon className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={handleWishlist}
            disabled={loading}
            className={`p-2 rounded-full shadow-sm transition-colors ${
              isInWishlist 
                ? 'bg-yellow-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Wishlist"
          >
            <HeartIcon className="w-4 h-4" />
          </button>

          <button
            onClick={handleAddToCart}
            disabled={loading || isInCart}
            className={`p-2 rounded-full shadow-sm transition-colors ${
              isInCart 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={isInCart ? 'In Cart' : 'Add to Cart'}
          >
            <ShoppingCartIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getListingTypeColor(book.listingType)}`}>
            {book.listingType}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(book.condition)}`}>
            {book.condition.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Book Details */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-1">
            by {book.author}
          </p>
        </div>

        {/* Category and Subject */}
        <div className="mb-3">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">
              {book.category}
            </span>
            {book.subcategory && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {book.subcategory}
              </span>
            )}
          </div>
          {book.class && (
            <div className="text-xs text-gray-500 mt-1">
              Class: {book.class}
            </div>
          )}
          {book.subject && (
            <div className="text-xs text-gray-500">
              Subject: {book.subject}
            </div>
          )}
        </div>

        {/* Price and Location */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-gray-900">
            {getPriceDisplay()}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <MapPinIcon className="w-3 h-3 mr-1" />
            {book.distance ? (
              <span>
                <span className="font-medium text-blue-600">{book.distance.toFixed(1)} km</span>
                <span className="text-gray-400 mx-1">•</span>
                {book.location}
              </span>
            ) : (
              book.location
            )}
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
              {book.seller.image ? (
                <img
                  src={book.seller.image}
                  alt={book.seller.name || book.seller.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                  {book.seller.name?.[0] || book.seller.username?.[0] || '?'}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-900">
                {book.seller.name || book.seller.username}
              </div>
              {book.seller.bookProfile?.isVerified && (
                <div className="text-xs text-green-600">✓ Verified</div>
              )}
            </div>
          </div>

          {/* Rating */}
          {book.averageRating && book.averageRating > 0 && (
            <div className="flex items-center space-x-1">
              <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs text-gray-600">
                {book.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-3 h-3" />
              <span>{book.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <HeartIcon className="w-3 h-3" />
              <span>{book.totalLikes || 0}</span>
            </div>
            {book.distance && (
              <div className="text-green-600">
                {book.distance.toFixed(1)} km away
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
