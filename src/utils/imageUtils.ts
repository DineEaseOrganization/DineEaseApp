// src/utils/imageUtils.ts

// Default placeholder image URL
const DEFAULT_RESTAURANT_IMAGE = 'https://via.placeholder.com/400x300/cccccc/666666?text=Restaurant';

/**
 * Get a valid image URL or return a placeholder
 * @param imageUrl - The image URL from API (may be null/undefined)
 * @returns Valid image URL or placeholder
 */
export const getRestaurantImage = (imageUrl?: string | null): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return DEFAULT_RESTAURANT_IMAGE;
  }
  return imageUrl;
};

/**
 * Get gallery images or return empty array
 * @param galleryImages - Gallery images from API (may be null/undefined)
 * @returns Array of valid image URLs
 */
export const getGalleryImages = (galleryImages?: string[] | null): string[] => {
  if (!galleryImages || !Array.isArray(galleryImages)) {
    return [];
  }
  return galleryImages.filter(img => img && img.trim() !== '');
};

/**
 * Get amenities or return empty array
 * @param amenities - Amenities from API (may be null/undefined)
 * @returns Array of amenities
 */
export const getAmenities = (amenities?: string[] | null): string[] => {
  if (!amenities || !Array.isArray(amenities)) {
    return [];
  }
  return amenities.filter(amenity => amenity && amenity.trim() !== '');
};