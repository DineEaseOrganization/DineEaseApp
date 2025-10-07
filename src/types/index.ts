// src/types/index.ts - Updated to match API

export interface Restaurant {
  id: number;
  name: string;
  cuisineType: string;
  address: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  totalReviews: number;
  priceRange: string;
  coverImageUrl: string;
  galleryImages: string[];
  description: string;
  amenities: string[];
  phoneNumber: string;
  openNow?: boolean;
  distance?: number;
  mapCoordinate?: { latitude: number; longitude: number };
}

export interface Review {
  id: number;
  restaurantId: number;
  restaurantName: string;
  customerName: string;
  rating: number;
  reviewText: string;
  foodRating: number;
  serviceRating: number;
  ambianceRating: number;
  date: string;
  reservationId?: number;
  isVerified: boolean;
}

export interface Reservation {
  id: number;
  restaurant: Restaurant;
  date: string;
  time: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  confirmationCode: string;
  specialRequests?: string;
  canReview?: boolean;
}

// Updated User type to match API response
export interface User {
  customerId: number; // Changed from 'id' to match API
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode: string; // Added to match API
  emailVerified: boolean; // Added to match API
  profileImage?: string;
  favoriteRestaurants?: number[]; // Optional for frontend use
}

export interface TimeSlot {
  time: string;
  available: boolean;
  remainingTables?: number;
}

// Additional types for API integration
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  osVersion: string;
  appVersion: string;
}