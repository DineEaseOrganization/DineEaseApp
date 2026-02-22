import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
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
import { useAvailabilityStream } from '../../hooks/useAvailabilityStream';
import { useRestaurantDetail } from '../../hooks/useRestaurantQueries';
import { useAuth } from '../../context/AuthContext';
import { Restaurant, mapRestaurantDetailToRestaurant } from '../../types';
import { AvailableSlot } from '../../types/api.types';
import { parseAvailabilityError, AvailabilityError } from '../../utils/errorHandlers';
import { AvailabilityErrorDisplay, AllSlotsModal, TimeSlotDisplay } from '../../components/availability';
import PartyDateTimePicker from '../booking/PartyDateTimePicker';
import { formatDateDisplay, formatPartyDateTime } from '../../utils/Datetimeutils';
import { Colors, Radius, Shadow, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';

const { width } = Dimensions.get('window');

const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({ route, navigation }) => {
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

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [showAllSlotsModal, setShowAllSlotsModal] = useState(false);

    const { data: restaurantDetails, isLoading: loading } = useRestaurantDetail(initialRestaurant.id);

    useEffect(() => {
        if (restaurantDetails) setRestaurant(mapRestaurantDetailToRestaurant(restaurantDetails));
    }, [restaurantDetails]);

    const dateStr = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);

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

    const availableSlots = streamedSlots;

    const [availabilityError, setAvailabilityError] = useState<AvailabilityError | null>(null);

    useEffect(() => {
        if (streamError) {
            setAvailabilityError(parseAvailabilityError(streamError));
        } else if (!slotsLoading && availableSlots.length === 0) {
            setAvailabilityError({
                type: 'no_slots',
                title: 'No Availability',
                message: 'No tables available for the selected date and party size. Try a different date or time.',
                showContactInfo: false
            });
        } else {
            setAvailabilityError(null);
        }
    }, [streamError, slotsLoading, availableSlots]);

    const timeToMinutes = (timeStr: string): number => {
        if (timeStr === 'ASAP') {
            const now = new Date();
            return now.getHours() * 60 + now.getMinutes();
        }
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const getClosestSlots = (slots: AvailableSlot[], targetTime: string): AvailableSlot[] => {
        const available = slots.filter(s => s.isAvailable);
        if (available.length <= 4) return available;
        const target = timeToMinutes(targetTime);
        const withDist = available.map(s => ({ s, d: Math.abs(timeToMinutes(s.time) - target) }));
        withDist.sort((a, b) => a.d - b.d);
        const closest = withDist.slice(0, 4).map(x => x.s);
        closest.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
        return closest;
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
                        Linking.openURL(phoneUrl).catch(() => Alert.alert('Error', 'Unable to open phone dialer'));
                    }
                }
            ]
        );
    };

    const handleTimeSlotSelect = (slot: AvailableSlot) => {
        setShowAllSlotsModal(false);
        navigation.navigate('BookingScreen', { restaurant, selectedDate, partySize, selectedTime: slot.time });
    };

    const handleAdvanceNoticeSlotPress = (slot: AvailableSlot) => {
        Alert.alert(
            'Advance Notice Required',
            `This slot requires at least ${slot.advanceNoticeHours || 2} hours advance notice. Please select a later time or call the restaurant.`,
            [{ text: 'OK', style: 'cancel' }, { text: 'Call Restaurant', onPress: handleCallRestaurant }]
        );
    };

    const renderStars = (rating: number) => {
        const full = Math.floor(rating);
        const half = rating % 1 !== 0;
        return '★'.repeat(full) + (half ? '☆' : '');
    };

    const previewSlots = getClosestSlots(availableSlots, selectedTime);

    const galleryImages = [
        restaurant.coverImageUrl,
        ...(restaurant.galleryImages || [])
    ].filter(Boolean) as string[];

    const handleScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const offset = event.nativeEvent.contentOffset.x;
        setCurrentImageIndex(Math.round(offset / slideSize));
    };

    const renderImageItem = ({ item }: { item: string }) => (
        <View style={styles.carouselSlide}>
            <CachedImage uri={item} style={styles.restaurantImage} fallbackColor={Colors.primaryLight} />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                {/* ── Image Carousel ── */}
                <View style={styles.imageContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={galleryImages}
                        renderItem={renderImageItem}
                        keyExtractor={(_, i) => `img-${i}`}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    />

                    {/* Pagination dots */}
                    {galleryImages.length > 1 && (
                        <View style={styles.paginationContainer}>
                            {galleryImages.map((_, i) => (
                                <View
                                    key={i}
                                    style={[styles.dot, i === currentImageIndex && styles.dotActive]}
                                />
                            ))}
                        </View>
                    )}

                    {/* Back button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <AppText style={styles.backArrow}>←</AppText>
                    </TouchableOpacity>
                </View>

                {/* ── Details card ── */}
                <View style={styles.detailsCard}>

                    {/* Name + rating — below image */}
                    <View style={styles.nameBlock}>
                        <AppText variant="h3" color={Colors.primary} numberOfLines={2} style={styles.restaurantName}>
                            {restaurant.name}
                        </AppText>
                        <View style={styles.ratingRow}>
                            <AppText style={styles.stars}>{renderStars(restaurant.averageRating || 4.5)}</AppText>
                            <AppText variant="bodySemiBold" color={Colors.textOnLight} style={{ marginLeft: 6 }}>
                                {(restaurant.averageRating || 4.5).toFixed(1)}
                            </AppText>
                            <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ marginLeft: 4 }}>
                                ({restaurant.totalReviews || 0} reviews)
                            </AppText>
                        </View>
                    </View>

                    {/* Quick info row */}
                    <View style={styles.quickInfo}>
                        <View style={styles.quickInfoItem}>
                            <AppText style={styles.quickInfoIcon}>💰</AppText>
                            <AppText variant="bodyMedium" color={Colors.textOnLight}>{restaurant.priceRange}</AppText>
                        </View>
                        <View style={styles.quickInfoDivider} />
                        <View style={styles.quickInfoItem}>
                            <AppText style={styles.quickInfoIcon}>🍽️</AppText>
                            <AppText variant="bodyMedium" color={Colors.textOnLight}>{restaurant.cuisineType}</AppText>
                        </View>
                        <View style={styles.quickInfoDivider} />
                        <TouchableOpacity style={styles.quickInfoItem} onPress={handleCallRestaurant}>
                            <AppText style={styles.quickInfoIcon}>📞</AppText>
                            <AppText variant="bodyMedium" color={Colors.accent}>Call</AppText>
                        </TouchableOpacity>
                    </View>

                    {/* Address */}
                    <View style={styles.addressRow}>
                        <AppText style={styles.addressIcon}>📍</AppText>
                        <AppText variant="body" color={Colors.textOnLightSecondary} style={{ flex: 1 }}>
                            {restaurant.address}
                        </AppText>
                    </View>

                    {/* Description */}
                    {restaurant.description && (
                        <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.description}>
                            {restaurant.description}
                        </AppText>
                    )}

                    {/* ── Reservation details ── */}
                    <View style={styles.section}>
                        <AppText variant="sectionTitle" color={Colors.primary} style={styles.sectionTitle}>
                            Reservation Details
                        </AppText>
                        <TouchableOpacity style={styles.selectorButton} onPress={() => setShowPickerModal(true)}>
                            <View style={styles.selectorLeft}>
                                <AppText style={styles.selectorIcon}>👥</AppText>
                                <AppText variant="bodyMedium" color={Colors.textOnLight}>
                                    {formatPartyDateTime(partySize, selectedDate, selectedTime)}
                                </AppText>
                            </View>
                            <AppText variant="captionMedium" color={Colors.accent}>Change →</AppText>
                        </TouchableOpacity>
                    </View>

                    {/* ── Available times ── */}
                    <View style={styles.section}>
                        <AppText variant="sectionTitle" color={Colors.primary} style={styles.sectionTitle}>
                            {selectedTime === 'ASAP' ? 'Available Times' : `Times near ${selectedTime}`}
                        </AppText>

                        {slotsLoading ? (
                            <View style={styles.loadingSlots}>
                                <ActivityIndicator size="large" color={Colors.accent} />
                                <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginTop: Spacing['2'] }}>
                                    Finding available times...
                                </AppText>
                            </View>
                        ) : availabilityError ? (
                            <AvailabilityErrorDisplay
                                error={availabilityError}
                                onContactRestaurant={handleCallRestaurant}
                            />
                        ) : (
                            <View style={styles.slotsContainer}>
                                {previewSlots.length > 0 ? (
                                    <>
                                        <View style={styles.slotsList}>
                                            {previewSlots.map((slot, i) => (
                                                <TimeSlotDisplay
                                                    key={i}
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
                                                <AppText variant="bodySemiBold" color={Colors.accent}>
                                                    See all available times →
                                                </AppText>
                                            </TouchableOpacity>
                                        )}
                                    </>
                                ) : (
                                    <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.noSlots}>
                                        No available time slots
                                    </AppText>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Bottom padding */}
                    <View style={{ height: Spacing['8'] }} />
                </View>
            </ScrollView>

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

            <AllSlotsModal
                visible={showAllSlotsModal}
                onClose={() => setShowAllSlotsModal(false)}
                slots={availableSlots}
                allSlots={streamedAllSlots}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSlotSelect}
                onAdvanceNoticeSlotPress={handleAdvanceNoticeSlotPress}
                headerTitle="All Available Times"
                headerSubtitle={`${formatDateDisplay(selectedDate)} · Party of ${partySize}`}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.appBackground,
    },
    scrollView: {
        flex: 1,
    },

    // ── Carousel ──────────────────────────────────────────────────────────────
    imageContainer: {
        position: 'relative',
        height: 220,
    },
    carouselSlide: {
        width,
        height: 220,
    },
    restaurantImage: {
        width: '100%',
        height: '100%',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: Spacing['3'],
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 6,
        backgroundColor: Colors.overlayMedium,
        paddingHorizontal: Spacing['2'],
        paddingVertical: Spacing['1'],
        borderRadius: Radius.full,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.white,
    },
    backButton: {
        position: 'absolute',
        top: Spacing['3'],
        left: Spacing['4'],
        width: 36,
        height: 36,
        borderRadius: Radius.full,
        backgroundColor: Colors.overlayMedium,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    backArrow: {
        fontSize: 20,
        color: Colors.white,
    },

    // ── Name + rating below image ──────────────────────────────────────────────
    nameBlock: {
        marginBottom: Spacing['4'],
    },
    restaurantName: {
        fontSize: 20,
        marginBottom: Spacing['1'],
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stars: {
        fontSize: 13,
        color: Colors.star,
        letterSpacing: 1,
    },

    // ── Details card ──────────────────────────────────────────────────────────
    detailsCard: {
        backgroundColor: Colors.appBackground,
        marginTop: -Spacing['4'],
        borderTopLeftRadius: Radius['2xl'],
        borderTopRightRadius: Radius['2xl'],
        paddingTop: Spacing['5'],
        paddingHorizontal: Spacing['5'],
    },

    // ── Quick info ────────────────────────────────────────────────────────────
    quickInfo: {
        flexDirection: 'row',
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.lg,
        padding: Spacing['4'],
        marginBottom: Spacing['4'],
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    quickInfoItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    quickInfoIcon: {
        fontSize: 20,
    },
    quickInfoDivider: {
        width: 1,
        backgroundColor: Colors.cardBorder,
        alignSelf: 'stretch',
    },

    // ── Address ───────────────────────────────────────────────────────────────
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing['4'],
        gap: Spacing['2'],
    },
    addressIcon: {
        fontSize: 15,
        marginTop: 1,
    },
    description: {
        lineHeight: 22,
        marginBottom: Spacing['4'],
    },

    // ── Section ───────────────────────────────────────────────────────────────
    section: {
        marginBottom: Spacing['5'],
    },
    sectionTitle: {
        marginBottom: Spacing['3'],
    },

    // ── Selector button ───────────────────────────────────────────────────────
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.cardBackground,
        paddingVertical: Spacing['3'] + 2,
        paddingHorizontal: Spacing['4'],
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    selectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
    },
    selectorIcon: {
        fontSize: 18,
    },

    // ── Time slots ────────────────────────────────────────────────────────────
    slotsContainer: {
        marginBottom: 0,
    },
    loadingSlots: {
        alignItems: 'center',
        paddingVertical: Spacing['5'],
    },
    slotsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing['2'],
    },
    moreTimesButton: {
        marginTop: Spacing['3'],
    },
    noSlots: {
        fontStyle: 'italic',
        marginTop: Spacing['2'],
    },
});

export default RestaurantDetailScreen;
