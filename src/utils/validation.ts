// src/utils/validation.ts

export const ValidationUtils = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number format
   */
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Calculate password strength (0-100)
   */
  getPasswordStrength(password: string): number {
    let strength = 0;

    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;

    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;

    return Math.min(strength, 100);
  },

  /**
   * Validate verification code (6 digits)
   */
  isValidVerificationCode(code: string): boolean {
    return /^\d{6}$/.test(code);
  },

  /**
   * Format phone number with country code
   */
  formatPhoneNumber(phone: string, countryCode: string): string {
    // Remove any existing country code
    const cleanPhone = phone.replace(/^\+?\d{1,3}\s?/, '');
    return `${countryCode} ${cleanPhone}`;
  },

  /**
   * Validate name (letters, spaces, hyphens only)
   */
  isValidName(name: string): boolean {
    return /^[a-zA-Z\s\-']+$/.test(name) && name.length >= 2;
  },

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
};

export const ErrorMessages = {
  // Email errors
  INVALID_EMAIL: 'Please enter a valid email address',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',

  // Password errors
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_PASSWORD: 'Invalid password',
  WEAK_PASSWORD: 'Password is too weak',

  // Phone errors
  INVALID_PHONE: 'Please enter a valid phone number',
  PHONE_REQUIRED: 'Phone number is required',

  // Name errors
  INVALID_NAME: 'Name must contain only letters, spaces, and hyphens',
  NAME_REQUIRED: 'Name is required',
  NAME_TOO_SHORT: 'Name must be at least 2 characters',

  // Verification errors
  INVALID_CODE: 'Please enter a valid 6-digit code',
  CODE_EXPIRED: 'Verification code has expired',
  CODE_INVALID: 'Invalid verification code',
  CODE_ALREADY_USED: 'This verification code has already been used',

  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection',
  TIMEOUT_ERROR: 'Request timeout. Please try again',
  SERVER_ERROR: 'Server error. Please try again later',

  // Auth errors
  UNAUTHORIZED: 'Invalid email or password',
  SESSION_EXPIRED: 'Your session has expired. Please login again',
  ACCESS_DENIED: 'Access denied',

  // Generic errors
  REQUIRED_FIELD: 'This field is required',
  UNKNOWN_ERROR: 'An unexpected error occurred',
};

/**
 * Get user-friendly error message from API error
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.statusCode === 401) {
    return ErrorMessages.UNAUTHORIZED;
  }

  if (error?.statusCode === 403) {
    return ErrorMessages.ACCESS_DENIED;
  }

  if (error?.statusCode === 409) {
    return ErrorMessages.EMAIL_ALREADY_EXISTS;
  }

  if (error?.statusCode >= 500) {
    return ErrorMessages.SERVER_ERROR;
  }

  if (error?.name === 'AbortError') {
    return ErrorMessages.TIMEOUT_ERROR;
  }

  return ErrorMessages.UNKNOWN_ERROR;
};