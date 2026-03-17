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
  customerId: string; // UUID (external_ref) - Note: mobileCustomerId (BIGINT) is in JWT token
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
  availableTables: string[]; // table numbers that can seat the requested party size (best-fit filtered)
  availableTableCount: number; // explicit count of tables eligible for this party — use this for display
  isAvailable: boolean;
  requiresAdvanceNotice?: boolean; // true if slot fails advance notice check
  advanceNoticeHours?: number; // how many hours of notice required
}

export interface AvailabilitySlotsResponse {
  date: string; // "YYYY-MM-DD" format
  partySize: number;
  slots: AvailableSlot[]; // Available slots only (backward compatible)
  restaurantName?: string;
  mealPeriods?: string[]; // ["Lunch", "Dinner"] for UI grouping
  allSlots?: AvailableSlot[]; // NEW: All slots including unavailable ones
}

// ============ RESERVATION/BOOKING API TYPES ============

export enum ReservationState {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
  CANCELLED_BY_RESTAURANT = 'CANCELLED_BY_RESTAURANT',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CHECKED_IN = 'CHECKED_IN',
}

export interface ReservationCustomerDto {
  customerId?: number;
  name: string;
  phoneNumber: string;
  phoneCountryCode: string;
  email?: string;
  blacklisted?: boolean;
}

export interface ReservationDto {
  reservationId?: number;
  reservationDate: string; // ISO date format (YYYY-MM-DD)
  reservationStartTime: string; // Time format (HH:mm)
  reservationDuration: number; // in minutes
  partySize: number;
  noOfAdults?: number;
  noOfKids?: number;
  isSmoking: boolean;
  customer: ReservationCustomerDto;
  restaurantId: number;
  restaurantName?: string; // Restaurant name fetched from Restaurant service
  area?: string;
  tableNumbers?: string[];
  state: ReservationState;
  comments?: string;
  reservationTypeId?: number;
  tags?: ReservationTagMapping[];
  /** Amount charged (deposit/booking fee) or held (cancellation fee). Null for non-payment bookings. */
  paymentAmount?: number;
  /** ISO-4217 currency code, e.g. "GBP". */
  paymentCurrency?: string;
  /** "DEPOSIT", "BOOKING_FEE", or "CANCELLATION_FEE". */
  paymentTransactionType?: string;
  /**
   * The DineEasePayments policy ID that was active when this reservation was booked.
   * Null for staff-created reservations and legacy bookings.
   *
   * Use this to fetch the exact historical policy on-demand via
   * GET /mobile/reservations/policy/{paymentPolicyId} — only when needed
   * (e.g. the user taps Cancel and needs to see the correct refund terms).
   */
  paymentPolicyId?: number;
}

/**
 * Lightweight policy details returned by GET /mobile/reservations/policy/{policyId}.
 *
 * Mirrors PolicyCheckResponse from DineEaseProcessing. Fetched lazily by the app
 * only when the user is about to cancel a payment-enabled reservation.
 */
export interface ReservationPolicyDetails {
  policyId?: number;
  enabled?: boolean;
  // Cancellation fee
  cancelFeeEnabled?: boolean;
  cancelWindowHours?: number;
  cancellationFeeTiers?: CancellationFeeTier[];
  // Deposit refund
  depositEnabled?: boolean;
  depositWindowHours?: number;
  depositRefundPercent?: number;
  depositRefundTiers?: DepositRefundTier[];
  // Booking fee refund
  bookingFeeEnabled?: boolean;
  bookingFeeWindowHours?: number;
  bookingFeeRefundPercent?: number;
}

export interface ReservationListResponse {
  reservations: ReservationDto[];
  totalCount?: number;
}

// ============ RESERVATION TAG TYPES ============

export interface ReservationTag {
  tagId: number;
  tagName: string;
  icon: string | null;
  displayOrder: number;
  active: boolean;
}

export interface ReservationTagRequest {
  tagId: number;
  note?: string;
}

export interface ReservationTagMapping {
  tagId: number;
  tagName: string;
  icon: string | null;
  note: string | null;
}

// ============ FAVORITES API TYPES ============

export interface FavoriteRestaurant {
  favoriteId: number;
  restaurantId: number;
  restaurantName: string;
  cuisineType: string;
  coverImageUrl: string | null;
  averageRating: number;
  totalReviews: number;
  priceRange: string | null;
  address: string;
  addedAt: string; // ISO date string
}

// Response from GET /customer/favorites
// Backend returns: { restaurants: [...], totalCount, page, totalPages, hasMore }
export interface FavoritesListResponse {
  restaurants?: RestaurantDetail[];
  favorites?: FavoriteRestaurant[]; // Alternative format
  content?: FavoriteRestaurant[]; // Spring Page format
  totalCount?: number;
  page?: number;
  totalPages?: number;
  hasMore?: boolean;
  totalElements?: number; // Spring Page format
  success?: boolean;
}

// Response for add/remove favorite actions
// Backend returns: FavoriteActionResponse(restaurantId, isFavorite, message)
export interface FavoriteActionResponse {
  restaurantId: number;
  isFavorite: boolean;
  message: string;
}

// Aliases for clarity
export type AddFavoriteResponse = FavoriteActionResponse;
export type RemoveFavoriteResponse = FavoriteActionResponse;

export interface CheckFavoriteResponse {
  isFavorite: boolean;
  favoriteId?: number;
}

// ============ ERROR RESPONSE ============

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ============ PAYMENT API TYPES ============

/** Mirrors TransactionType enum from DineEasePayments */
export type TransactionType = 'DEPOSIT' | 'BOOKING_FEE' | 'CANCELLATION_FEE' | 'REFUND' | 'RELEASE';

/** Mirrors TransactionStatus enum from DineEasePayments */
export type TransactionStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'RELEASED'
  | 'CANCELLED';

/** Mirrors FeeType enum */
export type FeeType = 'FIXED' | 'PERCENTAGE' | 'PER_PERSON';

/** Mirrors BookingFeeType enum */
export type BookingFeeType = 'FIXED' | 'PER_PERSON';

/** A single tier in a graduated cancellation fee schedule. */
export interface CancellationFeeTier {
  /** Hours before reservation — cancellations within this threshold are charged at chargePercent. */
  hoursBefore: number;
  /** Percentage of the cancellation fee to charge (0-100). */
  chargePercent: number;
}

/** A single tier in a graduated deposit refund schedule. */
export interface DepositRefundTier {
  tierId?: number;
  /** Hours before reservation — cancellations within this threshold receive refundPercent of the deposit. */
  hoursBefore: number;
  /** Percentage of the deposit to refund (0-100). 0 = keep deposit; 100 = full refund. */
  refundPercent: number;
}

/** The effective payment policy returned by the backend */
export interface PaymentPolicyResponse {
  policyId: number;
  restaurantId: number;
  policyName: string;
  policyLevel: 'RESTAURANT' | 'SECTION';
  sectionId: number | null;
  sectionName: string | null;
  enabled: boolean;
  depositEnabled: boolean;
  depositType: FeeType | null;
  depositValue: number | null;
  depositCurrency: string;
  bookingFeeEnabled: boolean;
  bookingFeeType: BookingFeeType | null;
  bookingFeeValue: number | null;
  bookingFeeCurrency: string;
  cancelFeeEnabled: boolean;
  cancelFeeType: FeeType | null;
  cancelFeeValue: number | null;
  cancelFeeCurrency: string;
  cancelWindowHours: number | null;
  cancelNoShowCharge: boolean;
  /** Graduated cancellation fee tiers, sorted by hoursBefore ascending. */
  cancellationFeeTiers?: CancellationFeeTier[];
  /** Hours before the reservation within which a full deposit refund is given on cancellation */
  depositWindowHours: number | null;
  /** Percentage of the deposit refunded when cancelling outside the free window (0-100) */
  depositRefundPercent: number | null;
  /** Graduated deposit refund tiers. Non-empty takes precedence over flat depositWindowHours/depositRefundPercent. */
  depositRefundTiers?: DepositRefundTier[];
  /** Hours before the reservation within which a full booking fee refund is given on cancellation */
  bookingFeeWindowHours: number | null;
  /** Percentage of the booking fee refunded when cancelling outside the free window (0-100) */
  bookingFeeRefundPercent: number | null;
  stripeAccountId: string | null;
}

/** Response from POST /payments/customer/setup (Stripe Customer + SetupIntent) */
export interface CustomerSetupResponse {
  stripeCustomerId: string;
  setupIntentId: string;
  clientSecret: string;    // SetupIntent client_secret — used to confirm card with Stripe SDK
  status: string;
}

/** A single saved card returned by GET /payments/customer/me/payment-methods */
export interface SavedCard {
  paymentMethodId: string; // Stripe PaymentMethod ID (pm_xxx) — used to remove the card
  last4: string;
  brand: string;     // lowercase: "visa", "mastercard", "amex", etc.
  expMonth: number;
  expYear: number;   // full year, e.g. 2034
}

/** Response from GET /payments/customer/me/payment-methods */
export interface ListPaymentMethodsResponse {
  hasCard: boolean;
  cards: SavedCard[];
}

/** Response from GET /payments/customer/me/ephemeral-key */
export interface EphemeralKeyResponse {
  /** Stripe Customer ID (cus_xxx) — passed as customerId to initPaymentSheet */
  customerId: string;
  /** Short-lived secret for the Stripe React Native SDK's Payment Sheet */
  ephemeralKeySecret: string;
}

/** Response from POST /payments/intent/create (PaymentIntent) */
export interface CreatePaymentIntentResponse {
  transactionId: number;
  paymentIntentId: string;
  clientSecret: string;    // PaymentIntent client_secret — used to confirm payment
  amount: number;          // In major currency units (e.g. 10.00 for £10)
  currency: string;
  transactionType: TransactionType;
  captureDeadlineIso: string | null;  // ISO timestamp — only present for CANCELLATION_FEE holds
}

/**
 * Extended booking response that includes optional Stripe fields.
 * processingService.createReservation() returns this shape when
 * CommitMobileReservationProcessor attaches payment data.
 */
export interface BookingResponseWithPayment {
  reservationId: number;
  /** Present when a new Stripe Customer was created — complete card setup */
  setupClientSecret?: string;
  stripeCustomerId?: string;
  /** Present when an immediate payment was created — confirm with Stripe SDK */
  paymentClientSecret?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentTransactionType?: TransactionType;
  /** Present when a cancellation fee hold was placed */
  holdClientSecret?: string;
  holdAmount?: number;
  holdCurrency?: string;
  holdCaptureDeadline?: string;
}


