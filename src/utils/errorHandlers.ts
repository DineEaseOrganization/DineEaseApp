// src/utils/errorHandlers.ts

// Check if __DEV__ is defined (React Native), otherwise use false
const DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

export interface AvailabilityError {
  type: 'user_friendly' | 'system_error' | 'no_slots' | 'network_error';
  title: string;
  message: string;
  showContactInfo?: boolean;
  action?: 'retry' | 'contact' | 'change_params' | 'none';
}

/**
 * Parse availability API errors into user-friendly messages
 * Handles Spring Boot ErrorResponse structure with nested body.detail
 */
export function parseAvailabilityError(error: any): AvailabilityError {
  // Extract error message from various error structures
  let errorMessage = '';
  let statusCode = error.response?.status || error.statusCode;

  // Debug logging (can be removed in production)
  if (DEV) {
    console.log('=== Error Debug Info ===');
    console.log('Error type:', error.constructor?.name);
    console.log('Error message:', error.message);
    console.log('Error statusCode:', statusCode);
    console.log('Has response:', !!error.response);
    if (error.response?.data) {
      console.log('Response data:', error.response.data);
    }
    console.log('========================');
  }

  // 1. Check if it's our ApiError class (most common case)
  if (error.name === 'ApiError' || error.constructor?.name === 'ApiError') {
    // ApiError already has the extracted message
    errorMessage = error.message;
  }
  // 2. Try Spring Boot ErrorResponse structures
  else if (error.response?.data?.detail) {
    errorMessage = error.response.data.detail;
  } else if (error.response?.data?.title) {
    errorMessage = error.response.data.title;
  } else if (error.response?.data?.body?.detail) {
    errorMessage = error.response.data.body.detail;
  } else if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.response?.data?.reason) {
    errorMessage = error.response.data.reason;
  }
  // 3. Extract from ApiError string format: "[ApiError: message]"
  else if (error.message && error.message.includes('[ApiError:')) {
    const match = error.message.match(/\[ApiError:\s*(.+)\]/);
    if (match) {
      errorMessage = match[1].trim();
    } else {
      errorMessage = error.message;
    }
  }
  // 4. Try entire response data object
  else if (error.response?.data) {
    const data = error.response.data;

    if (typeof data === 'string') {
      errorMessage = data;
    } else {
      errorMessage = data.error || data.errorMessage || '';

      if (!errorMessage) {
        try {
          errorMessage = JSON.stringify(data);
        } catch {
          errorMessage = 'Unknown error format';
        }
      }
    }
  }
  // 5. Fallback to error.message
  else if (error.message) {
    errorMessage = error.message;
  } else {
    errorMessage = 'Unknown error occurred';
  }

  const lowerMessage = errorMessage.toLowerCase();

  // Network errors
  if (!error.response || error.code === 'ECONNABORTED' || lowerMessage.includes('network')) {
    return {
      type: 'network_error',
      title: '🌐 Connection Issue',
      message: 'Unable to connect to the server. Please check your internet connection.',
      action: 'retry'
    };
  }

  // Handle specific user-friendly scenarios

  // 1. Mobile bookings disabled
  if (lowerMessage.includes('mobile bookings are disabled') ||
    lowerMessage.includes('online bookings are disabled')) {
    return {
      type: 'user_friendly',
      title: '📞 Call to Book',
      message: 'This restaurant currently doesn\'t accept online bookings. Please call the restaurant to make a reservation.',
      showContactInfo: true,
      action: 'contact'
    };
  }

  // 2. Party size exceeds maximum
  if (lowerMessage.includes('party size exceeds maximum') ||
    lowerMessage.includes('party size') && lowerMessage.includes('maximum')) {
    // Try to extract max party size from message
    const match = errorMessage.match(/\((\d+)\)/) || errorMessage.match(/(\d+)\s+people/);
    const maxSize = match ? match[1] : '8';
    return {
      type: 'user_friendly',
      title: '👥 Large Party',
      message: `This restaurant accepts online bookings for up to ${maxSize} people. For larger parties, please contact the restaurant directly.`,
      showContactInfo: true,
      action: 'contact'
    };
  }

  // 3. Booking too far in advance
  if (lowerMessage.includes('cannot book more than') ||
    (lowerMessage.includes('days') && lowerMessage.includes('advance'))) {
    // Try to extract number of days
    const match = errorMessage.match(/(\d+)\s+days/);
    const days = match ? match[1] : 'the allowed number of';
    return {
      type: 'user_friendly',
      title: '📅 Date Too Far Ahead',
      message: `Reservations can only be made up to ${days} days in advance. Please select a closer date.`,
      showContactInfo: false,
      action: 'change_params'
    };
  }

  // 4. Insufficient advance notice
  if (lowerMessage.includes('requires at least') ||
    lowerMessage.includes('advance notice') ||
    (lowerMessage.includes('hours') && lowerMessage.includes('notice'))) {
    // Try to extract number of hours
    const match = errorMessage.match(/(\d+)\s+hours/);
    const hours = match ? match[1] : 'several';
    return {
      type: 'user_friendly',
      title: '⏰ Advance Notice Required',
      message: `This restaurant requires at least ${hours} hours advance notice for reservations. Please select a later date or time.`,
      showContactInfo: false,
      action: 'change_params'
    };
  }

  // 5. Restaurant closed on selected date
  if (lowerMessage.includes('closed') || lowerMessage.includes('not open')) {
    return {
      type: 'no_slots',
      title: '🚫 Restaurant Closed',
      message: 'The restaurant is closed on the selected date. Please choose a different day.',
      showContactInfo: false,
      action: 'change_params'
    };
  }

  // 6. No available slots (not really an error, but handle gracefully)
  if (statusCode === 200 ||
    lowerMessage.includes('no available') ||
    lowerMessage.includes('no tables') ||
    lowerMessage.includes('fully booked')) {
    return {
      type: 'no_slots',
      title: '😔 No Availability',
      message: 'Unfortunately, no tables are available for the selected date, time, and party size. Try adjusting your search.',
      showContactInfo: false,
      action: 'change_params'
    };
  }

  // 7. Authentication errors
  if (statusCode === 401 || statusCode === 403) {
    return {
      type: 'system_error',
      title: '🔒 Authentication Required',
      message: 'Please log in to check availability and make reservations.',
      action: 'none'
    };
  }

  // 8. Rate limiting
  if (statusCode === 429) {
    return {
      type: 'system_error',
      title: '⏸️ Too Many Requests',
      message: 'You\'re checking availability too quickly. Please wait a moment and try again.',
      action: 'retry'
    };
  }

  // 9. Server errors (500-599)
  if (statusCode && statusCode >= 500) {
    return {
      type: 'system_error',
      title: '⚠️ Server Error',
      message: 'The restaurant booking system is temporarily unavailable. Please try again in a few minutes.',
      showContactInfo: true,
      action: 'retry'
    };
  }

  // 10. Bad request with validation errors
  if (statusCode === 400) {
    // Try to parse validation errors
    if (error.response?.data?.errors) {
      const errors = error.response.data.errors;
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('\n');
      return {
        type: 'system_error',
        title: '❌ Invalid Request',
        message: errorMessages || 'Please check your input and try again.',
        action: 'none'
      };
    }
  }

  // Generic error fallback
  return {
    type: 'system_error',
    title: '⚠️ Something Went Wrong',
    message: 'Unable to check availability at this time. Please try again or contact the restaurant.',
    showContactInfo: true,
    action: 'retry'
  };
}

/**
 * Get user-friendly action text based on error type
 */
export function getErrorActionText(error: AvailabilityError): string {
  switch (error.action) {
    case 'retry':
      return 'Try Again';
    case 'contact':
      return 'Contact Restaurant';
    case 'change_params':
      return 'Change Selection';
    default:
      return 'OK';
  }
}

/**
 * Determine if error should show contact information
 */
export function shouldShowContactInfo(error: AvailabilityError): boolean {
  return error.showContactInfo === true &&
    (error.type === 'user_friendly' || error.type === 'system_error');
}