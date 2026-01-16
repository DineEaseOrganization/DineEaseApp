// src/types/index.ts
// Frontend domain types - what the UI uses (may extend or combine API types)
import {RestaurantDetail} from './api.types';
import { getRestaurantImage, getAmenities } from '../utils/imageUtils';


// ============ RESTAURANT DOMAIN TYPES ============

// Restaurant type for UI - extends API type with computed fields
export interface Restaurant {
    id: number;
    name: string;
    cuisineType: string; // Computed from primaryCuisineType
    primaryCuisineType?: string;
    cuisineTypes?: string[];
    address: string;
    postCode: string;
    country: string;
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
    isActive?: boolean;
    acceptsReservations?: boolean;
    // UI-specific computed fields
    openNow?: boolean;
    distance?: number;
    mapCoordinate?: { latitude: number; longitude: number };
}

// Helper to convert API type to UI type
export const mapRestaurantDetailToRestaurant = (detail: RestaurantDetail): Restaurant => {
    return {
        id: detail.id,
        name: detail.name,
        cuisineType: detail.primaryCuisineType || 'Unknown',
        primaryCuisineType: detail.primaryCuisineType || undefined,
        cuisineTypes: detail.cuisineTypes || undefined,
        address: detail.address,
        postCode: detail.postCode,
        country: detail.country,
        latitude: detail.latitude || 0,
        longitude: detail.longitude || 0,
        averageRating: detail.averageRating,
        totalReviews: detail.totalReviews,
        priceRange: detail.priceRange || '$$',
        coverImageUrl: getRestaurantImage(detail.coverImageUrl), // Safe image handling
        amenities: getAmenities(detail.amenities), // Safe amenities handling
        galleryImages: detail.galleryImages || [],
        description: detail.description || '',
        phoneNumber: detail.phoneNumber,
        isActive: detail.isActive,
        acceptsReservations: detail.acceptsReservations,
    };
};

// ============ REVIEW DOMAIN TYPES ============

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

// ============ RESERVATION DOMAIN TYPES ============

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

export interface TimeSlot {
    time: string;
    available: boolean;
    remainingTables?: number;
}

// ============ USER DOMAIN TYPES ============

export interface User {
    customerId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    phoneCountryCode: string;
    emailVerified: boolean;
    profileImage?: string;
    favoriteRestaurants: number[];
}

// ============ RE-EXPORT COMMONLY USED API TYPES ============

export type {
    // Restaurant API types
    RestaurantDetail,
    CuisineStat,
    TopCategory,
    TimeRange,
    SortOption,
    RestaurantListResponse,
    NearbyRestaurantsResponse,
    RestaurantSearchResponse,
    TopRestaurantsResponse,
    SearchFiltersApplied,

    // Auth API types
    CustomerData,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    LogoutRequest,
    LogoutResponse,

    // Profile API types
    ProfileResponse,
    UpdateProfileRequest,
    UpdateProfileResponse,
    DeleteAccountRequest,
    DeleteAccountResponse,

    // Device API types
    DeviceDTO,
    DeviceInfo,
    DeviceListResponse,
    DeviceActionResponse,

    // Password API types
    ChangePasswordRequest,
    ChangePasswordResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,

    // Email verification API types
    VerifyEmailRequest,
    VerifyEmailResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    CheckVerificationStatusResponse,

    // Common types
    TokenPair,
    ApiErrorResponse,
} from './api.types'