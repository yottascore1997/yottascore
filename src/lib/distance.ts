/**
 * Utility functions for distance calculations and location-based features
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

/**
 * Format distance for display
 * @param distance - Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`; // Show in meters if less than 1km
  } else if (distance < 10) {
    return `${Math.round(distance * 10) / 10}km`; // Show 1 decimal place
  } else {
    return `${Math.round(distance)}km`; // Show whole number for larger distances
  }
}

/**
 * Get user's current location using browser geolocation API
 * @returns Promise with coordinates or null if denied
 */
export function getCurrentLocation(): Promise<{lat: number, lng: number} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Calculate bounding box for distance-based search
 * @param lat - Center latitude
 * @param lng - Center longitude
 * @param radiusKm - Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latRange = radiusKm / 111; // 1 degree ≈ 111 km
  const lngRange = radiusKm / (111 * Math.cos(lat * Math.PI / 180)); // Adjust for latitude
  
  return {
    minLat: lat - latRange,
    maxLat: lat + latRange,
    minLng: lng - lngRange,
    maxLng: lng + lngRange
  };
}

/**
 * Common radius options for distance search
 */
export const DISTANCE_RADIUS_OPTIONS = [
  { value: 5, label: 'Within 5km' },
  { value: 10, label: 'Within 10km' },
  { value: 25, label: 'Within 25km' },
  { value: 50, label: 'Within 50km' },
  { value: 100, label: 'Within 100km' },
];
