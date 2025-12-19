// src/components/booking/PartyDateTimePicker.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface PartyDateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  partySize: number;
  selectedDate: Date;
  selectedTime: string;
  onPartySizeChange: (size: number) => void;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
}

const PartyDateTimePicker: React.FC<PartyDateTimePickerProps> = ({
                                                                   visible,
                                                                   onClose,
                                                                   partySize,
                                                                   selectedDate,
                                                                   selectedTime,
                                                                   onPartySizeChange,
                                                                   onDateChange,
                                                                   onTimeChange,
                                                                 }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Effect to handle time slot availability when date changes
  useEffect(() => {
    const availableSlots = getAvailableTimeSlots();

    // If selected time is not in available slots, reset to first available
    if (!availableSlots.includes(selectedTime)) {
      if (availableSlots.length > 0) {
        onTimeChange(availableSlots[0]);
      }
    }
  }, [selectedDate]);

  const handleDone = () => {
    setShowTimePicker(false);
    onClose();
  };

  /**
   * Generate available time slots based on selected date
   * - Today: ASAP + remaining slots until end of day
   * - Future dates: All slots from 00:00 to 23:30
   */
  const getAvailableTimeSlots = (): string[] => {
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (isToday) {
      // For today: ASAP + remaining times
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();

      // Generate all time slots
      const allSlots: string[] = ['ASAP'];

      // Add slots from current time onwards
      for (let hour = currentHour; hour <= 23; hour++) {
        const startMinute = hour === currentHour ? (currentMinute < 30 ? 30 : 0) : 0;

        for (let minute = startMinute; minute < 60; minute += 30) {
          if (hour === currentHour && minute === 0 && currentMinute > 0) {
            continue; // Skip if we're past the hour mark
          }

          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          // Don't add times that have already passed
          if (hour > currentHour || (hour === currentHour && minute > currentMinute)) {
            allSlots.push(timeStr);
          }
        }
      }

      return allSlots;
    } else {
      // For future dates: All times from 00:00 to 23:30
      const allSlots: string[] = [];

      for (let hour = 0; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          allSlots.push(timeStr);
        }
      }

      return allSlots;
    }
  };

  const timeSlots = getAvailableTimeSlots();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Party Size & Time</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Party Size Selector */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Party Size</Text>
              <View style={styles.partySizeGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.partySizeButton,
                      partySize === size && styles.partySizeButtonActive,
                    ]}
                    onPress={() => onPartySizeChange(size)}
                  >
                    <Text style={[
                      styles.partySizeButtonText,
                      partySize === size && styles.partySizeButtonTextActive,
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Selector */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Date</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerIcon}>📅</Text>
                <Text style={styles.datePickerText}>
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) onDateChange(date);
                  }}
                />
              )}
            </View>

            {/* Time Selector */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Time</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(!showTimePicker)}
              >
                <Text style={styles.timePickerIcon}>🕐</Text>
                <Text style={styles.timePickerText}>{selectedTime}</Text>
                <Text style={styles.dropdownArrow}>{showTimePicker ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showTimePicker && (
                <ScrollView style={styles.timeDropdown} nestedScrollEnabled={true}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={styles.timeDropdownItem}
                      onPress={() => {
                        onTimeChange(time);
                        setShowTimePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.timeDropdownText,
                        selectedTime === time && styles.timeDropdownTextActive,
                      ]}>
                        {time}
                      </Text>
                      {selectedTime === time && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </ScrollView>

          {/* Done Button */}
          <TouchableOpacity
            style={styles.modalDoneButton}
            onPress={handleDone}
          >
            <Text style={styles.modalDoneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  modalScrollView: {
    maxHeight: '100%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300',
  },
  modalSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  partySizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  partySizeButton: {
    width: 60,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  partySizeButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  partySizeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  partySizeButtonTextActive: {
    color: 'white',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  datePickerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timePickerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  timePickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#999',
  },
  timeDropdown: {
    maxHeight: 200,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  timeDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeDropdownText: {
    fontSize: 16,
    color: '#333',
  },
  timeDropdownTextActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#7C3AED',
  },
  modalDoneButton: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PartyDateTimePicker;