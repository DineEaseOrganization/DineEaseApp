
    
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator, Alert, Linking, FlatList } from 'react-native';
import { CachedImage } from '../../components/CachedImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { RestaurantDetailScreenProps } from '../../navigation/AppNavigator';
import { useAvailabilityStream } from '../../hooks/useAvailabilityStream';
import { useRestaurantDetail } from '../../hooks/useRestaurantQueries';
import { useAuth } from '../../context/AuthContext';
import { Restaurant, mapRestaurantDetailToRestaurant } from '../../types';
import { AvailableSlot, MobileBookingSection, TableTypeOption } from '../../types/api.types';
import { parseAvailabilityError, AvailabilityError } from '../../utils/errorHandlers';
import { AvailabilityErrorDisplay, AllSlotsModal, TimeSlotDisplay } from '../../components/availability';
import PartyDateTimePicker from '../booking/PartyDateTimePicker';
import { currentTimeRounded, formatDateDisplay, formatPartyDateTime } from '../../utils/Datetimeutils';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';
import { processingService } from '../../services/api';

const { width } = Dimensions.get('window');
const heroHeight = Math.round(width * 0.5);

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
    const [selectedTime, setSelectedTime] = useState(() => {
        if (initialSelectedTime && initialSelectedTime !== 'ASAP') return initialSelectedTime;
        return currentTimeRounded();
    });

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [showAllSlotsModal, setShowAllSlotsModal] = useState(false);

    // Optional seating area filter — fetched once per restaurant.
    // When a section is selected, availability is scoped to that area only.
    const [availableSections, setAvailableSections] = useState<MobileBookingSection[]>([]);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);

    // Table type state — shown when the selected section has showTableTypes=true
    const [tableTypes, setTableTypes] = useState<TableTypeOption[]>([]);
    const [selectedTableType, setSelectedTableType] = useState<string | null>(null);
    const [tableTypesLoading, setTableTypesLoading] = useState(false);

    const { data: restaurantDetails } = useRestaurantDetail(initialRestaurant.id);

    useEffect(() => {
        if (restaurantDetails) setRestaurant(mapRestaurantDetailToRestaurant(restaurantDetails));
    }, [restaurantDetails]);

    useEffect(() => {
        const fetchSections = async () => {
            setSectionsLoading(true);
            try {
                const response = await processingService.getAvailableSections(initialRestaurant.id);
                setAvailableSections(response.sections || []);
            } catch {
                // Non-critical — detail screen works without section filtering
            } finally {
                setSectionsLoading(false);
            }
        };
        fetchSections();
    }, [initialRestaurant.id]);

    const dateStr = useMemo(() => {
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [selectedDate]);

    // Fetch table types when the selected section has showTableTypes enabled.
    useEffect(() => {
        setSelectedTableType(null);
        setTableTypes([]);

        const section = availableSections.find(s => s.sectionName === selectedSection);
        if (!section?.showTableTypes || !selectedSection) return;

        const fetchTableTypes = async () => {
            setTableTypesLoading(true);
            try {
                const response = await processingService.getTableTypesForSection(
                    restaurant.id, selectedSection, dateStr, partySize
                );
                setTableTypes(response.tableTypes || []);
            } catch {
                setTableTypes([]);
            } finally {
                setTableTypesLoading(false);
            }
        };
        fetchTableTypes();
    }, [restaurant.id, selectedSection, dateStr, partySize, availableSections]);

    const {
        slots: streamedSlots,
        allSlots: streamedAllSlots,
        isLoading: slotsLoading,
        error: streamError } = useAvailabilityStream({
        restaurantId: restaurant.id,
        date: dateStr,
        partySize,
        sectionName: selectedSection ?? undefined,
        tableType: selectedTableType ?? undefined,
        enabled: true,
        isFocused,
        pollingIntervalMs: 30000 });

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

    // When the selected section has showTableTypes enabled, require a table type
    // selection before showing time slots — prevents booking with ambiguous payment terms.
    const detailTableTypeRequired = selectedSection != null
        && availableSections.find(s => s.sectionName === selectedSection)?.showTableTypes === true
        && !selectedTableType;

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
        navigation.navigate('BookingScreen', {
            restaurant,
            selectedDate,
            partySize,
            selectedTime: slot.time,
            selectedSection: selectedSection ?? undefined,
            selectedTableType: selectedTableType ?? undefined,
        });
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
                            <AppText variant="bodySemiBold" color={Colors.textOnLight} style={{ marginLeft: r(6) }}>
                                {(restaurant.averageRating || 4.5).toFixed(1)}
                            </AppText>
                            <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ marginLeft: Spacing['1'] }}>
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

                    {/* ── Seating area filter (optional, only shown when restaurant has sections) ── */}
                    {(sectionsLoading || availableSections.length > 0) && (
                        <View style={styles.section}>
                            <AppText variant="sectionTitle" color={Colors.primary} style={styles.sectionTitle}>
                                Area Preference (optional)
                            </AppText>
                            <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ marginTop: r(4) }}>
                                Only listed areas can be requested. Other areas are assigned by the restaurant.
                            </AppText>
                            {sectionsLoading ? (
                                <ActivityIndicator size="small" color={Colors.accent} style={{ alignSelf: 'flex-start' }} />
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionChipsRow}>
                                    {/* "Any area" is always first and active when nothing is selected */}
                                    <TouchableOpacity
                                        style={[styles.sectionChip, selectedSection === null && styles.sectionChipSelected]}
                                        onPress={() => { setSelectedSection(null); setSelectedTableType(null); }}
                                        activeOpacity={0.75}
                                    >
                                        <AppText variant="captionMedium" color={selectedSection === null ? Colors.white : Colors.primary}>
                                            Any area
                                        </AppText>
                                    </TouchableOpacity>
                                    {availableSections.map((section) => {
                                        const isSelected = selectedSection === section.sectionName;
                                        return (
                                            <TouchableOpacity
                                                key={section.sectionName}
                                                style={[styles.sectionChip, isSelected && styles.sectionChipSelected]}
                                                onPress={() => { setSelectedSection(isSelected ? null : section.sectionName); setSelectedTableType(null); }}
                                                activeOpacity={0.75}
                                            >
                                                <AppText variant="captionMedium" color={isSelected ? Colors.white : Colors.primary}>
                                                    {section.sectionName}
                                                </AppText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>
                    )}

                    {/* ── Table Type picker (shown when selected section has showTableTypes) ── */}
                    {selectedSection && availableSections.find(s => s.sectionName === selectedSection)?.showTableTypes && (
                        <View style={styles.section}>
                            <AppText variant="sectionTitle" color={Colors.primary} style={styles.sectionTitle}>
                                Table Type
                            </AppText>
                            {tableTypesLoading ? (
                                <ActivityIndicator size="small" color={Colors.accent} style={{ alignSelf: 'flex-start' }} />
                            ) : tableTypes.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionChipsRow}>
                                    {tableTypes.map((tt) => {
                                        const isSelected = selectedTableType === tt.shape;
                                        return (
                                            <TouchableOpacity
                                                key={tt.shape}
                                                style={[
                                                    styles.sectionChip,
                                                    isSelected && styles.sectionChipSelected,
                                                ]}
                                                onPress={() => {
                                                    setSelectedTableType(isSelected ? null : tt.shape);
                                                }}
                                                activeOpacity={0.75}
                                            >
                                                <AppText variant="captionMedium" color={isSelected ? Colors.white : Colors.primary}>
                                                    {tt.label || tt.shape}
                                                </AppText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            ) : null}
                        </View>
                    )}

                    {/* ── Available times ── */}
                    <View style={styles.section}>
                        <AppText variant="sectionTitle" color={Colors.primary} style={styles.sectionTitle}>
                            {selectedSection
                                ? `Times near ${selectedTime} · ${selectedSection}`
                                : `Times near ${selectedTime}`}
                        </AppText>

                        {detailTableTypeRequired ? (
                            <AppText variant="body" color={Colors.textOnLightSecondary} style={{ fontStyle: 'italic' }}>
                                Please select a table type to see available times
                            </AppText>
                        ) : slotsLoading ? (
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
        backgroundColor: Colors.appBackground },
    scrollView: {
        flex: 1 },

    // ── Carousel ──────────────────────────────────────────────────────────────
    imageContainer: {
        position: 'relative',
        height: heroHeight },
    carouselSlide: {
        width,
        height: heroHeight },
    restaurantImage: {
        width: '100%',
        height: '100%' },
    paginationContainer: {
        position: 'absolute',
        bottom: Spacing['3'],
        alignSelf: 'center',
        flexDirection: 'row',
        gap: r(6),
        backgroundColor: Colors.overlayMedium,
        paddingHorizontal: Spacing['2'],
        paddingVertical: Spacing['1'],
        borderRadius: Radius.full },
    dot: {
        width: r(6),
        height: r(6),
        borderRadius: r(3),
        backgroundColor: 'rgba(255,255,255,0.4)' },
    dotActive: {
        width: r(8),
        height: r(8),
        borderRadius: r(4),
        backgroundColor: Colors.white },
    backButton: {
        position: 'absolute',
        top: Spacing['3'],
        left: Spacing['4'],
        width: r(36),
        height: r(36),
        borderRadius: Radius.full,
        backgroundColor: Colors.overlayMedium,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)' },
    backArrow: {
        fontSize: FontSize['2xl'],
        color: Colors.white },

    // ── Name + rating below image ──────────────────────────────────────────────
    nameBlock: {
        marginBottom: Spacing['4'] },
    restaurantName: {
        fontSize: FontSize['2xl'],
        marginBottom: Spacing['1'] },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center' },
    stars: {
        fontSize: rf(13),
        color: Colors.star,
        letterSpacing: 1 },

    // ── Details card ──────────────────────────────────────────────────────────
    detailsCard: {
        backgroundColor: Colors.appBackground,
        marginTop: -Spacing['4'],
        borderTopLeftRadius: Radius['2xl'],
        borderTopRightRadius: Radius['2xl'],
        paddingTop: Spacing['5'],
        paddingHorizontal: Spacing['5'] },

    // ── Quick info ────────────────────────────────────────────────────────────
    quickInfo: {
        flexDirection: 'row',
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.lg,
        padding: Spacing['4'],
        marginBottom: Spacing['4'],
        borderWidth: 1,
        borderColor: Colors.cardBorder },
    quickInfoItem: {
        flex: 1,
        alignItems: 'center',
        gap: Spacing['1'] },
    quickInfoIcon: {
        fontSize: FontSize.xl },
    quickInfoDivider: {
        width: r(1),
        backgroundColor: Colors.cardBorder,
        alignSelf: 'stretch' },

    // ── Address ───────────────────────────────────────────────────────────────
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing['4'],
        gap: Spacing['2'] },
    addressIcon: {
        fontSize: FontSize.base,
        marginTop: r(1) },
    description: {
        lineHeight: rf(22),
        marginBottom: Spacing['4'] },

    // ── Section ───────────────────────────────────────────────────────────────
    section: {
        marginBottom: Spacing['5'] },
    sectionTitle: {
        marginBottom: Spacing['3'] },
    sectionChipsRow: {
        flexDirection: 'row',
        gap: Spacing['2'],
        paddingVertical: Spacing['1'] },
    sectionChip: {
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['2'],
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.primary,
        backgroundColor: Colors.cardBackground },
    sectionChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary },

    // ── Selector button ───────────────────────────────────────────────────────
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.cardBackground,
        paddingVertical: Spacing['3'] + r(2),
        paddingHorizontal: Spacing['4'],
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder },
    selectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'] },
    selectorIcon: {
        fontSize: FontSize.lg },

    // ── Time slots ────────────────────────────────────────────────────────────
    slotsContainer: {
        marginBottom: Spacing['0'] },
    loadingSlots: {
        alignItems: 'center',
        paddingVertical: Spacing['5'] },
    slotsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing['2'] },
    moreTimesButton: {
        marginTop: Spacing['3'] },
    noSlots: {
        fontStyle: 'italic',
        marginTop: Spacing['2'] } });

export default RestaurantDetailScreen;




