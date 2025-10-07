// src/types/api.types.ts

// Device Info
export interface DeviceInfo {
  deviceUuid: string; // Changed from deviceId
  deviceName?: string;
  platform?: 'iOS' | 'Android' | 'Web' | 'Desktop'; // Changed from deviceType
  platformVersion?: string; // Changed from osVersion
  deviceModel?: string;
  appVersion?: string;
  fcmToken?: string;
}

// Customer Data (from API)
export interface CustomerData {
  customerId: string; // Your API returns UUID string, not number
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode?: string; // Optional since backend combines them
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
  // For backwards compatibility
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

// ============ REGISTER ============
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

// ============ LOGIN ============
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

// ============ LOGOUT ============
export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// ============ TOKEN REFRESH ============
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
}

// ============ EMAIL VERIFICATION ============
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

// ============ PROFILE ============
export interface ProfileResponse {
  customerId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode: string;
  emailVerified: boolean;
  profileImage?: string;
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
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
}

// ============ PASSWORD ============
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
}

export interface PasswordStrengthResponse {
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
}

// ============ ERROR RESPONSE ============
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}