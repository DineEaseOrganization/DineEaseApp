// src/components/availability/AvailabilityErrorDisplay.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvailabilityError } from '../../utils/errorHandlers';

export interface AvailabilityErrorDisplayProps {
  error: AvailabilityError;
  onContactRestaurant?: () => void;
}

/**
 * Shared component for displaying availability errors with consistent styling
 * Used in RestaurantDetailScreen and BookingScreen
 */
export const AvailabilityErrorDisplay: React.FC<AvailabilityErrorDisplayProps> = ({
  error,
  onContactRestaurant,
}) => {
  return (
    <View style={styles.errorContainer}>
      <View style={[
        styles.errorBadge,
        error.type === 'no_slots' && styles.errorBadgeInfo,
        error.type === 'user_friendly' && styles.errorBadgeWarning,
        error.type === 'system_error' && styles.errorBadgeError,
        error.type === 'network_error' && styles.errorBadgeNetwork,
      ]}>
        <Text style={styles.errorTitle}>{error.title}</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        {error.showContactInfo && onContactRestaurant && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={onContactRestaurant}
          >
            <Text style={styles.contactButtonText}>Contact Restaurant</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    paddingVertical: 12,
  },
  errorBadge: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorBadgeInfo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  errorBadgeWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  errorBadgeError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  errorBadgeNetwork: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactButton: {
    marginTop: 12,
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AvailabilityErrorDisplay;
