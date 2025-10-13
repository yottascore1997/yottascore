# Distance Search Feature Implementation

## Overview
The distance search feature allows users to find books near their location using GPS coordinates. This feature includes proper distance calculations, radius-based filtering, and distance-based sorting.

## Features Implemented

### 1. **Distance Calculation**
- **Haversine Formula**: Accurate calculation of distances between GPS coordinates
- **Utility Functions**: Reusable functions in `src/lib/distance.ts`
- **Distance Formatting**: Smart formatting (meters for <1km, kilometers for >1km)

### 2. **Backend API Enhancements**
- **Location-based Filtering**: Filter books within a specified radius
- **Distance Calculation**: Calculate distance for each book listing
- **Distance Sorting**: Sort results by proximity to user
- **Bounding Box Optimization**: Efficient database queries using geographic bounds

### 3. **Frontend Components**
- **LocationSearch Component**: Toggle location search on/off
- **Radius Selection**: Choose search radius (5km, 10km, 25km, 50km, 100km)
- **Distance Display**: Show distance in book cards
- **Location Status**: Visual feedback for location permission status

### 4. **User Experience**
- **Automatic Location Detection**: Get user's current location
- **Privacy-First**: Location is never stored, only used for calculations
- **Fallback Handling**: Graceful handling when location is denied
- **Visual Indicators**: Clear status indicators for location features

## API Usage

### Request Parameters
```javascript
// GET /api/books/search
{
  userLat: 28.6139,        // User's latitude
  userLng: 77.2090,        // User's longitude  
  radius: 10,              // Search radius in kilometers
  sortBy: "distance",      // Sort by distance (optional)
  sortOrder: "asc"         // Sort order
}
```

### Response Format
```javascript
{
  "success": true,
  "data": {
    "books": [
      {
        "id": "book123",
        "title": "Physics Textbook",
        "location": "Delhi, India",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "distance": 2.3,    // Distance in kilometers
        // ... other book fields
      }
    ],
    "pagination": { ... }
  }
}
```

## Component Usage

### LocationSearch Component
```tsx
import LocationSearch from '@/components/LocationSearch';

<LocationSearch
  onLocationChange={(lat, lng, radius) => {
    // Handle location update
    console.log(`Searching within ${radius}km of ${lat}, ${lng}`);
  }}
  onLocationClear={() => {
    // Handle location clear
    console.log('Location search disabled');
  }}
/>
```

### DistanceDisplay Component
```tsx
import { DistanceDisplay } from '@/components/LocationSearch';

<DistanceDisplay 
  distance={2.3} 
  className="text-green-600" 
/>
// Renders: "📍 2.3km"
```

## Utility Functions

### Distance Calculation
```typescript
import { calculateDistance, formatDistance } from '@/lib/distance';

const distance = calculateDistance(
  28.6139, 77.2090,  // User location
  28.6200, 77.2100   // Book location
);
// Returns: 0.8 (kilometers)

const formatted = formatDistance(distance);
// Returns: "800m" (for <1km) or "2.3km" (for >1km)
```

### Location Detection
```typescript
import { getCurrentLocation } from '@/lib/distance';

const location = await getCurrentLocation();
if (location) {
  console.log(`User location: ${location.lat}, ${location.lng}`);
} else {
  console.log('Location access denied');
}
```

## Database Schema
The feature uses existing GPS fields in the BookListing model:
```prisma
model BookListing {
  latitude  Float?  // GPS latitude
  longitude Float?  // GPS longitude
  location  String  // Human-readable location
  // ... other fields
}
```

## Performance Optimizations

### 1. **Bounding Box Filtering**
- Pre-filter books using geographic bounding box
- Reduces database load for distance calculations
- Only calculate exact distance for filtered results

### 2. **Efficient Queries**
- Use database indexes on latitude/longitude
- Limit results before distance calculation
- Cache location-based results when possible

### 3. **Client-Side Optimization**
- Debounce location updates
- Cache user location for session
- Lazy load distance calculations

## Privacy & Security

### 1. **No Location Storage**
- User coordinates are never stored in database
- Only used for real-time calculations
- Cleared after each request

### 2. **Permission Handling**
- Graceful fallback when location denied
- Clear error messages for permission issues
- Optional feature - works without location

### 3. **Data Protection**
- Location data only sent to trusted API endpoints
- HTTPS required for location access
- No third-party location services used

## Error Handling

### 1. **Location Permission Denied**
```typescript
// Shows user-friendly message
"Unable to get your location. Please check your browser permissions."
```

### 2. **Location Unavailable**
```typescript
// Falls back to text-based location search
"No location data available. Using text-based search."
```

### 3. **Invalid Coordinates**
```typescript
// Validates coordinates before processing
if (!isValidCoordinate(lat, lng)) {
  return error("Invalid location coordinates");
}
```

## Testing

### 1. **Unit Tests**
```typescript
// Test distance calculation
expect(calculateDistance(0, 0, 0, 1)).toBeCloseTo(111.32, 1);

// Test distance formatting  
expect(formatDistance(0.5)).toBe("500m");
expect(formatDistance(2.3)).toBe("2.3km");
```

### 2. **Integration Tests**
```typescript
// Test API with location parameters
const response = await fetch('/api/books/search?userLat=28.6139&userLng=77.2090&radius=10');
const data = await response.json();
expect(data.data.books[0].distance).toBeDefined();
```

## Browser Compatibility
- **Modern Browsers**: Full support with geolocation API
- **HTTPS Required**: Location access requires secure context
- **Fallback**: Works without location (text-based search)

## Future Enhancements

### 1. **Advanced Features**
- **Geofencing**: Notify users when entering book areas
- **Heat Maps**: Show book density in areas
- **Route Planning**: Optimize pickup routes for multiple books

### 2. **Performance Improvements**
- **Database Spatial Indexes**: Use PostGIS for better performance
- **Caching**: Cache location-based results
- **CDN Integration**: Serve location data from edge locations

### 3. **User Experience**
- **Location History**: Remember recent search locations
- **Favorite Locations**: Save frequently searched areas
- **Location Sharing**: Share book locations with friends

## Conclusion
The distance search feature provides a seamless way for users to find books near their location while maintaining privacy and performance. The implementation is robust, user-friendly, and ready for production use.
