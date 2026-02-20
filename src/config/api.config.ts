// API Configuration
// Use environment variables if available, otherwise fallback to production URLs

// Check if we're in development mode
const isDevelopment = typeof __DEV__ !== 'undefined' && __DEV__;

const getBaseUrl = () => {
  // In development, use env variable if available
  if (isDevelopment && process.env.CUSTOMER_AUTH_URL) {
    return process.env.CUSTOMER_AUTH_URL;
  }
  // Production URL (same as DineEaseManager)
  return 'https://api.dineeasemanager.com/customer-authentication';
};

const getRestaurantServiceUrl = () => {
  if (isDevelopment && process.env.RESTAURANT_SERVICE_URL) {
    return process.env.RESTAURANT_SERVICE_URL;
  }
  return 'https://api.dineeasemanager.com/restaurant';
};

const getProcessingServiceUrl = () => {
  if (isDevelopment && process.env.PROCESSING_SERVICE_URL) {
    return process.env.PROCESSING_SERVICE_URL;
  }
  return 'https://api.dineeasemanager.com/processing';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  RESTAURANT_SERVICE_URL: getRestaurantServiceUrl(),
  PROCESSING_SERVICE_URL: getProcessingServiceUrl(),
  ENDPOINTS: {
    // Auth endpoints
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    LOGOUT_DEVICE: '/auth/logout-device',
    REFRESH_TOKEN: '/auth/refresh',

    //restaurant endpoints

    // Email verification endpoints
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    VERIFICATION_STATUS: '/auth/verification-status',

    // Password endpoints
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    PASSWORD_STRENGTH: '/auth/password-strength',

    // Profile endpoints
    GET_PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
    DELETE_ACCOUNT: '/auth/account',

    // Device management endpoints
    LIST_DEVICES: '/auth/devices/trusted',
    REMOVE_DEVICE: '/auth/devices',  // Uses /:deviceId
    UPDATE_DEVICE_TRUST: '/auth/devices', // Uses /:deviceId/trust

    // Favorites endpoints (served by Restaurant Service - /customer/favorites)
    FAVORITES: '/customer/favorites', // GET list, POST add
    FAVORITE_BY_ID: '/customer/favorites', // DELETE /:restaurantId
    CHECK_FAVORITE: '/customer/favorites/check', // GET /:restaurantId
  },
  TIMEOUT: 30000, // 30 seconds
};

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@dineease_access_token',
  REFRESH_TOKEN: '@dineease_refresh_token',
  USER_DATA: '@dineease_user',
  DEVICE_ID: '@dineease_device_id',
};

// Export a function to log config when needed (don't run on import)
export const logAPIConfig = () => {
  if (isDevelopment) {
    console.log('🔧 API Configuration:');
    console.log('  Base URL:', API_CONFIG.BASE_URL);
    console.log('  Restaurant Service:', API_CONFIG.RESTAURANT_SERVICE_URL);
    console.log('  Processing Service:', API_CONFIG.PROCESSING_SERVICE_URL);
    console.log('  Mode:', isDevelopment ? 'Development' : 'Production');
  }
};