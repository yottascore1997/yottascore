'use client';

import { useState, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { getCurrentLocation, formatDistance, DISTANCE_RADIUS_OPTIONS } from '@/lib/distance';

interface LocationSearchProps {
  onLocationChange: (lat: number, lng: number, radius: number) => void;
  onLocationClear: () => void;
  className?: string;
}

export default function LocationSearch({ onLocationChange, onLocationClear, className = '' }: LocationSearchProps) {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [radius, setRadius] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  // Get user's current location
  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
        setIsLocationEnabled(true);
        onLocationChange(location.lat, location.lng, radius);
      } else {
        setError('Unable to get your location. Please check your browser permissions.');
      }
    } catch (err) {
      setError('Failed to get your location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle radius change
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (userLocation && isLocationEnabled) {
      onLocationChange(userLocation.lat, userLocation.lng, newRadius);
    }
  };

  // Toggle location search
  const toggleLocationSearch = () => {
    if (isLocationEnabled) {
      setIsLocationEnabled(false);
      setUserLocation(null);
      onLocationClear();
    } else {
      handleGetCurrentLocation();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPinIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Search by location
          </span>
        </div>
        
        <button
          type="button"
          onClick={toggleLocationSearch}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLocationEnabled ? 'bg-blue-600' : 'bg-gray-200'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isLocationEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Location Status */}
      {isLocationEnabled && userLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Location enabled • Searching within {radius}km
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        </div>
      )}

      {/* Radius Selector */}
      {isLocationEnabled && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Search radius
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DISTANCE_RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleRadiusChange(option.value)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  radius === option.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Getting your location...</span>
        </div>
      )}

      {/* Help Text */}
      {!isLocationEnabled && (
        <p className="text-xs text-gray-500">
          Enable location search to find books near you. Your location is never stored and is only used for distance calculations.
        </p>
      )}
    </div>
  );
}

// Distance display component for book cards
interface DistanceDisplayProps {
  distance: number | null;
  className?: string;
}

export function DistanceDisplay({ distance, className = '' }: DistanceDisplayProps) {
  if (distance === null) return null;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <MapPinIcon className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-600">
        {formatDistance(distance)}
      </span>
    </div>
  );
}
