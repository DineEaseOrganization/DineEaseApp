// src/screens/booking/BookingScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { BookingScreenProps } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { processingService } from '../../services/api';
import { AvailableSlot, AvailabilitySlotsResponse } from '../../types/api.types';
import { parseAvailabilityError, AvailabilityError } from '../../utils/errorHandlers';

const BookingScreen: React.FC<BookingScreenProps> = ({ route, navigation }) => {
    const { restaurant, selectedDate, partySize, selectedTime: initialSelectedTime } = route.params;
    const { isAuthenticated, user } = useAuth();

    // Slot loading state
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [availabilityError, setAvailabilityError] = useState<AvailabilityError | null>(null);
    const [showAllSlotsModal, setShowAllSlotsModal] = useState(false);

    // Form state
    const [selectedTime, setSelectedTime] = useState<string>(initialSelectedTime || '');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);

    // Auto-fill user information from profile when authenticated
    useEffect(() => {
        if (user) {
            // Combine first and last name
            const fullName = `${user.firstName} ${user.lastName}`.trim();
            if (fullName) {
                setCustomerName(fullName);
            }

            // Set phone with country code if available
            if (user.phone) {
                const phoneNumber = user.phoneCountryCode
                  ? `${user.phoneCountryCode} ${user.phone}`
                  : user.phone;
                setCustomerPhone(phoneNumber);
            }

            // Set email
            if (user.email) {
                setCustomerEmail(user.email);
            }
        }
    }, [user]);

    // Check authentication on mount - show prompt immediately if not logged in
    useEffect(() => {
        if (!isAuthenticated) {
            setShowAuthPrompt(true);
        }
    }, [isAuthenticated]);

    // Load available slots
    useEffect(() => {
        if (isAuthenticated) {
            void loadAvailableSlots();
        }
    }, [selectedDate, partySize, isAuthenticated]);

    const loadAvailableSlots = async () => {
        try {
            setSlotsLoading(true);
            setAvailabilityError(null);

            const dateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const response = await processingService.getAvailableSlots(
              restaurant.id,
              dateStr,
              partySize
            );

            setAvailableSlots(response.slots || []);

            // If no slots available
            if (!response.slots || response.slots.length === 0) {
                setAvailabilityError({
                    type: 'no_slots',
                    title: 'No Availability',
                    message: 'No tables available for the selected date and party size. Please try a different date or time.',
                    showContactInfo: true
                });
            }
        } catch (error: any) {
            console.error('Error loading available slots:', error);
            const parsedError = parseAvailabilityError(error);
            setAvailabilityError(parsedError);
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleLogin = () => {
        setShowAuthPrompt(false);

        navigation.dispatch(
          CommonActions.reset({
              index: 0,
              routes: [
                  { name: 'MainTabs' },
                  { name: 'Login' }
              ],
          })
        );
    };

    const handleRegister = () => {
        setShowAuthPrompt(false);

        navigation.dispatch(
          CommonActions.reset({
              index: 0,
              routes: [
                  { name: 'MainTabs' },
                  { name: 'Register' }
              ],
          })
        );
    };

    const handleGoBack = () => {
        setShowAuthPrompt(false);
        navigation.goBack();
    };

    const handleConfirmBooking = () => {
        if (!isAuthenticated) {
            setShowAuthPrompt(true);
            return;
        }

        if (!selectedTime || !customerName || !customerPhone) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }

        // Mock booking confirmation
        const confirmationCode = 'RES' + Math.random().toString(36).substr(2, 6).toUpperCase();

        navigation.navigate('BookingConfirmation', {
            booking: {
                restaurant,
                date: selectedDate,
                time: selectedTime,
                partySize,
                customerName,
                customerPhone,
                customerEmail,
                specialRequests,
                confirmationCode,
            }
        });
    };

    const handleCallRestaurant = () => {
        if (restaurant.phoneNumber) {
            Alert.alert(
              'Contact Restaurant',
              `Would you like to call ${restaurant.name}?\n\n${restaurant.phoneNumber}`,
              [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Call', onPress: () => {
                          // In a real app, you'd use Linking.openURL(`tel:${restaurant.phoneNumber}`)
                          console.log('Calling restaurant:', restaurant.phoneNumber);
                      }}
              ]
            );
        }
    };

    /**
     * Get visible slots for horizontal scroll
     * Shows 6-8 slots centered around selected time, or first 8 if none selected
     */
    const getVisibleSlots = (): AvailableSlot[] => {
        const available = availableSlots.filter(s => s.isAvailable);

        if (available.length <= 8) {
            return available; // Show all if 8 or fewer
        }

        // If no time selected, show first 8
        if (!selectedTime) {
            return available.slice(0, 8);
        }

        // Find index of selected time
        const selectedIndex = available.findIndex(s => s.time === selectedTime);

        if (selectedIndex === -1) {
            // Selected time not found, show first 8
            return available.slice(0, 8);
        }

        // Show 3 before, selected, and 4 after (total 8 slots)
        const start = Math.max(0, selectedIndex - 3);
        const end = Math.min(available.length, start + 9);

        // Adjust start if we're near the end
        const adjustedStart = Math.max(0, end - 8);

        return available.slice(adjustedStart, end);
    };

    // Group slots by meal period for better organization
    const groupSlotsByMealPeriod = (slots: AvailableSlot[]) => {
        const availableOnly = slots.filter(s => s.isAvailable);

        const groups: { [key: string]: AvailableSlot[] } = {
            'Morning': [],
            'Lunch': [],
            'Afternoon': [],
            'Dinner': [],
            'Late Night': []
        };

        availableOnly.forEach(slot => {
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

        // Filter out empty groups and return as array
        return Object.entries(groups).filter(([_, slots]) => slots.length > 0);
    };

    // Render View All Slots Modal
    const renderAllSlotsModal = () => {
        const groupedSlots = groupSlotsByMealPeriod(availableSlots);

        return (
          <Modal
            visible={showAllSlotsModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowAllSlotsModal(false)}
          >
              <SafeAreaView style={styles.modalContainer}>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                      <View>
                          <Text style={styles.modalTitle}>All Available Times</Text>
                          <Text style={styles.modalSubtitle}>
                              {formatDate(selectedDate)} • {partySize} guests
                          </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowAllSlotsModal(false)}
                        style={styles.closeButton}
                      >
                          <Text style={styles.closeButtonText}>✕</Text>
                      </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalContent}>
                      {groupedSlots.map(([period, slots]) => (
                        <View key={period} style={styles.mealPeriodSection}>
                            <Text style={styles.mealPeriodTitle}>{period}</Text>
                            <View style={styles.timeGrid}>
                                {slots.map((slot, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.timeSlot,
                                        selectedTime === slot.time && styles.timeSlotSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedTime(slot.time);
                                        setShowAllSlotsModal(false);
                                    }}
                                  >
                                      <Text
                                        style={[
                                            styles.timeSlotText,
                                            selectedTime === slot.time && styles.timeSlotTextSelected,
                                        ]}
                                      >
                                          {slot.time}
                                      </Text>
                                      {slot.remainingCapacity !== undefined && slot.remainingCapacity <= 3 && (
                                        <Text style={[
                                            styles.seatsLeftText,
                                            selectedTime === slot.time && styles.seatsLeftTextSelected
                                        ]}>
                                            {slot.remainingCapacity} left
                                        </Text>
                                      )}
                                  </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                      ))}
                  </ScrollView>
              </SafeAreaView>
          </Modal>
        );
    };

    // Render authentication prompt modal
    const renderAuthPrompt = () => (
      <Modal
        visible={showAuthPrompt}
        transparent={true}
        animationType="fade"
        onRequestClose={handleGoBack}
      >
          <View style={styles.modalOverlay}>
              <View style={styles.authPromptContainer}>
                  <View style={styles.authPromptIcon}>
                      <Text style={styles.authPromptEmoji}>🔐</Text>
                  </View>

                  <Text style={styles.authPromptTitle}>Sign in to Book</Text>
                  <Text style={styles.authPromptMessage}>
                      You need to be signed in to make a reservation at {restaurant.name}
                  </Text>

                  <View style={styles.authPromptButtons}>
                      <TouchableOpacity
                        style={styles.authPromptButtonPrimary}
                        onPress={handleLogin}
                      >
                          <Text style={styles.authPromptButtonPrimaryText}>Sign In</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.authPromptButtonSecondary}
                        onPress={handleRegister}
                      >
                          <Text style={styles.authPromptButtonSecondaryText}>Create Account</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.authPromptButtonCancel}
                        onPress={handleGoBack}
                      >
                          <Text style={styles.authPromptButtonCancelText}>Go Back</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>
    );

    // If not authenticated, only show the auth prompt modal
    if (!isAuthenticated && showAuthPrompt) {
        return (
          <SafeAreaView style={styles.container}>
              {renderAuthPrompt()}
          </SafeAreaView>
        );
    }

    return (
      <SafeAreaView style={styles.container}>
          <ScrollView style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                      <Text style={styles.backButton}>← Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.title}>Make Reservation</Text>
              </View>

              {/* Restaurant Info */}
              <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>
                  <Text style={styles.bookingDetails}>
                      {formatDate(selectedDate)} • {partySize} guests
                  </Text>
              </View>

              {/* Time Selection */}
              <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Select Time</Text>
                      {!slotsLoading && !availabilityError && availableSlots.filter(s => s.isAvailable).length > 6 && (
                        <TouchableOpacity onPress={() => setShowAllSlotsModal(true)}>
                            <Text style={styles.viewAllText}>View All →</Text>
                        </TouchableOpacity>
                      )}
                  </View>

                  {slotsLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#7C3AED" />
                        <Text style={styles.loadingText}>Finding available times...</Text>
                    </View>
                  ) : availabilityError ? (
                    <View style={styles.errorContainer}>
                        <View style={styles.errorBadge}>
                            <Text style={styles.errorTitle}>{availabilityError.title}</Text>
                            <Text style={styles.errorMessage}>{availabilityError.message}</Text>
                            {availabilityError.showContactInfo && (
                              <TouchableOpacity
                                style={styles.contactButton}
                                onPress={handleCallRestaurant}
                              >
                                  <Text style={styles.contactButtonText}>Contact Restaurant</Text>
                              </TouchableOpacity>
                            )}
                        </View>
                    </View>
                  ) : availableSlots.filter(s => s.isAvailable).length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontalScrollContent}
                    >
                        {getVisibleSlots().map((slot, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                                styles.timeSlotHorizontal,
                                selectedTime === slot.time && styles.timeSlotSelected,
                            ]}
                            onPress={() => setSelectedTime(slot.time)}
                          >
                              <Text
                                style={[
                                    styles.timeSlotText,
                                    selectedTime === slot.time && styles.timeSlotTextSelected,
                                ]}
                              >
                                  {slot.time}
                              </Text>
                              {slot.remainingCapacity !== undefined && slot.remainingCapacity <= 3 && (
                                <Text style={[
                                    styles.seatsLeftText,
                                    selectedTime === slot.time && styles.seatsLeftTextSelected
                                ]}>
                                    {slot.remainingCapacity} left
                                </Text>
                              )}
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No time slots available</Text>
                    </View>
                  )}
              </View>

              {/* Customer Information */}
              <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Information</Text>

                  <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Full Name *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        value={customerName}
                        onChangeText={setCustomerName}
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Phone Number *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="+357 99 123456"
                        value={customerPhone}
                        onChangeText={setCustomerPhone}
                        keyboardType="phone-pad"
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="your.email@example.com"
                        value={customerEmail}
                        onChangeText={setCustomerEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Special Requests (Optional)</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Any dietary restrictions or special requests?"
                        value={specialRequests}
                        onChangeText={setSpecialRequests}
                        multiline
                        numberOfLines={4}
                      />
                  </View>
              </View>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                    styles.confirmButton,
                    (!selectedTime || !customerName || !customerPhone) && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirmBooking}
                disabled={!selectedTime || !customerName || !customerPhone}
              >
                  <Text style={styles.confirmButtonText}>Confirm Reservation</Text>
              </TouchableOpacity>
          </ScrollView>

          {/* View All Slots Modal */}
          {renderAllSlotsModal()}

          {/* Authentication Prompt Modal */}
          {renderAuthPrompt()}
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        fontSize: 16,
        color: '#7C3AED',
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    restaurantInfo: {
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    restaurantName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    bookingDetails: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    viewAllText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7C3AED',
    },
    horizontalScrollContent: {
        paddingRight: 20,
        gap: 12,
    },
    timeSlotHorizontal: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        minWidth: 90,
        alignItems: 'center',
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: '#999',
        marginTop: 12,
    },
    errorContainer: {
        marginVertical: 10,
    },
    errorBadge: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FECACA',
        padding: 16,
        borderRadius: 12,
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
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    timeSlot: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        minWidth: 80,
        alignItems: 'center',
    },
    timeSlotDisabled: {
        backgroundColor: '#f9f9f9',
        opacity: 0.5,
    },
    timeSlotSelected: {
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    timeSlotText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    timeSlotTextDisabled: {
        color: '#999',
    },
    timeSlotTextSelected: {
        color: '#fff',
    },
    seatsLeftText: {
        fontSize: 11,
        color: '#e67e22',
        marginTop: 4,
    },
    seatsLeftTextSelected: {
        color: '#FFA500',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    confirmButton: {
        margin: 20,
        backgroundColor: '#7C3AED',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmButtonDisabled: {
        backgroundColor: '#CCCCCC',
        shadowOpacity: 0,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Auth Prompt Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    authPromptContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    authPromptIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    authPromptEmoji: {
        fontSize: 40,
    },
    authPromptTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    authPromptMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    authPromptButtons: {
        width: '100%',
        gap: 12,
    },
    authPromptButtonPrimary: {
        backgroundColor: '#7C3AED',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    authPromptButtonPrimaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    authPromptButtonSecondary: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#7C3AED',
    },
    authPromptButtonSecondaryText: {
        color: '#7C3AED',
        fontSize: 16,
        fontWeight: 'bold',
    },
    authPromptButtonCancel: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    authPromptButtonCancelText: {
        color: '#999',
        fontSize: 16,
    },
    // View All Modal Styles
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
        fontSize: 22,
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
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
});

export default BookingScreen;