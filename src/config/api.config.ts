// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://192.168.0.25:8086/customer-authentication',
  ENDPOINTS: {
    // Auth endpoints
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    LOGOUT_DEVICE: '/auth/logout-device',
    REFRESH_TOKEN: '/auth/refresh',

    // Email verification endpoints
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    VERIFICATION_STATUS: '/auth/verification-status',

    // Password endpoints
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',

    // Profile endpoints
    GET_PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
    DELETE_ACCOUNT: '/auth/account',
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