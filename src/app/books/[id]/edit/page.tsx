'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PhotoIcon } from '@heroicons/react/24/outline';

export default function EditBookPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    listingType: 'SELL' as 'SELL' | 'RENT' | 'DONATE',
    condition: 'GOOD' as 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR',
    price: '',
    category: '',
    location: '',
    latitude: 0,
    longitude: 0,
    coverImage: '',
    backImage: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    fetchBookDetails();
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/books/${bookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        const book = data.data;
        setFormData({
          title: book.title || '',
          listingType: book.listingType || 'SELL',
          condition: book.condition || 'GOOD',
          price: book.price?.toString() || '',
          category: book.category || '',
          location: book.location || '',
          latitude: book.latitude || 0,
          longitude: book.longitude || 0,
          coverImage: book.coverImage || '',
          backImage: book.additionalImages?.[0] || '',
        });
      } else {
        alert('Failed to load book details');
        router.push('/books/my-listings');
      }
    } catch (error) {
      console.error('Error fetching book:', error);
      alert('Failed to load book details');
      router.push('/books/my-listings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (file: File, type: 'cover' | 'back') => {
    try {
      const imageUrl = URL.createObjectURL(file);
      
      if (type === 'cover') {
        setFormData(prev => ({ ...prev, coverImage: imageUrl }));
      } else {
        setFormData(prev => ({ ...prev, backImage: imageUrl }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : undefined,
          latitude: userLocation?.lat || formData.latitude,
          longitude: userLocation?.lng || formData.longitude,
          additionalImages: formData.backImage ? [formData.backImage] : [],
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Book listing updated successfully!');
        router.push(`/books/${bookId}`);
      } else {
        console.error('Failed to update book:', data.error);
        alert(data.error || 'Failed to update book listing. Please try again.');
      }
    } catch (error) {
      console.error('Error updating book:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Book Listing</h1>
            <p className="mt-2 text-gray-600">
              Update your book information
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Book Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Book Name *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter book name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listing Type *
                  </label>
                  <select
                    name="listingType"
                    value={formData.listingType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="SELL">Sell</option>
                    <option value="RENT">Rent</option>
                    <option value="DONATE">Donate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition *
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="NEW">New</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>

                {formData.listingType !== 'DONATE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.listingType === 'RENT' ? 'Rent Price (/month) *' : 'Price *'}
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={formData.listingType === 'RENT' ? 'Enter rent per month' : 'Enter price'}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Academic">Academic</option>
                    <option value="Exam Preparation">Exam Preparation</option>
                    <option value="Novel">Novel</option>
                    <option value="Reference">Reference</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your location (City, State)"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Book Images</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front Cover */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Front Cover
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {formData.coverImage ? (
                        <div className="relative">
                          <img
                            src={formData.coverImage}
                            alt="Cover preview"
                            className="mx-auto h-32 w-32 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="cover-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                            >
                              <span>Upload front cover</span>
                              <input
                                id="cover-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, 'cover');
                                }}
                              />
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Back Cover */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Back Cover (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {formData.backImage ? (
                        <div className="relative">
                          <img
                            src={formData.backImage}
                            alt="Back cover preview"
                            className="mx-auto h-32 w-32 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, backImage: '' }))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <>
                          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="back-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                            >
                              <span>Upload back cover</span>
                              <input
                                id="back-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, 'back');
                                }}
                              />
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

