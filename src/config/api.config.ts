// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://192.168.0.25:8086/customer-authentication',
  RESTAURANT_SERVICE_URL: 'http://192.168.0.25:8081/restaurant',
  PROCESSING_SERVICE_URL: 'http://192.168.0.25:8083/processing',
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