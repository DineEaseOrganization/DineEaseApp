// API Configuration
// Use environment variables if available, otherwise fallback to production URLs
import Constants from 'expo-constants';

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

const getPaymentsServiceUrl = () => {
  if (isDevelopment && process.env.PAYMENTS_SERVICE_URL) {
    return process.env.PAYMENTS_SERVICE_URL;
  }
  return 'https://api.dineeasemanager.com/payments';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  RESTAURANT_SERVICE_URL: getRestaurantServiceUrl(),
  PROCESSING_SERVICE_URL: getProcessingServiceUrl(),
  PAYMENTS_SERVICE_URL: getPaymentsServiceUrl(),
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

    // Payment endpoints (served by DineEasePayments)
    CUSTOMER_SETUP: '/customer/me/setup',             // POST — create Stripe Customer + SetupIntent (mobile JWT auth)
    CUSTOMER_PAYMENT_METHODS: '/customer/me/payment-methods', // GET  — list saved cards; DELETE /{pmId} — remove card
    CUSTOMER_EPHEMERAL_KEY: '/customer/me/ephemeral-key',     // GET  — create ephemeral key for Payment Sheet (mobile JWT auth)
    CUSTOMER_POLICY: '/customer/me/policy',           // GET /{policyId} — fetch historical policy (mobile JWT auth)
    PAYMENT_INTENT_CREATE: '/intent/create',          // POST — create PaymentIntent
    PAYMENT_INTENT_RETRY: '/intent/retry',      // POST /{reservationId}
    PAYMENT_REFUND: '/refund',                  // POST /{transactionId}
    CANCEL_EVALUATE: '/cancel/evaluate',        // POST
    PAYMENT_POLICY_EFFECTIVE: '/policy',        // GET /{restaurantId}/effective

    // Reservation endpoints (served by DineEaseProcessing)
    HAS_UPCOMING_CANCELLATION_FEE: '/mobile/reservations/has-upcoming-cancellation-fee', // GET
  },
  TIMEOUT: 30000, // 30 seconds
};

// Mobile API key — read from app.config.js extra (injected at build time via EAS).
// NOTE: Values placed in expoConfig.extra are bundled into the app binary and are
// trivially extractable. Treat this as a PUBLIC app identifier, not a secret.
// Backend protections (rate limiting, key rotation, JWT for user auth) are what
// actually defend the API; this key only identifies the mobile client.
export const MOBILE_API_KEY: string =
  (Constants.expoConfig?.extra?.mobileApiKey as string) || '';

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
    console.log('  Payments Service:', API_CONFIG.PAYMENTS_SERVICE_URL);
    console.log('  Mode:', isDevelopment ? 'Development' : 'Production');
  }
};