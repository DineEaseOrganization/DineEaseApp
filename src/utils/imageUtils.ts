// src/utils/imageUtils.ts

/**
 * Get a valid image URL or return null.
 * CachedImage handles null gracefully by showing the fallbackColor placeholder.
 * We do NOT return a remote placeholder URL — they are unreliable in emulators
 * and cause CachedImage to show its grey error state instead of a clean fallback.
 */
export const getRestaurantImage = (imageUrl?: string | null): string | null => {
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
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