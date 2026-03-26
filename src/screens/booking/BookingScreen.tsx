// src/screens/booking/BookingScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDateWeekdayLongDayMonthYear } from '../../utils/Datetimeutils';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useIsFocused } from '@react-navigation/native';
import { BookingScreenProps } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { useAvailabilityStream } from '../../hooks/useAvailabilityStream';
import {
    AvailableSlot,
    BookingResponseWithPayment,
    MobileBookingSection,
    PaymentPolicyResponse,
    ReservationTag,
    ReservationTagRequest
} from '../../types/api.types';
import { AvailabilityError, parseAvailabilityError } from '../../utils/errorHandlers';
import { AllSlotsModal, AvailabilityErrorDisplay, TimeSlotDisplay } from '../../components/availability';
import { processingService, restaurantService } from '../../services/api';
import { paymentService } from '../../services/api/paymentService';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';

const BookingScreen: React.FC<BookingScreenProps> = ({ route, navigation }) => {
    const { restaurant, selectedDate, partySize, selectedTime: initialSelectedTime, selectedSection: initialSelectedSection } = route.params;
    const { isAuthenticated, user } = useAuth();
    const isFocused = useIsFocused();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const dateStr = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);

    // Section state must be declared before useAvailabilityStream so the hook
    // can react to section selection changes. Pre-populated from the detail screen
    // when the user already chose an area there; otherwise starts as null (all areas).
    const [availableSections, setAvailableSections] = useState<MobileBookingSection[]>([]);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [selectedSection, setSelectedSection] = useState<string | null>(initialSelectedSection ?? null);

    const {
        slots: streamedSlots,
        isLoading: slotsLoading,
        error: streamError } = useAvailabilityStream({
        restaurantId: restaurant.id,
        date: dateStr,
        partySize,
        sectionName: selectedSection ?? undefined,
        // Always fetch availability — section is optional, not a gate.
        // When a section is selected, availability is scoped to that area;
        // when null, restaurant-wide availability is returned.
        enabled: isAuthenticated,
        isFocused,
        isAuthenticated,
        pollingIntervalMs: 30000 });

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
    const [paymentPolicy, setPaymentPolicy] = useState<PaymentPolicyResponse | null>(null);

    const slotScrollRef = useRef<ScrollView>(null);
    const slotPositions = useRef<Record<string, number>>({ });

    const scrollToSelectedSlot = (time: string) => {
        const x = slotPositions.current[time];
        if (typeof x === 'number') {
            slotScrollRef.current?.scrollTo({ x: Math.max(0, x - Spacing['4']), animated: true });
        }
    };

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

    // Fetch sections configured for mobile booking. When sections exist the user
    // must pick one before availability is fetched, so slots are always scoped
    // to a specific area. If no sections are configured this effect is a no-op
    // and the restaurant-wide availability flow continues unchanged.
    useEffect(() => {
        const fetchSections = async () => {
            setSectionsLoading(true);
            try {
                const response = await processingService.getAvailableSections(restaurant.id);
                setAvailableSections(response.sections || []);
            } catch {
                // Non-critical — fall back to restaurant-wide availability with no section picker
            } finally {
                setSectionsLoading(false);
            }
        };
        fetchSections();
    }, [restaurant.id]);

    // Fetch the restaurant's active payment policy so we can show the user
    // exactly what charge / hold will apply before they confirm the booking.
    // Re-fetches whenever the selected section changes so a section-level
    // policy override is reflected immediately.
    useEffect(() => {
        const fetchPolicy = async () => {
            const policy = await paymentService.getEffectivePolicy(restaurant.id, selectedSection ?? undefined);
            setPaymentPolicy(policy?.enabled ? policy : null);
        };
        fetchPolicy();
    }, [restaurant.id, selectedSection]);

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
                showContactInfo: true });
        } else {
            setAvailabilityError(null);
        }
    }, [streamError, slotsLoading, availableSlots]);

    useEffect(() => {
        if (selectedTime) {
            scrollToSelectedSlot(selectedTime);
        }
    }, [selectedTime, availableSlots]);

    const formatDate = (date: Date) => formatDateWeekdayLongDayMonthYear(date);

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
                area: selectedSection ?? undefined,
                state: 'CONFIRMED',
                comments: specialRequests || undefined,
                tagRequests: selectedTags.length > 0 ? selectedTags : undefined };

            const response: BookingResponseWithPayment = await processingService.createReservation(reservation);
            const confirmationCode = response.reservationId ? `RES${response.reservationId}` : 'RES' + Math.random().toString(36).substr(2, 6).toUpperCase();

            // ── Build shared navigation params ────────────────────────────────────
            const bookingParams = {
                restaurant,
                date: selectedDate,
                time: selectedTime,
                partySize,
                customerName,
                customerPhone,
                customerEmail,
                specialRequests,
                confirmationCode,
                setupClientSecret: response.setupClientSecret,
                paymentClientSecret: response.paymentClientSecret,
                paymentAmount: response.paymentAmount,
                paymentCurrency: response.paymentCurrency,
                paymentTransactionType: response.paymentTransactionType,
                holdClientSecret: response.holdClientSecret,
                holdAmount: response.holdAmount,
                holdCurrency: response.holdCurrency,
                holdCaptureDeadline: response.holdCaptureDeadline,
            };

            // ── Payment handling ──────────────────────────────────────────────────
            // If the backend returned a PaymentIntent secret (deposit / booking fee)
            // or a hold secret (cancellation-fee hold), collect the payment NOW via
            // the Stripe Payment Sheet before showing the confirmation screen.
            // setupClientSecret-only means "please save a card for future use" —
            // that is handled on the confirmation screen as a best-effort step.
            const immediatePaymentSecret = response.paymentClientSecret ?? response.holdClientSecret;

            if (immediatePaymentSecret) {
                // Attempt to fetch an ephemeral key so the Payment Sheet can pre-fill
                // the customer's saved card. This will fail with 404 for customers who
                // have never saved a card — that's fine, we just proceed in card-entry mode.
                let ephemeralKeySecret: string | undefined;
                let stripeCustomerId: string | undefined;
                try {
                    const ek = await paymentService.getEphemeralKey();
                    ephemeralKeySecret = ek.ephemeralKeySecret;
                    stripeCustomerId = ek.customerId;
                } catch {
                    // No saved card yet — Payment Sheet opens in card-entry mode instead
                }

                const { error: initError } = await initPaymentSheet({
                    paymentIntentClientSecret: immediatePaymentSecret,
                    merchantDisplayName: 'DineEase',
                    allowsDelayedPaymentMethods: false,
                    // Only pass customer fields when we have both — the SDK requires them
                    // together and will return an initError if only one is provided.
                    ...(stripeCustomerId && ephemeralKeySecret
                        ? { customerId: stripeCustomerId, customerEphemeralKeySecret: ephemeralKeySecret }
                        : {}),
                });

                setIsLoading(false);

                if (initError) {
                    // Stripe SDK couldn't initialise — system-level failure, not the user's fault.
                    // Fail-open: keep the ON_HOLD reservation so they can retry payment from
                    // the Reservations screen once the issue clears.
                    Alert.alert(
                        'Payment System Unavailable',
                        'We couldn\'t open the payment screen right now. Your booking is on hold — you can complete payment from your Reservations.',
                    );
                    navigation.navigate('BookingConfirmation', { booking: bookingParams });
                    return;
                }

                // Silently cancel the ON_HOLD reservation when the customer abandons payment.
                // Best-effort — a background job will expire orphaned holds if this fails.
                const cancelOnHoldReservation = async () => {
                    try { await processingService.cancelReservation(response.reservationId); } catch { /* empty */ }
                };

                // Present the Payment Sheet — user sees their saved card or enters a new one
                const { error: sheetError } = await presentPaymentSheet();

                if (!sheetError) {
                    // Payment confirmed — show the confirmation screen
                    navigation.navigate('BookingConfirmation', { booking: bookingParams });
                    return;
                }

                if (sheetError.code === 'Canceled') {
                    // User deliberately dismissed the sheet — payment is required so we must
                    // cancel the ON_HOLD reservation to free the slot.
                    await cancelOnHoldReservation();
                    Alert.alert(
                        'Booking Cancelled',
                        'Payment is required to confirm your reservation. Your booking has been cancelled — please try again when you\'re ready to pay.',
                        [{ text: 'OK' }],
                    );
                    return; // Stay on BookingScreen, no confirmation
                }

                // Payment failed (card declined, network error, etc.) — give the user options
                Alert.alert(
                    'Payment Failed',
                    sheetError.message ?? 'Your card could not be charged.',
                    [
                        {
                            text: 'Try Again',
                            onPress: async () => {
                                // presentPaymentSheet can be re-called without re-initialising
                                const { error: retryError } = await presentPaymentSheet();
                                if (!retryError) {
                                    navigation.navigate('BookingConfirmation', { booking: bookingParams });
                                } else {
                                    // Still failing — keep booking on hold so they can retry later
                                    Alert.alert(
                                        'Payment Pending',
                                        'Payment could not be completed. Your booking is on hold — you can retry from your Reservations.',
                                    );
                                    navigation.navigate('BookingConfirmation', { booking: bookingParams });
                                }
                            },
                        },
                        {
                            text: 'Cancel Booking',
                            style: 'destructive',
                            onPress: async () => {
                                await cancelOnHoldReservation();
                                Alert.alert('Booking Cancelled', 'Your reservation has been cancelled.');
                            },
                        },
                    ],
                );
            } else {
                // No immediate payment needed — may still have a setupClientSecret for
                // the "save your card" flow shown on the confirmation screen.
                setIsLoading(false);
                navigation.navigate('BookingConfirmation', { booking: bookingParams });
            }
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

    // Build a concise, user-facing description of the applicable charge.
    // For PER_PERSON fee types the total = value × partySize; we show both
    // the per-person rate and the total so the user is never surprised.
    const policyNotice: { icon: 'card-outline' | 'shield-outline' | 'cash-outline'; title: string; body: string; accent: string } | null =
        (() => {
            if (!paymentPolicy) return null;
            const fmt = (val: number | null, cur: string) =>
                val != null ? paymentService.formatAmount(val, cur) : '';

            /** Compute the actual charge amount and an optional breakdown note. */
            const resolveAmount = (
                value: number,
                type: string | null,
                currency: string,
            ): { total: string; breakdown: string } => {
                if (type === 'PER_PERSON') {
                    const total = value * partySize;
                    return {
                        total: fmt(total, currency),
                        breakdown: ` (${fmt(value, currency)} × ${partySize} guests)`,
                    };
                }
                return { total: fmt(value, currency), breakdown: '' };
            };

            if (paymentPolicy.depositEnabled && paymentPolicy.depositValue != null) {
                const { total, breakdown } = resolveAmount(
                    paymentPolicy.depositValue,
                    paymentPolicy.depositType,
                    paymentPolicy.depositCurrency,
                );
                const windowNote = paymentPolicy.depositWindowHours != null
                    ? ` Free cancellation if you cancel more than ${paymentPolicy.depositWindowHours} hours in advance.`
                    : '';
                const refundNote = paymentPolicy.depositRefundPercent != null && paymentPolicy.depositRefundPercent > 0 && paymentPolicy.depositWindowHours != null
                    ? ` If cancelled within ${paymentPolicy.depositWindowHours} hours, ${paymentPolicy.depositRefundPercent}% is refunded.`
                    : '';
                return {
                    icon: 'cash-outline',
                    title: `Deposit required — ${total}`,
                    body: `A deposit of ${total}${breakdown} will be charged to your card when you confirm. It will be applied towards your bill.${windowNote}${refundNote}`,
                    accent: '#1d4ed8',
                };
            }
            if (paymentPolicy.bookingFeeEnabled && paymentPolicy.bookingFeeValue != null) {
                const { total, breakdown } = resolveAmount(
                    paymentPolicy.bookingFeeValue,
                    paymentPolicy.bookingFeeType,
                    paymentPolicy.bookingFeeCurrency,
                );
                const windowNote = paymentPolicy.bookingFeeWindowHours != null
                    ? ` Free cancellation if you cancel more than ${paymentPolicy.bookingFeeWindowHours} hours in advance.`
                    : '';
                const refundNote = paymentPolicy.bookingFeeRefundPercent != null && paymentPolicy.bookingFeeRefundPercent > 0 && paymentPolicy.bookingFeeWindowHours != null
                    ? ` If cancelled within ${paymentPolicy.bookingFeeWindowHours} hours, ${paymentPolicy.bookingFeeRefundPercent}% is refunded.`
                    : '';
                return {
                    icon: 'card-outline',
                    title: `Booking fee — ${total}`,
                    body: `A non-refundable booking fee of ${total}${breakdown} will be charged to your card when you confirm.${windowNote}${refundNote}`,
                    accent: '#1d4ed8',
                };
            }
            if (paymentPolicy.cancelFeeEnabled && paymentPolicy.cancelFeeValue != null) {
                const { total, breakdown } = resolveAmount(
                    paymentPolicy.cancelFeeValue,
                    paymentPolicy.cancelFeeType,
                    paymentPolicy.cancelFeeCurrency,
                );
                const tiers = paymentPolicy.cancellationFeeTiers;
                if (tiers && tiers.length > 0) {
                    // Tiered cancellation — show graduated schedule
                    const sorted = [...tiers].sort((a, b) => a.hoursBefore - b.hoursBefore);
                    const feeVal = paymentPolicy.cancelFeeValue;
                    const cur = paymentPolicy.cancelFeeCurrency;
                    const lines = sorted.map((t, i) => {
                        const chargeAmt = fmt((feeVal * t.chargePercent) / 100, cur);
                        const prevHours = i > 0 ? sorted[i - 1].hoursBefore : 0;
                        return `• ${prevHours}–${t.hoursBefore}h before: ${t.chargePercent}% fee (${chargeAmt})`;
                    });
                    lines.push(`• ${sorted[sorted.length - 1].hoursBefore}h+ before: Free cancellation`);
                    return {
                        icon: 'shield-outline',
                        title: `Cancellation policy — ${total} hold`,
                        body: `A ${total}${breakdown} hold will be placed on your card. Charges depend on when you cancel:\n${lines.join('\n')}`,
                        accent: Colors.primary as string,
                    };
                }
                const window = paymentPolicy.cancelWindowHours ?? 24;
                return {
                    icon: 'shield-outline',
                    title: `Cancellation policy — ${total} hold`,
                    body: `A ${total}${breakdown} authorisation hold will be placed on your card. It is released automatically if you cancel more than ${window} hours in advance.`,
                    accent: Colors.primary as string,
                };
            }
            return null;
        })();

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

                {/* ── Seating Area (optional, only shown when restaurant has sections configured) ── */}
                {(sectionsLoading || availableSections.length > 0) && (
                    <View style={styles.section}>
                        <View style={styles.sectionLabelRow}>
                            <View style={styles.sectionTick} />
                            <AppText variant="sectionTitle" color={Colors.primary}>Seating Area</AppText>
                        </View>

                        {sectionsLoading ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color={Colors.accent} />
                                <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginLeft: Spacing['2'] }}>
                                    Loading seating areas...
                                </AppText>
                            </View>
                        ) : (
                            // Always-visible grid — "Any area" is pre-selected and communicates optionality
                            <View style={styles.sectionGrid}>
                                <TouchableOpacity
                                    style={[styles.sectionCard, selectedSection === null && styles.sectionCardSelected]}
                                    onPress={() => { setSelectedSection(null); setSelectedTime(''); }}
                                    activeOpacity={0.75}
                                >
                                    <Ionicons
                                        name="apps-outline"
                                        size={rf(20)}
                                        color={selectedSection === null ? Colors.white : Colors.primary}
                                        style={{ marginBottom: r(6) }}
                                    />
                                    <AppText
                                        variant="bodySemiBold"
                                        color={selectedSection === null ? Colors.white : Colors.primary}
                                        style={{ textAlign: 'center' }}
                                    >
                                        Any area
                                    </AppText>
                                </TouchableOpacity>
                                {availableSections.map((section) => {
                                    const isSelected = selectedSection === section.sectionName;
                                    return (
                                        <TouchableOpacity
                                            key={section.sectionName}
                                            style={[styles.sectionCard, isSelected && styles.sectionCardSelected]}
                                            onPress={() => { setSelectedSection(isSelected ? null : section.sectionName); setSelectedTime(''); }}
                                            activeOpacity={0.75}
                                        >
                                            <Ionicons
                                                name="location-outline"
                                                size={rf(20)}
                                                color={isSelected ? Colors.white : Colors.primary}
                                                style={{ marginBottom: r(6) }}
                                            />
                                            <AppText
                                                variant="bodySemiBold"
                                                color={isSelected ? Colors.white : Colors.primary}
                                                style={{ textAlign: 'center' }}
                                            >
                                                {section.sectionName}
                                            </AppText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {/* ── Select Time ── */}
                <View style={styles.section}>
                    <View style={styles.sectionLabelRow}>
                        <View style={styles.sectionTick} />
                        <AppText variant="sectionTitle" color={Colors.primary}>
                            {selectedSection ? `Select Time · ${selectedSection}` : 'Select Time'}
                        </AppText>
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
                        <ScrollView
                            ref={slotScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.slotScroll}
                        >
                            {getVisibleSlots().map((slot, i) => (
                                <View
                                    key={i}
                                    onLayout={(e) => {
                                        slotPositions.current[slot.time] = e.nativeEvent.layout.x;
                                        if (selectedTime === slot.time) {
                                            scrollToSelectedSlot(slot.time);
                                        }
                                    }}
                                >
                                    <TimeSlotDisplay
                                        slot={slot}
                                        onPress={() => setSelectedTime(slot.time)}
                                        variant="modal"
                                        isSelected={selectedTime === slot.time}
                                    />
                                </View>
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

                {/* ── Payment policy notice ── */}
                {policyNotice && (
                    <View style={styles.policyBanner}>
                        <View style={[styles.policyBannerAccent, { backgroundColor: policyNotice.accent }]} />
                        <View style={styles.policyBannerBody}>
                            <View style={styles.policyBannerHeader}>
                                <Ionicons name={policyNotice.icon} size={rf(16)} color={policyNotice.accent} style={{ marginRight: r(6) }} />
                                <AppText variant="bodySemiBold" color={Colors.textOnLight} style={{ flex: 1 }}>
                                    {policyNotice.title}
                                </AppText>
                            </View>
                            <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.policyBannerText}>
                                {policyNotice.body}
                            </AppText>
                            <View style={styles.policyBannerSecure}>
                                <Ionicons name="lock-closed-outline" size={rf(11)} color={Colors.textOnLightTertiary} />
                                <AppText variant="caption" color={Colors.textOnLightTertiary} style={{ marginLeft: r(4) }}>
                                    Secured by Stripe · Card details never stored on our servers
                                </AppText>
                            </View>
                        </View>
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
                    ) : policyNotice ? (
                        <View style={styles.confirmBtnInner}>
                            <Ionicons name="card-outline" size={rf(16)} color={Colors.white} style={{ marginRight: r(6) }} />
                            <AppText variant="button" color={Colors.white}>{'Confirm & Pay'}</AppText>
                        </View>
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
        backgroundColor: Colors.appBackground },

    // ── Header ─────────────────────────────────────────────────────────────────
    header: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing['5'],
        paddingVertical: Spacing['3'],
        gap: Spacing['3'] },
    backBtn: {
        width: r(34),
        height: r(34),
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center' },
    backArrow: {
        fontSize: FontSize.xl,
        color: Colors.white },
    headerTitle: {
        fontSize: FontSize.lg },

    // ── Scroll ─────────────────────────────────────────────────────────────────
    scroll: { flex: 1 },
    scrollContent: {
        paddingBottom: Spacing['6'] },

    // ── Restaurant block ───────────────────────────────────────────────────────
    restaurantBlock: {
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['5'],
        paddingBottom: Spacing['4'],
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder },
    restaurantName: {
        fontSize: FontSize['2xl'],
        marginBottom: Spacing['1'] },

    // ── Section ────────────────────────────────────────────────────────────────
    section: {
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['5'],
        paddingBottom: Spacing['2'],
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['4'] },
    sectionTick: {
        width: r(3),
        height: r(18),
        backgroundColor: Colors.primary,
        borderRadius: r(2) },
    viewAllBtn: {
        marginLeft: 'auto' },

    // ── Section picker ─────────────────────────────────────────────────────────
    sectionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing['3'],
        paddingBottom: Spacing['2'] },
    sectionCard: {
        flex: 1,
        minWidth: r(100),
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['4'],
        paddingHorizontal: Spacing['3'],
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        backgroundColor: Colors.cardBackground },
    sectionCardSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary },
    selectedSectionRow: {
        paddingBottom: Spacing['2'] },
    selectedSectionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: Spacing['2'],
        paddingHorizontal: Spacing['3'],
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.accent,
        backgroundColor: Colors.cardBackground },

    // ── Time slots ─────────────────────────────────────────────────────────────
    slotScroll: {
        gap: Spacing['2'],
        paddingBottom: Spacing['3'] },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing['3'] },

    // ── Form inputs ────────────────────────────────────────────────────────────
    inputGroup: {
        marginBottom: Spacing['4'] },
    inputLabel: {
        marginBottom: r(6),
        letterSpacing: 0.8 },
    input: {
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['3'],
        fontSize: FontSize.base,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight,
        backgroundColor: Colors.cardBackground },
    textArea: {
        height: r(90),
        paddingTop: Spacing['3'] },

    // ── Tags ───────────────────────────────────────────────────────────────────
    tagSubtitle: {
        marginTop: -Spacing['2'],
        marginBottom: Spacing['3'] },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing['2'],
        marginBottom: Spacing['3'] },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: r(5),
        paddingVertical: Spacing['2'],
        paddingHorizontal: Spacing['3'],
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        backgroundColor: Colors.cardBackground },
    tagPillSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary },
    tagIcon: { fontSize: FontSize.base },
    tagNotes: { marginTop: Spacing['2'] },

    // ── Payment policy banner ──────────────────────────────────────────────────
    policyBanner: {
        flexDirection: 'row',
        marginHorizontal: Spacing['5'],
        marginTop: Spacing['5'],
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        backgroundColor: Colors.cardBackground,
        overflow: 'hidden',
    },
    policyBannerAccent: {
        width: r(4),
        borderTopLeftRadius: Radius.lg,
        borderBottomLeftRadius: Radius.lg,
    },
    policyBannerBody: {
        flex: 1,
        padding: Spacing['3'],
    },
    policyBannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing['1'],
    },
    policyBannerText: {
        lineHeight: r(18),
        marginBottom: Spacing['2'],
    },
    policyBannerSecure: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // ── Confirm button ─────────────────────────────────────────────────────────
    confirmBtn: {
        marginHorizontal: Spacing['5'],
        marginTop: Spacing['4'],
        backgroundColor: Colors.accent,
        paddingVertical: Spacing['4'],
        borderRadius: Radius.lg,
        alignItems: 'center',
        shadowColor: Colors.accent,
        shadowOffset: { width: r(0), height: r(4) },
        shadowOpacity: 0.3,
        shadowRadius: r(8),
        elevation: r(5) },
    confirmBtnDisabled: {
        backgroundColor: Colors.cardBorder,
        shadowOpacity: 0,
        elevation: 0 },
    confirmBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // ── Auth prompt modal ──────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(9,31,43,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing['5'] },
    authCard: {
        backgroundColor: Colors.appBackground,
        borderRadius: Radius['2xl'],
        padding: Spacing['6'],
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: r(0), height: r(8) },
        shadowOpacity: 0.2,
        shadowRadius: r(20),
        elevation: r(10) },
    authIconCircle: {
        width: r(72),
        height: r(72),
        borderRadius: Radius.full,
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['4'] },
    authEmoji: { fontSize: rf(34) },
    authTitle: {
        marginBottom: Spacing['2'],
        textAlign: 'center' },
    authMessage: {
        textAlign: 'center',
        lineHeight: r(22),
        marginBottom: Spacing['5'] },
    btnPrimary: {
        width: '100%',
        backgroundColor: Colors.accent,
        paddingVertical: r(14),
        borderRadius: Radius.lg,
        alignItems: 'center',
        marginBottom: Spacing['2'] },
    btnSecondary: {
        width: '100%',
        backgroundColor: Colors.appBackground,
        paddingVertical: r(14),
        borderRadius: Radius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary,
        marginBottom: Spacing['2'] },
    btnGhost: {
        paddingVertical: Spacing['2'],
        alignItems: 'center' } });

export default BookingScreen;




