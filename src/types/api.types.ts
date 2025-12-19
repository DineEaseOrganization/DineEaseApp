// src/types/api_types.ts
// Backend API contracts - exact types from API responses/requests

// ============ RESTAURANT API TYPES ============

export interface RestaurantDetail {
  id: number;
  name: string;
  primaryCuisineType: string | null;
  cuisineTypes: string[] | null;
  description: string | null;
  address: string;
  postCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phoneNumber: string;
  priceRange: string | null;
  coverImageUrl: string | null;
  galleryImages: string[] | null;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  acceptsReservations: boolean;
  amenities: string[] | null;
}

export interface CuisineStat {
  cuisineType: string;
  count: number;
}

export interface RestaurantListResponse {
  restaurants: RestaurantDetail[];
  totalResults: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface NearbyRestaurantsResponse {
  restaurants: RestaurantDetail[];
  totalResults: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SearchFiltersApplied {
  location: string | null;
  cuisines: string[] | null;
  priceRange: string | null;
  minRating: number | null;
  openNow: boolean;
  amenities: string[] | null;
  sortBy: string;
}

export interface RestaurantSearchResponse {
  restaurants: RestaurantDetail[];
  totalResults: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  appliedFilters: SearchFiltersApplied;
}

export interface TopRestaurantsResponse {
  category: string;
  restaurants: RestaurantDetail[];
  updatedAt: string;
}

export enum SortOption {
  DISTANCE = 'DISTANCE',
  RATING_HIGH = 'RATING_HIGH',
  RATING_LOW = 'RATING_LOW',
  PRICE_LOW = 'PRICE_LOW',
  PRICE_HIGH = 'PRICE_HIGH',
  POPULARITY = 'POPULARITY',
  MOST_REVIEWED = 'MOST_REVIEWED',
  TOP_BOOKED = 'TOP_BOOKED',
  TOP_VIEWED = 'TOP_VIEWED',
  TOP_SAVED = 'TOP_SAVED',
  ALPHABETICAL = 'ALPHABETICAL'
}

export enum TopCategory {
  BOOKED = 'BOOKED',
  VIEWED = 'VIEWED',
  SAVED = 'SAVED'
}

export enum TimeRange {
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  ALL_TIME = 'ALL_TIME'
}

// ============ DEVICE API TYPES ============

export interface DeviceDTO {
  deviceId: string;
  deviceName: string | null;
  platform: string | null;
  platformVersion: string | null;
  deviceModel: string | null;
  appVersion: string | null;
  isActive: boolean;
  isTrusted: boolean;
  lastUsed: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  isCurrentDevice: boolean;
}

export interface DeviceListResponse {
  success: boolean;
  devices: DeviceDTO[];
  totalDevices: number;
  currentDeviceId: string | null;
}

export interface DeviceActionResponse {
  success: boolean;
  message: string;
  deviceId?: string;
}

export interface TrustDeviceRequest {
  trusted: boolean;
}

export interface DeviceInfo {
  deviceUuid: string;
  deviceName?: string;
  platform?: 'iOS' | 'Android' | 'Web' | 'Desktop';
  platformVersion?: string;
  deviceModel?: string;
  appVersion?: string;
  fcmToken?: string;
}

// ============ CUSTOMER/AUTH API TYPES ============

export interface CustomerData {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode?: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  active?: boolean;
  profileImage?: string;
  createdAt?: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: CustomerData;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: DeviceInfo;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: CustomerData;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
}

// ============ EMAIL VERIFICATION API TYPES ============

export interface VerifyEmailRequest {
  verificationCode: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  emailVerified: boolean;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
}

export interface CheckVerificationStatusResponse {
  emailVerified: boolean;
  email: string;
  needsVerification: boolean;
  canResendCode: boolean;
  cooldownSeconds?: number;
}

// ============ PROFILE API TYPES ============

export interface ProfileResponse {
  customerId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileImage?: string;
  active: Boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneCountryCode?: string;
  profileImage?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  profile?: ProfileResponse;
}

export interface DeleteAccountRequest {
  password: string;
  reason?: string;
  permanentDelete?: boolean;
  action?: 'DEACTIVATE' | 'DELETE';
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
}

// ============ PASSWORD API TYPES ============

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  forceLogoutAllDevices: boolean;
}

export interface PasswordStrengthResponse {
  isValid: boolean;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  violations: string[];
  suggestions: string[];
}

// ============================================
// AVAILABILITY TYPES
// ============================================

export interface AvailableSlot {
  time: string; // "HH:mm" format, e.g., "18:00"
  duration: number; // in minutes
  availableCapacity: number;
  totalCapacity: number;
  availableTables: string[]; // table numbers like ["T1", "T5"]
  isAvailable: boolean;
  requiresAdvanceNotice?: boolean; // NEW: true if slot fails advance notice check
  advanceNoticeHours?: number; // NEW: how many hours of notice required
}

export interface AvailabilitySlotsResponse {
  date: string; // "YYYY-MM-DD" format
  partySize: number;
  slots: AvailableSlot[]; // Available slots only (backward compatible)
  restaurantName?: string;
  mealPeriods?: string[]; // ["Lunch", "Dinner"] for UI grouping
  allSlots?: AvailableSlot[]; // NEW: All slots including unavailable ones
}

// ============ ERROR RESPONSE ============

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

