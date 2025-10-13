'use client';

import { useState } from 'react';
import { BookFilters as BookFiltersType, BOOK_CATEGORIES, BOOK_CONDITIONS, LISTING_TYPES, DISTANCE_OPTIONS } from '@/types/books';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LocationSearch from '@/components/LocationSearch';

interface BookFiltersProps {
  filters: BookFiltersType;
  onFilterChange: (filters: Partial<BookFiltersType>) => void;
  userLocation: { lat: number; lng: number } | null;
  onLocationUpdate?: (lat: number, lng: number, radius: number) => void;
  onLocationClear?: () => void;
}

export default function BookFilters({ filters, onFilterChange, userLocation, onLocationUpdate, onLocationClear }: BookFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof BookFiltersType, value: any) => {
    onFilterChange({ [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
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
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'radius') return value !== 10;
    if (key === 'language') return value !== 'English';
    return value !== '' && value !== undefined;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Listing Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Listing Type
          </label>
          <div className="space-y-2">
            {LISTING_TYPES.map((type) => (
              <label key={type.value} className="flex items-center">
                <input
                  type="radio"
                  name="listingType"
                  value={type.value}
                  checked={filters.listingType === type.value}
                  onChange={(e) => handleFilterChange('listingType', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => {
              handleFilterChange('category', e.target.value);
              handleFilterChange('subcategory', ''); // Reset subcategory when category changes
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {Object.entries(BOOK_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        {filters.category && BOOK_CATEGORIES[filters.category] && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
            </label>
            <select
              value={filters.subcategory}
              onChange={(e) => handleFilterChange('subcategory', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Subcategories</option>
              {BOOK_CATEGORIES[filters.category].subcategories.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition
          </label>
          <div className="space-y-2">
            {BOOK_CONDITIONS.map((condition) => (
              <label key={condition.value} className="flex items-center">
                <input
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={filters.condition === condition.value}
                  onChange={(e) => handleFilterChange('condition', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-2">
                  <span className="text-sm text-gray-700">{condition.label}</span>
                  <p className="text-xs text-gray-500">{condition.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range (₹)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            placeholder="Enter city or area"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Enhanced Location-based filtering */}
        <LocationSearch
          onLocationChange={(lat, lng, radius) => {
            if (onLocationUpdate) {
              onLocationUpdate(lat, lng, radius);
            } else {
              // Fallback for backward compatibility
              onFilterChange({ radius });
            }
          }}
          onLocationClear={() => {
            if (onLocationClear) {
              onLocationClear();
            } else {
              // Fallback for backward compatibility
              onFilterChange({ radius: 10 });
            }
          }}
          className="border-t pt-4"
        />

        {/* Academic Filters */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Academic Filters</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Class
              </label>
              <input
                type="text"
                placeholder="e.g., 12th, B.Tech"
                value={filters.class}
                onChange={(e) => handleFilterChange('class', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Subject
              </label>
              <input
                type="text"
                placeholder="e.g., Mathematics, Physics"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Exam Type
              </label>
              <input
                type="text"
                placeholder="e.g., JEE, NEET, UPSC"
                value={filters.examType}
                onChange={(e) => handleFilterChange('examType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={filters.language}
            onChange={(e) => handleFilterChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Sanskrit">Sanskrit</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
}
