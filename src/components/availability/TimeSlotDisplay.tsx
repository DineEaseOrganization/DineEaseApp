import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AvailableSlot } from '../../types/api.types';

export interface TimeSlotDisplayProps {
  slot: AvailableSlot;
  onPress: (slot: AvailableSlot) => void;
  variant?: 'default' | 'modal' | 'horizontal';
  isSelected?: boolean;
}

/**
 * Shared component for displaying individual time slots
 * Supports multiple variants for different use cases
 */
export const TimeSlotDisplay: React.FC<TimeSlotDisplayProps> = ({
  slot,
  onPress,
  variant = 'default',
  isSelected = false,
}) => {
  const getContainerStyle = () => {
    const baseStyle = [styles.timeSlot];

    if (isSelected) {
      baseStyle.push(styles.timeSlotSelected);
    }

    if (variant === 'modal') {
      baseStyle.push(styles.timeSlotModal);
    } else if (variant === 'horizontal') {
      baseStyle.push(styles.timeSlotHorizontal);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.timeSlotText];

    if (isSelected) {
      baseStyle.push(styles.timeSlotTextSelected);
    }

    if (variant === 'modal') {
      baseStyle.push(styles.timeSlotTextModal);
    }

    return baseStyle;
  };

  const getCapacityStyle = () => {
    const baseStyle = [styles.capacityText];

    if (slot.availableCapacity !== undefined && slot.availableCapacity <= 3) {
      baseStyle.push(styles.capacityTextLow);
    }

    if (isSelected) {
      baseStyle.push(styles.capacityTextSelected);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={() => onPress(slot)}
    >
      <Text style={getTextStyle()}>{slot.time}</Text>
      {slot.availableCapacity !== undefined && (
        <Text style={getCapacityStyle()}>
          {variant === 'modal' ? `${slot.availableCapacity} available` : `${slot.availableCapacity} avail.`}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#7C3AED',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  timeSlotModal: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 80,
  },
  timeSlotHorizontal: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: 90,
    marginRight: 0,
    marginBottom: 0,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
    textAlign: 'center',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  timeSlotTextModal: {
    fontSize: 16,
    fontWeight: '600',
  },
  capacityText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  capacityTextLow: {
    color: '#e67e22',
    fontWeight: '600',
  },
  capacityTextSelected: {
    color: '#FFA500',
  },
});

export default TimeSlotDisplay;
