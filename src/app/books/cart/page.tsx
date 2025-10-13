'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCartIcon, 
  TrashIcon, 
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface CartItem {
  id: string;
  book: any;
  createdAt: string;
}

interface SellerGroup {
  seller: any;
  books: any[];
  totalAmount: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [groupedBySeller, setGroupedBySeller] = useState<SellerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/books/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setCartItems(data.data.cartItems);
        setGroupedBySeller(data.data.groupedBySeller);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCart = async (bookId: string) => {
    try {
      setRemoving(bookId);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/books/cart?bookId=${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchCart(); // Refresh cart
      } else {
        alert(data.error || 'Failed to remove book from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove book from cart');
    } finally {
      setRemoving(null);
    }
  };

  const handleMessageSeller = async (sellerId: string, sellerName: string, books: any[]) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Pre-compose message about the books
      const bookTitles = books.map(b => b.title).join(', ');
      const message = `Hi! I'm interested in these books from your cart: ${bookTitles}. Can we discuss?`;
      
      // Send initial message
      const response = await fetch('/api/student/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: sellerId,
          content: message,
        }),
      });

      const data = await response.json();
      
      if (data.type === 'direct' || response.ok) {
        // Navigate to messages
        router.push(`/student/messages?userId=${sellerId}&name=${encodeURIComponent(sellerName)}`);
      } else if (data.type === 'request') {
        alert(`Message request sent to ${sellerName}! They need to accept before you can chat.`);
        router.push('/student/messages');
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleMessageAllSellers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Send message to all sellers
      for (const group of groupedBySeller) {
        const bookTitles = group.books.map(b => b.title).join(', ');
        const message = `Hi! I'm interested in these books from your cart: ${bookTitles}. Can we discuss?`;
        
        await fetch('/api/student/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiverId: group.seller.id,
            content: message,
          }),
        });
      }

      alert(`Messages sent to ${groupedBySeller.length} sellers! Check your messages.`);
      router.push('/student/messages');
    } catch (error) {
      console.error('Error messaging sellers:', error);
      alert('Failed to send messages. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <ShoppingCartIcon className="w-8 h-8" />
            <span>My Book Cart</span>
          </h1>
          <p className="mt-2 text-gray-600">
            {cartItems.length} {cartItems.length === 1 ? 'book' : 'books'} in your cart
          </p>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Grouped by Seller */}
              {groupedBySeller.map((group, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Seller Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {group.seller.image ? (
                            <img
                              src={group.seller.image}
                              alt={group.seller.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {group.seller.name || group.seller.username}
                          </h3>
                          {group.seller.bookProfile?.isVerified && (
                            <span className="text-xs text-green-600 flex items-center">
                              ✓ Verified Seller
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Message Seller Button */}
                      <button
                        onClick={() => handleMessageSeller(group.seller.id, group.seller.name || group.seller.username, group.books)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>Message Seller</span>
                      </button>
                    </div>
                  </div>

                  {/* Books from this Seller */}
                  <div className="p-6 space-y-4">
                    {group.books.map((book: any) => (
                      <div key={book.id} className="flex space-x-4 pb-4 border-b border-gray-100 last:border-0">
                        {/* Book Image */}
                        <div 
                          className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                          onClick={() => router.push(`/books/${book.id}`)}
                        >
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              📚
                            </div>
                          )}
                        </div>

                        {/* Book Details */}
                        <div className="flex-1">
                          <h4 
                            className="font-semibold text-gray-900 mb-1 hover:text-blue-600 cursor-pointer"
                            onClick={() => router.push(`/books/${book.id}`)}
                          >
                            {book.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                            <span className="bg-gray-100 px-2 py-1 rounded">{book.condition}</span>
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{book.listingType}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{book.location}</span>
                          </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="flex flex-col items-end justify-between space-y-2">
                          <div className="text-right">
                            {book.listingType === 'DONATE' ? (
                              <span className="text-lg font-bold text-green-600">Free</span>
                            ) : (
                              <div>
                                <span className="text-2xl font-bold text-gray-900">
                                  ₹{book.price || book.rentPrice}
                                </span>
                                {book.listingType === 'RENT' && (
                                  <span className="text-sm text-gray-500">/month</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col space-y-2 w-full">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMessageSeller(group.seller.id, group.seller.name || group.seller.username, [book]);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                            >
                              <ChatBubbleLeftRightIcon className="w-3 h-3" />
                              <span>Message</span>
                            </button>

                            <button
                              onClick={() => handleRemoveFromCart(book.id)}
                              disabled={removing === book.id}
                              className="text-red-600 hover:text-red-700 flex items-center justify-center space-x-1 text-xs font-medium disabled:opacity-50 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                            >
                              <TrashIcon className="w-3 h-3" />
                              <span>{removing === book.id ? 'Removing...' : 'Remove'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Seller Total */}
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        Subtotal ({group.books.length} {group.books.length === 1 ? 'book' : 'books'})
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{group.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary - Right Side */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cart Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Total Books:</span>
                    <span className="font-semibold">{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Sellers:</span>
                    <span className="font-semibold">{groupedBySeller.length}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Amount:</span>
                    <span>
                      ₹{groupedBySeller.reduce((sum, group) => sum + group.totalAmount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleMessageAllSellers}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    <span>Message All Sellers</span>
                  </button>

                  <button
                    onClick={() => router.push('/books')}
                    className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> You can message each seller individually or message all sellers at once to negotiate prices and arrange pickup!
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Cart */
          <div className="text-center py-16">
            <div className="text-gray-300 mb-6">
              <ShoppingCartIcon className="w-24 h-24 mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-8">
              Browse our book marketplace and add books to your cart
            </p>
            <button
              onClick={() => router.push('/books')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
            >
              <span>Browse Books</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

