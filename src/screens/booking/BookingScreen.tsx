// src/screens/booking/BookingScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { CommonActions, useIsFocused } from '@react-navigation/native';
import { BookingScreenProps } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { useAvailabilityStream } from '../../hooks/useAvailabilityStream';
import { AvailableSlot, ReservationTag, ReservationTagRequest } from '../../types/api.types';
import { parseAvailabilityError, AvailabilityError } from '../../utils/errorHandlers';
import { AvailabilityErrorDisplay, AllSlotsModal, TimeSlotDisplay } from '../../components/availability';
import { processingService, restaurantService } from '../../services/api';
import { Colors, Radius, Spacing, FontFamily, FontSize } from '../../theme';
import AppText from '../../components/ui/AppText';

const BookingScreen: React.FC<BookingScreenProps> = ({ route, navigation }) => {
    const { restaurant, selectedDate, partySize, selectedTime: initialSelectedTime } = route.params;
    const { isAuthenticated, user } = useAuth();
    const isFocused = useIsFocused();

    const dateStr = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);

    const {
        slots: streamedSlots,
        isLoading: slotsLoading,
        error: streamError,
    } = useAvailabilityStream({
        restaurantId: restaurant.id,
        date: dateStr,
        partySize,
        enabled: isAuthenticated,
        isFocused,
        isAuthenticated,
        pollingIntervalMs: 30000,
    });

    const [availabilityError, setAvailabilityError] = useState<AvailabilityError | null>(null);
    const [showAllSlotsModal, setShowAllSlotsModal] = useState(false);
    const availableSlots = streamedSlots;

    const [selectedTime, setSelectedTime] = useState<string>(initialSelectedTime || '');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [availableTags, setAvailableTags] = useState<ReservationTag[]>([]);
    const [selectedTags, setSelectedTags] = useState<ReservationTagRequest[]>([]);

    useEffect(() => {
        if (user) {
            const fullName = `${user.firstName} ${user.lastName}`.trim();
            if (fullName) setCustomerName(fullName);
            if (user.phone) {
                setCustomerPhone(user.phoneCountryCode ? `${user.phoneCountryCode} ${user.phone}` : user.phone);
            }
            if (user.email) setCustomerEmail(user.email);
        }
    }, [user]);

    useEffect(() => {
        if (!isAuthenticated) setShowAuthPrompt(true);
    }, [isAuthenticated]);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const tags = await restaurantService.getReservationTags(restaurant.id);
                setAvailableTags(tags);
            } catch {
                // Non-critical
            }
        };
        fetchTags();
    }, [restaurant.id]);

    const handleTagToggle = (tagId: number) => {
        setSelectedTags(prev => {
            const exists = prev.find(t => t.tagId === tagId);
            if (exists) return prev.filter(t => t.tagId !== tagId);
            return [...prev, { tagId, note: undefined }];
        });
    };

    const handleTagNoteChange = (tagId: number, note: string) => {
        setSelectedTags(prev => prev.map(t => t.tagId === tagId ? { ...t, note: note || undefined } : t));
    };

    useEffect(() => {
        if (streamError) {
            setAvailabilityError(parseAvailabilityError(streamError));
        } else if (!slotsLoading && availableSlots.length === 0) {
            setAvailabilityError({
                type: 'no_slots',
                title: 'No Availability',
                message: 'No tables available for the selected date and party size. Please try a different date or time.',
                showContactInfo: true,
            });
        } else {
            setAvailabilityError(null);
        }
    }, [streamError, slotsLoading, availableSlots]);

    const formatDate = (date: Date) =>
        date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const handleLogin = () => {
        setShowAuthPrompt(false);
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }, { name: 'Login' }] }));
    };

    const handleRegister = () => {
        setShowAuthPrompt(false);
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }, { name: 'Register' }] }));
    };

    const handleGoBack = () => {
        setShowAuthPrompt(false);
        navigation.goBack();
    };

    const handleCallRestaurant = () => {
        if (restaurant.phoneNumber) {
            Alert.alert('Contact Restaurant', `Would you like to call ${restaurant.name}?\n\n${restaurant.phoneNumber}`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Call', onPress: () => console.log('Calling:', restaurant.phoneNumber) },
            ]);
        }
    };

    const handleConfirmBooking = async () => {
        if (!isAuthenticated) { setShowAuthPrompt(true); return; }
        if (!selectedTime || !customerName || !customerPhone) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }
        try {
            setIsLoading(true);
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const token = await AsyncStorage.getItem('@dineease_access_token');
            console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NULL');

            const parsePhoneNumber = (phone: string) => {
                const cleanPhone = phone.replace(/\s+/g, '');
                const patterns = [
                    { code: '+357', length: 4 }, { code: '+30', length: 3 }, { code: '+44', length: 3 },
                    { code: '+1', length: 2 }, { code: '+49', length: 3 }, { code: '+33', length: 3 },
                    { code: '+39', length: 3 }, { code: '+34', length: 3 },
                ];
                for (const { code, length } of patterns) {
                    if (cleanPhone.startsWith(code)) return { phoneCountryCode: code, phoneNumber: cleanPhone.substring(length) };
                }
                return { phoneCountryCode: '+357', phoneNumber: cleanPhone };
            };

            const { phoneNumber, phoneCountryCode } = parsePhoneNumber(customerPhone);
            const reservation = {
                reservationDate: selectedDate.toISOString().split('T')[0],
                reservationStartTime: selectedTime,
                reservationDuration: 120,
                partySize,
                noOfAdults: partySize,
                noOfKids: 0,
                isSmoking: false,
                customer: { name: customerName, phoneNumber, phoneCountryCode, email: customerEmail || undefined },
                restaurantId: restaurant.id,
                state: 'CONFIRMED',
                comments: specialRequests || undefined,
                tagRequests: selectedTags.length > 0 ? selectedTags : undefined,
            };

            const response = await processingService.createReservation(reservation);
            const confirmationCode = response.reservationId ? `RES${response.reservationId}` : 'RES' + Math.random().toString(36).substr(2, 6).toUpperCase();
            setIsLoading(false);
            navigation.navigate('BookingConfirmation', {
                booking: { restaurant, date: selectedDate, time: selectedTime, partySize, customerName, customerPhone, customerEmail, specialRequests, confirmationCode },
            });
        } catch (error: any) {
            setIsLoading(false);
            Alert.alert('Booking Failed', error.message || 'Unable to create reservation. Please try again.', [{ text: 'OK' }]);
        }
    };

    const getVisibleSlots = (): AvailableSlot[] => {
        const available = availableSlots.filter(s => s.isAvailable);
        if (available.length <= 8) return available;
        if (!selectedTime) return available.slice(0, 8);
        const selectedIndex = available.findIndex(s => s.time === selectedTime);
        if (selectedIndex === -1) return available.slice(0, 8);
        const start = Math.max(0, selectedIndex - 3);
        const end = Math.min(available.length, start + 9);
        return available.slice(Math.max(0, end - 8), end);
    };

    const renderAuthPrompt = () => (
        <Modal visible={showAuthPrompt} transparent animationType="fade" onRequestClose={handleGoBack}>
            <View style={styles.modalOverlay}>
                <View style={styles.authCard}>
                    <View style={styles.authIconCircle}>
                        <AppText style={styles.authEmoji}>🔐</AppText>
                    </View>
                    <AppText variant="sectionTitle" color={Colors.primary} style={styles.authTitle}>
                        Sign in to Book
                    </AppText>
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.authMessage}>
                        You need to be signed in to make a reservation at {restaurant.name}
                    </AppText>
                    <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
                        <AppText variant="button" color={Colors.white}>Sign In</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSecondary} onPress={handleRegister}>
                        <AppText variant="button" color={Colors.primary}>Create Account</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnGhost} onPress={handleGoBack}>
                        <AppText variant="body" color={Colors.textOnLightTertiary}>Go Back</AppText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (!isAuthenticated && showAuthPrompt) {
        return <SafeAreaView style={styles.container}>{renderAuthPrompt()}</SafeAreaView>;
    }

    const isFormReady = !!selectedTime && !!customerName && !!customerPhone;

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Navy header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <AppText style={styles.backArrow}>←</AppText>
                </TouchableOpacity>
                <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>
                    Make Reservation
                </AppText>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Restaurant info block ── */}
                <View style={styles.restaurantBlock}>
                    <AppText variant="h3" color={Colors.primary} style={styles.restaurantName} numberOfLines={2}>
                        {restaurant.name}
                    </AppText>
                    <AppText variant="body" color={Colors.textOnLightSecondary}>
                        {formatDate(selectedDate)} · {partySize} {partySize === 1 ? 'guest' : 'guests'}
                    </AppText>
                </View>

                {/* ── Select Time ── */}
                <View style={styles.section}>
                    <View style={styles.sectionLabelRow}>
                        <View style={styles.sectionTick} />
                        <AppText variant="sectionTitle" color={Colors.primary}>Select Time</AppText>
                        {!slotsLoading && !availabilityError && availableSlots.filter(s => s.isAvailable).length > 6 && (
                            <TouchableOpacity onPress={() => setShowAllSlotsModal(true)} style={styles.viewAllBtn}>
                                <AppText variant="captionMedium" color={Colors.accent}>View all →</AppText>
                            </TouchableOpacity>
                        )}
                    </View>

                    {slotsLoading ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color={Colors.accent} />
                            <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginLeft: Spacing['2'] }}>
                                Finding available times...
                            </AppText>
                        </View>
                    ) : availabilityError ? (
                        <AvailabilityErrorDisplay error={availabilityError} onContactRestaurant={handleCallRestaurant} />
                    ) : availableSlots.filter(s => s.isAvailable).length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotScroll}>
                            {getVisibleSlots().map((slot, i) => (
                                <TimeSlotDisplay
                                    key={i}
                                    slot={slot}
                                    onPress={() => setSelectedTime(slot.time)}
                                    variant="modal"
                                    isSelected={selectedTime === slot.time}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <AppText variant="body" color={Colors.textOnLightSecondary} style={{ fontStyle: 'italic' }}>
                            No time slots available
                        </AppText>
                    )}
                </View>

                {/* ── Your Information ── */}
                <View style={styles.section}>
                    <View style={styles.sectionLabelRow}>
                        <View style={styles.sectionTick} />
                        <AppText variant="sectionTitle" color={Colors.primary}>Your Information</AppText>
                    </View>

                    <View style={styles.inputGroup}>
                        <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.inputLabel}>
                            FULL NAME *
                        </AppText>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            placeholderTextColor={Colors.textOnLightTertiary}
                            value={customerName}
                            onChangeText={setCustomerName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.inputLabel}>
                            PHONE NUMBER *
                        </AppText>
                        <TextInput
                            style={styles.input}
                            placeholder="+357 99 123456"
                            placeholderTextColor={Colors.textOnLightTertiary}
                            value={customerPhone}
                            onChangeText={setCustomerPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.inputLabel}>
                            EMAIL (OPTIONAL)
                        </AppText>
                        <TextInput
                            style={styles.input}
                            placeholder="your.email@example.com"
                            placeholderTextColor={Colors.textOnLightTertiary}
                            value={customerEmail}
                            onChangeText={setCustomerEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.inputLabel}>
                            SPECIAL REQUESTS (OPTIONAL)
                        </AppText>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Any dietary restrictions or special requests?"
                            placeholderTextColor={Colors.textOnLightTertiary}
                            value={specialRequests}
                            onChangeText={setSpecialRequests}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* ── Special Occasion tags ── */}
                {availableTags.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionLabelRow}>
                            <View style={styles.sectionTick} />
                            <AppText variant="sectionTitle" color={Colors.primary}>Special Occasion</AppText>
                        </View>
                        <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.tagSubtitle}>
                            Let us know if you're celebrating something special
                        </AppText>
                        <View style={styles.tagsRow}>
                            {availableTags.map((tag) => {
                                const isSelected = selectedTags.some(t => t.tagId === tag.tagId);
                                return (
                                    <TouchableOpacity
                                        key={tag.tagId}
                                        style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                                        onPress={() => handleTagToggle(tag.tagId)}
                                    >
                                        {tag.icon && <AppText style={styles.tagIcon}>{tag.icon}</AppText>}
                                        <AppText
                                            variant="captionMedium"
                                            color={isSelected ? Colors.white : Colors.textOnLight}
                                        >
                                            {tag.tagName}
                                        </AppText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {selectedTags.length > 0 && (
                            <View style={styles.tagNotes}>
                                {selectedTags.map((selectedTag) => {
                                    const tag = availableTags.find(t => t.tagId === selectedTag.tagId);
                                    if (!tag) return null;
                                    return (
                                        <View key={selectedTag.tagId} style={styles.inputGroup}>
                                            <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.inputLabel}>
                                                {tag.icon} {tag.tagName.toUpperCase()} NOTE
                                            </AppText>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Add details (e.g., 'Turning 30!')"
                                                placeholderTextColor={Colors.textOnLightTertiary}
                                                value={selectedTag.note || ''}
                                                onChangeText={(text) => handleTagNoteChange(selectedTag.tagId, text)}
                                            />
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {/* ── Confirm button ── */}
                <TouchableOpacity
                    style={[styles.confirmBtn, (!isFormReady || isLoading) && styles.confirmBtnDisabled]}
                    onPress={handleConfirmBooking}
                    disabled={!isFormReady || isLoading}
                    activeOpacity={0.85}
                >
                    {isLoading ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <AppText variant="button" color={Colors.white}>Confirm Reservation</AppText>
                    )}
                </TouchableOpacity>

                <View style={{ height: Spacing['8'] }} />
            </ScrollView>

            <AllSlotsModal
                visible={showAllSlotsModal}
                onClose={() => setShowAllSlotsModal(false)}
                slots={availableSlots}
                selectedTime={selectedTime}
                onTimeSelect={(slot) => { setSelectedTime(slot.time); setShowAllSlotsModal(false); }}
                headerTitle="All Available Times"
                headerSubtitle={`${formatDate(selectedDate)} · ${partySize} guests`}
            />

            {renderAuthPrompt()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.appBackground,
    },

    // ── Header ─────────────────────────────────────────────────────────────────
    header: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing['5'],
        paddingVertical: Spacing['3'],
        gap: Spacing['3'],
    },
    backBtn: {
        width: 34,
        height: 34,
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        fontSize: 18,
        color: Colors.white,
    },
    headerTitle: {
        fontSize: FontSize.lg,
    },

    // ── Scroll ─────────────────────────────────────────────────────────────────
    scroll: { flex: 1 },
    scrollContent: {
        paddingBottom: Spacing['6'],
    },

    // ── Restaurant block ───────────────────────────────────────────────────────
    restaurantBlock: {
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['5'],
        paddingBottom: Spacing['4'],
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
    },
    restaurantName: {
        fontSize: FontSize['2xl'],
        marginBottom: Spacing['1'],
    },

    // ── Section ────────────────────────────────────────────────────────────────
    section: {
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['5'],
        paddingBottom: Spacing['2'],
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['4'],
    },
    sectionTick: {
        width: 3,
        height: 18,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    viewAllBtn: {
        marginLeft: 'auto',
    },

    // ── Time slots ─────────────────────────────────────────────────────────────
    slotScroll: {
        gap: Spacing['2'],
        paddingBottom: Spacing['3'],
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing['3'],
    },

    // ── Form inputs ────────────────────────────────────────────────────────────
    inputGroup: {
        marginBottom: Spacing['4'],
    },
    inputLabel: {
        marginBottom: Spacing['1'] + 2,
        letterSpacing: 0.8,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['3'],
        fontSize: FontSize.base,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight,
        backgroundColor: Colors.cardBackground,
    },
    textArea: {
        height: 90,
        paddingTop: Spacing['3'],
    },

    // ── Tags ───────────────────────────────────────────────────────────────────
    tagSubtitle: {
        marginTop: -Spacing['2'],
        marginBottom: Spacing['3'],
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing['2'],
        marginBottom: Spacing['3'],
    },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: Spacing['2'],
        paddingHorizontal: Spacing['3'],
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        backgroundColor: Colors.cardBackground,
    },
    tagPillSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    tagIcon: { fontSize: 14 },
    tagNotes: { marginTop: Spacing['2'] },

    // ── Confirm button ─────────────────────────────────────────────────────────
    confirmBtn: {
        marginHorizontal: Spacing['5'],
        marginTop: Spacing['6'],
        backgroundColor: Colors.accent,
        paddingVertical: Spacing['4'],
        borderRadius: Radius.lg,
        alignItems: 'center',
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmBtnDisabled: {
        backgroundColor: Colors.cardBorder,
        shadowOpacity: 0,
        elevation: 0,
    },

    // ── Auth prompt modal ──────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(9,31,43,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing['5'],
    },
    authCard: {
        backgroundColor: Colors.appBackground,
        borderRadius: Radius['2xl'],
        padding: Spacing['6'],
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    authIconCircle: {
        width: 72,
        height: 72,
        borderRadius: Radius.full,
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['4'],
    },
    authEmoji: { fontSize: 34 },
    authTitle: {
        marginBottom: Spacing['2'],
        textAlign: 'center',
    },
    authMessage: {
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing['5'],
    },
    btnPrimary: {
        width: '100%',
        backgroundColor: Colors.accent,
        paddingVertical: Spacing['3'] + 2,
        borderRadius: Radius.lg,
        alignItems: 'center',
        marginBottom: Spacing['2'],
    },
    btnSecondary: {
        width: '100%',
        backgroundColor: Colors.appBackground,
        paddingVertical: Spacing['3'] + 2,
        borderRadius: Radius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary,
        marginBottom: Spacing['2'],
    },
    btnGhost: {
        paddingVertical: Spacing['2'],
        alignItems: 'center',
    },
});

export default BookingScreen;
