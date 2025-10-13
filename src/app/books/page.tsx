'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BookCard from '@/components/books/BookCard';
import BookFilters from '@/components/books/BookFilters';
import BookSearch from '@/components/books/BookSearch';
import { BookListing, BookFilters as BookFiltersType } from '@/types/books';
import { getCurrentLocation } from '@/lib/distance';

export default function BooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<BookListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BookFiltersType>({
    search: '',
    category: '',
    subcategory: '',
    listingType: '',
    condition: '',
    minPrice: undefined,
    maxPrice: undefined,
    location: '',
    radius: 10,
    class: '',
    subject: '',
    examType: '',
    language: 'English',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Get user's location using our utility function
  useEffect(() => {
    const fetchUserLocation = async () => {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
      }
    };
    
    fetchUserLocation();
  }, []);

  // Fetch books
  const fetchBooks = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: 'desc',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== undefined)
        ),
        ...(userLocation ? {
          userLat: userLocation.lat.toString(),
          userLng: userLocation.lng.toString(),
        } : {}),
      });

      const response = await fetch(`/api/books/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setBooks(data.data.books);
        setPagination(data.data.pagination);
      } else {
        console.error('Failed to fetch books:', data.error);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [filters, userLocation]);

  const handleFilterChange = (newFilters: Partial<BookFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleLocationUpdate = (lat: number, lng: number, radius: number) => {
    setUserLocation({ lat, lng });
    setFilters(prev => ({ ...prev, radius }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleLocationClear = () => {
    setUserLocation(null);
    setFilters(prev => ({ ...prev, radius: 10 }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchBooks(page);
  };

  const handleCreateBook = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    router.push('/books/create');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Book Marketplace</h1>
              <p className="mt-2 text-gray-600">
                Buy, sell, rent, or donate books with fellow students
              </p>
            </div>
            <button
              onClick={handleCreateBook}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              List Your Book
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <BookFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              userLocation={userLocation}
              onLocationUpdate={handleLocationUpdate}
              onLocationClear={handleLocationClear}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <BookSearch
                  search={filters.search}
                  onSearchChange={(search) => handleFilterChange({ search })}
                />
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={filters.sortBy || 'createdAt'}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt">Newest</option>
                  <option value="price">Price</option>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Liked</option>
                  {userLocation && (
                    <option value="distance">Distance</option>
                  )}
                </select>
              </div>
            </div>

            {/* Location Summary */}
            {userLocation && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-lg">📍</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">Showing nearby books</h3>
                      <p className="text-xs text-blue-700">
                        Within {filters.radius} km of your location
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-900">{books.length}</p>
                    <p className="text-xs text-blue-700">books found</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            <div className="mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : books.length > 0 ? (
                <>
                  <div className="mb-4">
                    <p className="text-gray-600">
                      Showing {books.length} of {pagination.total} books
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {books.map((book) => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <nav className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        {[...Array(pagination.pages)].map((_, i) => {
                          const page = i + 1;
                          const isCurrentPage = page === pagination.page;
                          const showPage = 
                            page === 1 || 
                            page === pagination.pages || 
                            (page >= pagination.page - 1 && page <= pagination.page + 1);
                          
                          if (!showPage) {
                            if (page === pagination.page - 2 || page === pagination.page + 2) {
                              return <span key={page} className="px-3 py-2 text-sm text-gray-500">...</span>;
                            }
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                isCurrentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📚</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search criteria or be the first to list a book!
                  </p>
                  <button
                    onClick={handleCreateBook}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    List Your First Book
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
