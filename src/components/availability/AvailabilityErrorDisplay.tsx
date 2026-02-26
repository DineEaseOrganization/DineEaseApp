// src/components/availability/AvailabilityErrorDisplay.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvailabilityError } from '../../utils/errorHandlers';
import { FontSize, Radius, Spacing } from '../../theme';
import { rf } from '../../theme/responsive';

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
    paddingVertical: Spacing['3'],
  },
  errorBadge: {
    padding: Spacing['4'],
    borderRadius: Radius.lg,
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
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: '#333',
    marginBottom: Spacing['2'],
  },
  errorMessage: {
    fontSize: FontSize.base,
    color: '#666',
    lineHeight: rf(20),
  },
  contactButton: {
    marginTop: Spacing['3'],
    backgroundColor: '#7C3AED',
    paddingVertical: Spacing['2'],
    paddingHorizontal: Spacing['4'],
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    color: 'white',
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});

export default AvailabilityErrorDisplay;
