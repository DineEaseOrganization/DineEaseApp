import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { AvailableSlot } from '../../types/api.types';
import { Colors, Radius, Spacing } from '../../theme';
import { r } from '../../theme/responsive';
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
  // Use availableTableCount (best-fit filtered table count) for display.
  // Fall back to availableTables.length for any older API responses during rollout.
  const tableCount = slot.availableTableCount ?? slot.availableTables?.length ?? 0;
  const isLowCapacity = tableCount <= 1;
  const availabilityLabel = 'available';

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
      <AppText
        variant="caption"
        color={isSelected ? 'rgba(255,255,255,0.75)' : isLowCapacity ? Colors.capacityLow : Colors.textOnLightSecondary}
        style={styles.capacity}
      >
        {variant === 'modal'
          ? `${tableCount} ${availabilityLabel}`
          : `${tableCount} ${availabilityLabel}`}
      </AppText>
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
    minWidth: r(72),
    alignItems: 'center',
  },
  slotSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accentDark,
  },
  slotModal: {
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    minWidth: r(84),
  },
  slotHorizontal: {
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minWidth: r(84),
  },
  capacity: {
    marginTop: r(2),
  },
});

export default TimeSlotDisplay;
