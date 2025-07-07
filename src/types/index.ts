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
    // Optional new properties for search functionality
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

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImage?: string;
    favoriteRestaurants: number[];
}

export interface TimeSlot {
    time: string;
    available: boolean;
    remainingTables?: number;
}