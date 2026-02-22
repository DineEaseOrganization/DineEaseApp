import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AvailableSlot } from '../../types/api.types';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../ui/AppText';

export interface TimeSlotDisplayProps {
  slot: AvailableSlot;
  onPress: (slot: AvailableSlot) => void;
  variant?: 'default' | 'modal' | 'horizontal';
  isSelected?: boolean;
}

export const TimeSlotDisplay: React.FC<TimeSlotDisplayProps> = ({
  slot,
  onPress,
  variant = 'default',
  isSelected = false,
}) => {
  const isLowCapacity = slot.availableCapacity !== undefined && slot.availableCapacity <= 3;

  const containerStyle = [
    styles.slot,
    isSelected && styles.slotSelected,
    variant === 'modal' && styles.slotModal,
    variant === 'horizontal' && styles.slotHorizontal,
  ];

  return (
    <TouchableOpacity style={containerStyle} onPress={() => onPress(slot)}>
      <AppText
        variant={variant === 'modal' ? 'bodySemiBold' : 'buttonSmall'}
        color={isSelected ? Colors.white : Colors.primary}
      >
        {slot.time}
      </AppText>
      {slot.availableCapacity !== undefined && (
        <AppText
          variant="caption"
          color={isSelected ? 'rgba(255,255,255,0.75)' : isLowCapacity ? Colors.capacityLow : Colors.textOnLightSecondary}
          style={styles.capacity}
        >
          {variant === 'modal'
            ? `${slot.availableCapacity} available`
            : `${slot.availableCapacity} avail.`}
        </AppText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  slot: {
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['2'],
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minWidth: 72,
    alignItems: 'center',
  },
  slotSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accentDark,
  },
  slotModal: {
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    minWidth: 84,
  },
  slotHorizontal: {
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minWidth: 84,
  },
  capacity: {
    marginTop: 2,
  },
});

export default TimeSlotDisplay;
