// src/services/api/index.ts
// Central export point for all API services

export {apiClient, ApiError, axiosInstance} from './apiClient';
export {authService, AuthService} from './authService';
export {profileService, ProfileService} from './profileService';
export {passwordService, PasswordService} from './passwordService';

// Re-export types for convenience
export type * from '../../types/api.types';