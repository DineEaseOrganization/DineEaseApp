// src/services/api/index.ts
// Central export point for all API services

export { apiClient, ApiError, axiosInstance } from './apiClient';
export { authService, AuthService } from './authService';
export { profileService, ProfileService } from './profileService';
export { passwordService, PasswordService } from './passwordService';
export { restaurantService, RestaurantService } from './restaurantService';
export { processingService, ProcessingService } from './processingService';
export { availabilityStreamService, AvailabilityStreamService } from './availabilityStreamService';
export type { AvailabilityStreamCallbacks, AvailabilitySubscription } from './availabilityStreamService';
export { favoritesService, FavoritesService } from './favoritesService';
export { updatesService } from './updatesService';
export type { MobileUpdate, UpdatesPage, ActionButton, CreateUpdate } from './updatesService';

export * from './deviceService';

// Re-export types for convenience
export type * from '../../types/api.types';