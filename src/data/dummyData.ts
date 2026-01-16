// src/data/dummyData.ts
import {Reservation, Restaurant, Review, TimeSlot, User} from '../types';

export const dummyUser: User = {
    customerId: 1,
    firstName: "Maria",
    lastName: "Christou",
    email: "maria.christou@email.com",
    phone: "+357 99 789012",
    phoneCountryCode: "+357",
    emailVerified: true,
    profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150",
    favoriteRestaurants: [1, 3]
};

export const dummyRestaurants: Restaurant[] = [
    {
        id: 1,
        name: "The Mediterranean Terrace",
        cuisineType: "Mediterranean",
        address: "123 Ledra Street, Nicosia",
        postCode: "1016",
        country: "Cyprus",
        latitude: 35.1676,
        longitude: 33.3736,
        averageRating: 4.6,
        totalReviews: 127,
        priceRange: "$$$",
        coverImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
        galleryImages: [
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
            "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400"
        ],
        description: "Authentic Mediterranean cuisine with fresh seafood and traditional recipes passed down through generations.",
        amenities: ["Outdoor Seating", "WiFi", "Parking", "Live Music"],
        phoneNumber: "+357 22 123456"
    },
    {
        id: 2,
        name: "Taverna Dionysos",
        cuisineType: "Greek",
        address: "456 Makarios Avenue, Limassol",
        postCode: "3040",
        country: "Cyprus",
        latitude: 34.6777,
        longitude: 33.0376,
        averageRating: 4.3,
        totalReviews: 89,
        priceRange: "$$",
        coverImageUrl: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=400",
        galleryImages: ["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400"],
        description: "Traditional Greek taverna serving authentic dishes in a cozy atmosphere.",
        amenities: ["Family Friendly", "Traditional Music", "Wine Selection"],
        phoneNumber: "+357 25 987654"
    },
    {
        id: 3,
        name: "Sushi Zen",
        cuisineType: "Japanese",
        address: "789 Gladstonos Street, Paphos",
        postCode: "8046",
        country: "Cyprus",
        latitude: 34.7767,
        longitude: 32.4114,
        averageRating: 4.8,
        totalReviews: 203,
        priceRange: "$$$$",
        coverImageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400",
        galleryImages: ["https://images.unsplash.com/photo-1553621042-f6e147245754?w=400"],
        description: "Premium sushi restaurant with fresh fish flown in daily.",
        amenities: ["Sushi Bar", "Sake Selection", "Omakase", "Private Dining"],
        phoneNumber: "+357 26 456789"
    }
];

export const dummyTimeSlots: TimeSlot[] = [
    {time: "17:00", available: true, remainingTables: 5},
    {time: "17:30", available: true, remainingTables: 3},
    {time: "18:00", available: true, remainingTables: 8},
    {time: "18:30", available: true, remainingTables: 2},
    {time: "19:00", available: true, remainingTables: 6},
    {time: "19:30", available: true, remainingTables: 4},
    {time: "20:00", available: false},
    {time: "20:30", available: true, remainingTables: 1},
    {time: "21:00", available: true, remainingTables: 7},
    {time: "21:30", available: false},
    {time: "22:00", available: true, remainingTables: 3}
];

export const dummyReservations: Reservation[] = [
    {
        id: 1,
        restaurant: dummyRestaurants[0],
        date: "2024-03-15",
        time: "19:30",
        partySize: 4,
        customerName: "Maria Christou",
        customerPhone: "+357 99 789012",
        status: "completed",
        confirmationCode: "ABC123",
        canReview: true
    },
    {
        id: 2,
        restaurant: dummyRestaurants[1],
        date: "2024-03-18",
        time: "20:00",
        partySize: 2,
        customerName: "Maria Christou",
        customerPhone: "+357 99 789012",
        status: "confirmed",
        confirmationCode: "DEF456",
        canReview: false
    },
    {
        id: 3,
        restaurant: dummyRestaurants[2],
        date: "2024-02-28",
        time: "19:00",
        partySize: 6,
        customerName: "Maria Christou",
        customerPhone: "+357 99 789012",
        status: "completed",
        confirmationCode: "GHI789",
        canReview: true
    }
];

export const dummyReviews: Review[] = [
    {
        id: 1,
        restaurantId: 1,
        restaurantName: "The Mediterranean Terrace",
        customerName: "Maria C.",
        rating: 5,
        reviewText: "Amazing food and atmosphere! The seafood was incredibly fresh and the service was outstanding. Highly recommend the grilled octopus.",
        foodRating: 5,
        serviceRating: 5,
        ambianceRating: 4,
        date: "2024-03-16",
        reservationId: 1,
        isVerified: true
    },
    {
        id: 2,
        restaurantId: 3,
        restaurantName: "Sushi Zen",
        customerName: "Maria C.",
        rating: 4,
        reviewText: "Excellent sushi quality, though a bit pricey. The omakase experience was worth it. Will definitely come back.",
        foodRating: 5,
        serviceRating: 4,
        ambianceRating: 4,
        date: "2024-03-01",
        reservationId: 3,
        isVerified: true
    }
];