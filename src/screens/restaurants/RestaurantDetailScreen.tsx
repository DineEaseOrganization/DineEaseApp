import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
    Linking,
    FlatList,
} from 'react-native';
import { CachedImage } from '../../components/CachedImage';
import { useIsFocused } from '@react-navigation/native';
import { RestaurantDetailScreenProps } from '../../navigation/AppNavigator';
import { restaurantService } from '../../services/api';
import { useAvailabilityStream } from '../../hooks/useAvailabilityStream';
import { useAuth } from '../../context/AuthContext';
import { Restaurant, mapRestaurantDetailToRestaurant } from '../../types';
import { AvailableSlot } from '../../types/api.types';
import { parseAvailabilityError, AvailabilityError } from '../../utils/errorHandlers';
import { AvailabilityErrorDisplay, AllSlotsModal, TimeSlotDisplay } from '../../components/availability';
import PartyDateTimePicker from '../booking/PartyDateTimePicker';
import { formatDateDisplay, formatPartyDateTime } from '../../utils/Datetimeutils';

const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({ route,
                                                                           navigation }) => {
    const {
        restaurant: initialRestaurant,
        partySize: initialPartySize,
        selectedDate: initialSelectedDate,
        selectedTime: initialSelectedTime
    } = route.params;

    const { isAuthenticated } = useAuth();
    const isFocused = useIsFocused();
    const [restaurant, setRestaurant] = useState<Restaurant>(initialRestaurant);
    const [selectedDate, setSelectedDate] = useState(initialSelectedDate || new Date());
    const [partySize, setPartySize] = useState(initialPartySize || 2);
    const [selectedTime, setSelectedTime] = useState(initialSelectedTime || 'ASAP');

    // Image carousel state
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // Picker modal state
    const [showPickerModal, setShowPickerModal] = useState(false);

    // Restaurant details loading state
    const [loading, setLoading] = useState(false);
    const [showAllSlotsModal, setShowAllSlotsModal] = useState(false);

    // Format date for the streaming hook
    const dateStr = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);

    // Availability data with automatic polling (only when authenticated)
    const {
        slots: streamedSlots,
        allSlots: streamedAllSlots,
        isLoading: slotsLoading,
        error: streamError,
    } = useAvailabilityStream({
        restaurantId: restaurant.id,
        date: dateStr,
        partySize,
        enabled: true,
        isFocused,
        isAuthenticated,
        pollingIntervalMs: 30000,
    });

    // Map streamed slots
    const availableSlots = streamedSlots;

    // Derive availability error from stream error or empty slots
    const [availabilityError, setAvailabilityError] = useState<AvailabilityError | null>(null);

    useEffect(() => {
        if (streamError) {
            const parsedError = parseAvailabilityError(streamError);
            setAvailabilityError(parsedError);
        } else if (!slotsLoading && availableSlots.length === 0) {
            setAvailabilityError({
                type: 'no_slots',
                title: 'No Availability',
                message: 'No tables available for the selected date and party size. Please try a different date or time.',
                showContactInfo: false
            });
        } else {
            setAvailabilityError(null);
        }
    }, [streamError, slotsLoading, availableSlots]);

    useEffect(() => {
        void loadRestaurantDetails();
    }, []);

    const loadRestaurantDetails = async () => {
        try {
            setLoading(true);
            const details = await restaurantService.getRestaurantById(initialRestaurant.id);
            setRestaurant(mapRestaurantDetailToRestaurant(details));
        } catch (error) {
            console.error('Error loading restaurant details:', error);
            Alert.alert('Error', 'Failed to load restaurant details');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Convert time string (HH:MM or ASAP) to minutes since midnight
     */
    const timeToMinutes = (timeStr: string): number => {
        if (timeStr === 'ASAP') {
            const now = new Date();
            return now.getHours() * 60 + now.getMinutes();
        }
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    /**
     * Get slots closest to the selected time
     * Returns 4 slots: 2 before and 2 after (or 4 closest)
     */
    const getClosestSlots = (slots: AvailableSlot[], targetTime: string): AvailableSlot[] => {
        const availableOnly = slots.filter(s => s.isAvailable);

        if (availableOnly.length === 0) return [];
        if (availableOnly.length <= 4) return availableOnly;

        const targetMinutes = timeToMinutes(targetTime);

        // Calculate distance from target time for each slot
        const slotsWithDistance = availableOnly.map(slot => ({
            slot,
            distance: Math.abs(timeToMinutes(slot.time) - targetMinutes)
        }));

        // Sort by distance (closest first)
        slotsWithDistance.sort((a, b) => a.distance - b.distance);

        // Take the 4 closest slots
        const closestSlots = slotsWithDistance.slice(0, 4).map(item => item.slot);

        // Sort by time (chronological order)
        closestSlots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

        return closestSlots;
    };

    const handleCallRestaurant = () => {
        if (!restaurant.phoneNumber) {
            Alert.alert('No Phone Number', 'Phone number not available for this restaurant.');
            return;
        }

        Alert.alert(
          'Contact Restaurant',
          `Phone: ${restaurant.phoneNumber}\n\nWould you like to call now?`,
          [
              { text: 'Cancel', style: 'cancel' },
              {
                  text: 'Call',
                  onPress: () => {
                      const phoneUrl = `tel:${restaurant.phoneNumber.replace(/\s/g, '')}`;
                      Linking.openURL(phoneUrl).catch(err => {
                          console.error('Error opening phone dialer:', err);
                          Alert.alert('Error', 'Unable to open phone dialer');
                      });
                  }
              }
          ]
        );
    };

    const handleTimeSlotSelect = (slot: AvailableSlot) => {
        // Close modal if open
        setShowAllSlotsModal(false);

        navigation.navigate('BookingScreen', {
            restaurant,
            selectedDate,
            partySize,
            selectedTime: slot.time
        });
    };

    const handleAdvanceNoticeSlotPress = (slot: AvailableSlot) => {
        Alert.alert(
          'Advance Notice Required',
          `This time slot requires at least ${slot.advanceNoticeHours || 2} hours advance notice. Please select a later date or time, or call the restaurant to book.`,
          [
              { text: 'OK', style: 'cancel' },
              {
                  text: 'Call Restaurant',
                  onPress: handleCallRestaurant
              }
          ]
        );
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push('★');
        }
        if (hasHalfStar) {
            stars.push('☆');
        }

        return stars.join('');
    };


    // Get the slots to display in preview (closest to selected time)
    const previewSlots = getClosestSlots(availableSlots, selectedTime);

    // Prepare gallery images (cover image + gallery images)
    const galleryImages = [
        restaurant.coverImageUrl,
        ...(restaurant.galleryImages || [])
    ].filter(Boolean); // Remove any null/undefined values

    const handleScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const offset = event.nativeEvent.contentOffset.x;
        const index = Math.round(offset / slideSize);
        setCurrentImageIndex(index);
    };

    const renderImageItem = ({ item }: { item: string }) => (
        <View style={styles.carouselImageContainer}>
            <CachedImage
                uri={item}
                style={styles.restaurantImage}
                fallbackColor="#e8eef4"
            />
        </View>
    );

    return (
      <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Restaurant Image Carousel */}
              <View style={styles.imageContainer}>
                  <FlatList
                      ref={flatListRef}
                      data={galleryImages}
                      renderItem={renderImageItem}
                      keyExtractor={(item, index) => `image-${index}`}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onScroll={handleScroll}
                      scrollEventThrottle={16}
                  />

                  {/* Image pagination dots */}
                  {galleryImages.length > 1 && (
                      <View style={styles.paginationContainer}>
                          {galleryImages.map((_, index) => (
                              <View
                                  key={index}
                                  style={[
                                      styles.paginationDot,
                                      index === currentImageIndex && styles.paginationDotActive
                                  ]}
                              />
                          ))}
                      </View>
                  )}

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                  >
                      <Text style={styles.backButtonText}>←</Text>
                  </TouchableOpacity>
              </View>

              {/* Restaurant Information */}
              <View style={styles.detailsContainer}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>

                  <View style={styles.infoRow}>
                      <Text style={styles.stars}>{renderStars(restaurant.averageRating || 4.5)}</Text>
                      <Text style={styles.ratingText}>
                          {(restaurant.averageRating || 4.5).toFixed(1)} ({restaurant.totalReviews || 0} reviews)
                      </Text>
                  </View>

                  <View style={styles.infoRow}>
                      <Text style={styles.infoIcon}>💰</Text>
                      <Text style={styles.infoText}>{restaurant.priceRange}</Text>
                      <Text style={styles.infoIcon}>🍽️</Text>
                      <Text style={styles.infoText}>{restaurant.cuisineType}</Text>
                  </View>

                  <View style={styles.locationRow}>
                      <Text style={styles.infoIcon}>📍</Text>
                      <Text style={styles.locationText}>{restaurant.address}</Text>
                  </View>

                  {restaurant.description && (
                    <Text style={styles.description}>{restaurant.description}</Text>
                  )}

                  {/* Party Size, Date & Time Selector */}
                  <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Reservation details</Text>
                      <TouchableOpacity
                        style={styles.selectorButton}
                        onPress={() => setShowPickerModal(true)}
                      >
                          <Text style={styles.selectorIcon}>👥</Text>
                          <Text style={styles.selectorText}>
                              {formatPartyDateTime(partySize, selectedDate, selectedTime)}
                          </Text>
                      </TouchableOpacity>
                  </View>

                  {/* Available Time Slots */}
                  <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                          {selectedTime === 'ASAP' ? 'Available times' : `Times near ${selectedTime}`}
                      </Text>

                      {slotsLoading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color="#7C3AED" />
                            <Text style={styles.loadingText}>Finding available times...</Text>
                        </View>
                      ) : availabilityError ? (
                        <AvailabilityErrorDisplay
                          error={availabilityError}
                          onContactRestaurant={handleCallRestaurant}
                        />
                      ) : (
                        <View style={styles.timeSlotsContainer}>
                            {previewSlots.length > 0 ? (
                              <>
                                  <View style={styles.timeSlotsList}>
                                      {previewSlots.map((slot, index) => (
                                        <TimeSlotDisplay
                                          key={index}
                                          slot={slot}
                                          onPress={handleTimeSlotSelect}
                                          variant="default"
                                        />
                                      ))}
                                  </View>
                                  {(availableSlots.filter(s => s.isAvailable).length > 4 ||
                                    availableSlots.filter(s => !s.isAvailable && s.requiresAdvanceNotice).length > 0) && (
                                    <TouchableOpacity
                                      style={styles.moreTimesButton}
                                      onPress={() => setShowAllSlotsModal(true)}
                                    >
                                        <Text style={styles.moreTimesText}>
                                            See all available times →
                                        </Text>
                                    </TouchableOpacity>
                                  )}
                              </>
                            ) : (
                              <Text style={styles.noSlotsText}>No available time slots</Text>
                            )}
                        </View>
                      )}
                  </View>
              </View>
          </ScrollView>

          {/* Party Date Time Picker Modal */}
          <PartyDateTimePicker
            visible={showPickerModal}
            onClose={() => setShowPickerModal(false)}
            partySize={partySize}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onPartySizeChange={setPartySize}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
          />

          {/* All Slots Modal */}
          <AllSlotsModal
            visible={showAllSlotsModal}
            onClose={() => setShowAllSlotsModal(false)}
            slots={availableSlots}
            allSlots={streamedAllSlots}
            selectedTime={selectedTime}
            onTimeSelect={(slot) => handleTimeSlotSelect(slot)}
            onAdvanceNoticeSlotPress={handleAdvanceNoticeSlotPress}
            headerTitle="All Available Times"
            headerSubtitle={`${formatDateDisplay(selectedDate)} • Party of ${partySize}`}
          />
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 250,
    },
    carouselImageContainer: {
        width: Dimensions.get('window').width,
        height: 250,
    },
    restaurantImage: {
        width: '100%',
        height: '100%',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 16,
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 3,
    },
    paginationDotActive: {
        backgroundColor: '#ffffff',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButtonText: {
        fontSize: 24,
        color: '#333',
    },
    detailsContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20,
        padding: 20,
    },
    restaurantName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    stars: {
        fontSize: 16,
        color: '#FFD700',
        marginRight: 8,
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
    },
    infoIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginRight: 16,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    locationText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginTop: 8,
        marginBottom: 16,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    // Selector Button
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectorIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    selectorText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    // Time Slots Display
    timeSlotsContainer: {
        marginBottom: 0,
    },
    centerContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    timeSlotsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    timeSlot: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#e8f5e8',
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 8,
        minWidth: 70,
    },
    timeSlotText: {
        fontSize: 14,
        color: '#27ae60',
        fontWeight: '500',
        textAlign: 'center',
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
    moreTimesButton: {
        marginTop: 4,
    },
    moreTimesText: {
        fontSize: 14,
        color: '#7C3AED',
        fontWeight: '600',
    },
    noSlotsText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        marginTop: 8,
    },
    // Real-time streaming indicator styles
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    liveText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
        textTransform: 'uppercase',
    },
});

export default RestaurantDetailScreen;