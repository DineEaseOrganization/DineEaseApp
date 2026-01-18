// src/components/availability/AllSlotsModal.tsx
import React from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvailableSlot } from '../../types/api.types';
import { TimeSlotDisplay } from './TimeSlotDisplay';

export interface AllSlotsModalProps {
  visible: boolean;
  onClose: () => void;
  slots: AvailableSlot[];
  allSlots?: AvailableSlot[];
  selectedTime?: string;
  onTimeSelect: (slot: AvailableSlot) => void;
  onAdvanceNoticeSlotPress?: (slot: AvailableSlot) => void;
  headerTitle?: string;
  headerSubtitle?: string;
}

/**
 * Shared modal component for displaying all available time slots grouped by meal period
 * Used in RestaurantDetailScreen and BookingScreen
 */
export const AllSlotsModal: React.FC<AllSlotsModalProps> = ({
  visible,
  onClose,
  slots,
  allSlots,
  selectedTime,
  onTimeSelect,
  onAdvanceNoticeSlotPress,
  headerTitle = 'All Available Times',
  headerSubtitle,
}) => {
  const groupSlotsByMealPeriod = (slotsToGroup: AvailableSlot[]) => {
    const groups: { [key: string]: AvailableSlot[] } = {
      'Morning': [],
      'Lunch': [],
      'Afternoon': [],
      'Dinner': [],
      'Late Night': []
    };

    slotsToGroup.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour < 11) {
        groups['Morning'].push(slot);
      } else if (hour < 14) {
        groups['Lunch'].push(slot);
      } else if (hour < 17) {
        groups['Afternoon'].push(slot);
      } else if (hour < 22) {
        groups['Dinner'].push(slot);
      } else {
        groups['Late Night'].push(slot);
      }
    });

    // Filter out empty groups
    return Object.entries(groups).filter(([_, slots]) => slots.length > 0);
  };

  const slotsToDisplay = allSlots && allSlots.length > 0 ? allSlots : slots;
  const available = slotsToDisplay.filter(s => s.isAvailable);
  const requiresNotice = slotsToDisplay.filter(s =>
    !s.isAvailable && s.requiresAdvanceNotice
  );

  const groupedAvailable = groupSlotsByMealPeriod(available);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>{headerTitle}</Text>
            {headerSubtitle && (
              <Text style={styles.modalSubtitle}>{headerSubtitle}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Available Slots by Meal Period */}
          {groupedAvailable.map(([period, periodSlots]) => (
            <View key={period} style={styles.mealPeriodSection}>
              <Text style={styles.mealPeriodTitle}>{period}</Text>
              <View style={styles.modalTimeSlotsList}>
                {periodSlots.map((slot, index) => (
                  <TimeSlotDisplay
                    key={index}
                    slot={slot}
                    onPress={onTimeSelect}
                    variant="modal"
                    isSelected={selectedTime === slot.time}
                  />
                ))}
              </View>
            </View>
          ))}

          {/* Slots Requiring Advance Notice */}
          {requiresNotice.length > 0 && onAdvanceNoticeSlotPress && (
            <View style={styles.mealPeriodSection}>
              <Text style={styles.mealPeriodTitle}>Requires Advance Notice</Text>
              <Text style={styles.advanceNoticeModalSubtext}>
                These times require advance booking. Tap for details.
              </Text>
              <View style={styles.modalTimeSlotsList}>
                {requiresNotice.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.timeSlotDisabled]}
                    onPress={() => onAdvanceNoticeSlotPress(slot)}
                  >
                    <Text style={styles.timeSlotTextDisabled}>
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {available.length === 0 && requiresNotice.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No time slots available for this date.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  mealPeriodSection: {
    marginBottom: 32,
  },
  mealPeriodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  advanceNoticeModalSubtext: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  modalTimeSlotsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  timeSlotDisabled: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    opacity: 0.6,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotTextDisabled: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default AllSlotsModal;
