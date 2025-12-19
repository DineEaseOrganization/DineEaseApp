// src/components/booking/BookingCard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { processingService } from '../../services/api';
import { AvailableSlot } from '../../types/api.types';
import { parseAvailabilityError, AvailabilityError } from '../../utils/errorHandlers';

interface BookingCardProps {
  restaurantId: number;
  restaurantName?: string;
  restaurantPhone?: string;
  onTimeSelected?: (date: Date, partySize: number, time: string) => void;
  initialDate?: Date;
  initialPartySize?: number;
}

export const BookingCard: React.FC<BookingCardProps> = ({
                                                          restaurantId,
                                                          restaurantName,
                                                          restaurantPhone,
                                                          onTimeSelected,
                                                          initialDate,
                                                          initialPartySize = 2,
                                                        }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [partySize, setPartySize] = useState<number>(initialPartySize);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AvailabilityError | null>(null);

  useEffect(() => {
    void loadAvailability();
  }, [selectedDate, partySize]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedTime(null);

      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await processingService.getAvailableSlots(
        restaurantId,
        dateStr,
        partySize
      );

      setAvailableSlots(response.slots || []);

      if (!response.slots || response.slots.length === 0) {
        setError({
          type: 'no_slots',
          title: '😔 No Availability',
          message: 'No tables available for this date and party size. Try different options.',
          showContactInfo: false
        });
      }
    } catch (err: any) {
      console.error('Error loading availability:', err);
      const parsedError = parseAvailabilityError(err);
      setError(parsedError);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getNextDays = (count: number = 7) => {
    const days = [];
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (onTimeSelected) {
      onTimeSelected(selectedDate, partySize, time);
    }
  };

  const handleContactRestaurant = () => {
    // Implement contact logic
    console.log('Contact restaurant:', restaurantPhone);
  };

  const groupSlotsByMealPeriod = (slots: AvailableSlot[]) => {
    const groups: { [key: string]: AvailableSlot[] } = {
      'Breakfast': [],
      'Lunch': [],
      'Dinner': [],
      'Late Night': []
    };

    slots.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour < 11) {
        groups['Breakfast'].push(slot);
      } else if (hour < 16) {
        groups['Lunch'].push(slot);
      } else if (hour < 22) {
        groups['Dinner'].push(slot);
      } else {
        groups['Late Night'].push(slot);
      }
    });

    return Object.entries(groups).filter(([_, slots]) => slots.length > 0);
  };

  const renderErrorState = () => {
    if (!error) return null;

    return (
      <View style={[
        styles.errorContainer,
        error.type === 'user_friendly' && styles.errorContainerInfo,
        error.type === 'system_error' && styles.errorContainerError,
        error.type === 'no_slots' && styles.errorContainerWarning
      ]}>
        <Text style={styles.errorTitle}>{error.title}</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>

        {error.showContactInfo && restaurantPhone && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactRestaurant}
          >
            <Text style={styles.contactButtonText}>
              📞 {restaurantPhone}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Party Size */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Party Size</Text>
        <View style={styles.partySizeContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.partySizeButton,
                partySize === size && styles.partySizeButtonActive
              ]}
              onPress={() => setPartySize(size)}
            >
              <Text style={[
                styles.partySizeText,
                partySize === size && styles.partySizeTextActive
              ]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateScroll}
        >
          {getNextDays(14).map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateButton,
                selectedDate.toDateString() === date.toDateString() &&
                styles.dateButtonActive
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dateText,
                selectedDate.toDateString() === date.toDateString() &&
                styles.dateTextActive
              ]}>
                {formatDate(date)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Time Slots */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Available Times</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={styles.loadingText}>Checking availability...</Text>
          </View>
        ) : error ? (
          renderErrorState()
        ) : availableSlots.length > 0 ? (
          <View>
            {groupSlotsByMealPeriod(availableSlots).map(([period, slots]) => (
              <View key={period} style={styles.mealPeriodSection}>
                <Text style={styles.mealPeriodLabel}>{period}</Text>
                <View style={styles.timeSlotsGrid}>
                  {slots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlotButton,
                        selectedTime === slot.time && styles.timeSlotButtonActive,
                        slot.availableCapacity < 5 && styles.timeSlotButtonLimited
                      ]}
                      onPress={() => handleTimeSelect(slot.time)}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTime === slot.time && styles.timeSlotTextActive
                      ]}>
                        {slot.time}
                      </Text>
                      {slot.availableCapacity < 5 && (
                        <Text style={styles.limitedText}>
                          {slot.availableCapacity} left
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  partySizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  partySizeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  partySizeButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  partySizeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  partySizeTextActive: {
    color: 'white',
  },
  dateScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  dateTextActive: {
    color: 'white',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  errorContainerInfo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  errorContainerWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  errorContainerError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
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
  mealPeriodSection: {
    marginBottom: 20,
  },
  mealPeriodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  timeSlotButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  timeSlotButtonLimited: {
    borderColor: '#F59E0B',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  timeSlotTextActive: {
    color: 'white',
  },
  limitedText: {
    fontSize: 10,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
});