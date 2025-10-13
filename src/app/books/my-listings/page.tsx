'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BookCard from '@/components/books/BookCard';
import { BookListing } from '@/types/books';
import { 
  PlusIcon, 
  FunnelIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  ArchiveBoxIcon 
} from '@heroicons/react/24/outline';

interface ListingSummary {
  total: number;
  active: number;
  sold: number;
  rented: number;
  inactive: number;
}

export default function MyListingsPage() {
  const router = useRouter();
  const [books, setBooks] = useState<BookListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ListingSummary>({
    total: 0,
    active: 0,
    sold: 0,
    rented: 0,
    inactive: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchMyListings();
  }, [statusFilter]);

  const fetchMyListings = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      const response = await fetch(`/api/books/my-listings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setBooks(data.data.books);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
      } else {
        console.error('Failed to fetch listings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateBook = () => {
    router.push('/books/create');
  };

  const handleEditBook = (bookId: string) => {
    console.log('Editing book:', bookId);
    router.push(`/books/${bookId}/edit`);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('Book listing deleted successfully');
        fetchMyListings(pagination.page);
      } else {
        alert(data.error || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete listing');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-300';
      case 'SOLD': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'RENTED': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'REMOVED': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Book Listings</h1>
              <p className="mt-2 text-gray-600">
                Manage your book listings and track sales
              </p>
            </div>
            <button
              onClick={handleCreateBook}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add New Book</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                </div>
                <ArchiveBoxIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Active</p>
                  <p className="text-2xl font-bold text-green-900">{summary.active}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Sold</p>
                  <p className="text-2xl font-bold text-blue-900">{summary.sold}</p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700">Rented</p>
                  <p className="text-2xl font-bold text-purple-900">{summary.rented}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.inactive}</p>
                </div>
                <XCircleIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusChange('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({summary.total})
            </button>
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Active ({summary.active})
            </button>
            <button
              onClick={() => handleStatusChange('SOLD')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'SOLD'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Sold ({summary.sold})
            </button>
            <button
              onClick={() => handleStatusChange('RENTED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'RENTED'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Rented ({summary.rented})
            </button>
            <button
              onClick={() => handleStatusChange('INACTIVE')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'INACTIVE'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Inactive ({summary.inactive})
            </button>
          </div>
        </div>

        {/* Books Grid */}
        <div>
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
                  <div key={book.id} className="relative">
                    <BookCard book={book} />
                    
                    {/* Action Buttons Overlay */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
                      {/* Status Badge */}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(book.status)}`}>
                        {book.status}
                      </span>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/books/${book.id}`)}
                          className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-sm transition-colors"
                          title="View"
                        >
                          👁️
                        </button>
                        {book.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleEditBook(book.id)}
                              className="bg-white/90 hover:bg-white text-blue-600 p-2 rounded-lg shadow-sm transition-colors"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="bg-white/90 hover:bg-white text-red-600 p-2 rounded-lg shadow-sm transition-colors"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                      <div className="flex justify-around text-xs">
                        <div className="text-center">
                          <div className="font-bold text-gray-900">{book.views}</div>
                          <div className="text-gray-600">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-gray-900">{book.totalLikes || 0}</div>
                          <div className="text-gray-600">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-gray-900">{book.totalReviews || 0}</div>
                          <div className="text-gray-600">Reviews</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => fetchMyListings(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {[...Array(pagination.pages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === pagination.pages ||
                        (page >= pagination.page - 1 && page <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => fetchMyListings(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              page === pagination.page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => fetchMyListings(pagination.page + 1)}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-600 mb-6">
                {statusFilter 
                  ? `You don't have any ${statusFilter.toLowerCase()} listings`
                  : "You haven't listed any books yet. Start by adding your first book!"}
              </p>
              <button
                onClick={handleCreateBook}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>List Your First Book</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

