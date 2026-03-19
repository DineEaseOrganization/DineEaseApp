// src/screens/booking/BookingsScreen.tsx
import React, { useCallback, useState } from 'react';
import { formatDateDayMonthYear } from '../../utils/Datetimeutils';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Reservation } from '../../types';
import { PaymentPolicyResponse } from '../../types/api.types';
import { BookingsScreenProps } from '../../navigation/AppNavigator';
import { useReservations } from '../../hooks/useReservations';
import { mapReservationDtosToReservations } from '../../utils/reservationMapper';
import { processingService } from '../../services/api/processingService';
import { paymentService } from '../../services/api/paymentService';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';

const NAVY = Colors.primary;

const formatReservationDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return formatDateDayMonthYear(date);
};

const isReservationPast = (date: string, time: string): boolean => {
    const [hours, minutes] = time.split(':').map(Number);
    const dt = new Date(date);
    dt.setHours(hours, minutes, 0, 0);
    return dt < new Date();
};

const FILTERS = [
    { key: 'all',      label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past',     label: 'Past' },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

const BookingsScreen: React.FC<BookingsScreenProps> = ({ navigation }) => {
    const [filter, setFilter] = useState<FilterKey>('all');
    const [reviewedReservationIds, setReviewedReservationIds] = useState<Set<number>>(new Set());

    const { reservations: reservationDtos, isLoading, error, refetch, cancelReservation: cancelReservationApi, hasMore, loadMore } =
        useReservations({ usePagination: true, filter, pageSize: 20 });

    useFocusEffect(
        useCallback(() => {
            processingService.getCustomerReviews()
                .then(reviews => setReviewedReservationIds(new Set(reviews.map(r => r.reservationId))))
                .catch(() => { });
        }, [])
    );

    const sortReservations = (items: Reservation[], key: FilterKey) => {
        const dir = key === 'upcoming' ? 1 : -1;
        return [...items].sort((a, b) => {
            const aDt = new Date(`${a.date}T${a.time}`);
            const bDt = new Date(`${b.date}T${b.time}`);
            return (aDt.getTime() - bDt.getTime()) * dir;
        });
    };

    const reservations = sortReservations(
        mapReservationDtosToReservations(reservationDtos, undefined, reviewedReservationIds),
        filter
    );

    const handleReviewPress = (reservation: Reservation) => navigation.navigate('ReviewScreen', { reservation });

    const buildCancelDialog = (
        reservation: Reservation,
        policy: PaymentPolicyResponse | null
    ): { title: string; message: string; confirmText: string } => {
        const txType = reservation.paymentTransactionType;
        const hasPayment = reservation.paymentAmount != null && reservation.paymentCurrency != null;

        if (!hasPayment || !txType) {
            return {
                title: 'Cancel Reservation',
                message: 'Are you sure you want to cancel this reservation? This cannot be undone.',
                confirmText: 'Yes, Cancel',
            };
        }

        const fmt = (v: number) => v.toLocaleString('en-GB', {
            style: 'currency',
            currency: reservation.paymentCurrency!,
        });
        const paidAmt = reservation.paymentAmount!;
        const amtStr = fmt(paidAmt);

        const [hrs, mins] = reservation.time.split(':').map(Number);
        const reservationDt = new Date(reservation.date);
        reservationDt.setHours(hrs, mins, 0, 0);
        const hoursUntil = (reservationDt.getTime() - Date.now()) / (1000 * 60 * 60);

        if (txType === 'DEPOSIT') {
            const depositTiers = policy?.depositRefundTiers;
            if (depositTiers && depositTiers.length > 0) {
                const sorted = [...depositTiers].sort((a, b) => a.hoursBefore - b.hoursBefore);
                const matchedTier = sorted.find(t => hoursUntil < t.hoursBefore);
                if (!matchedTier) {
                    return { title: 'Cancel Reservation', confirmText: 'Yes, Cancel & Get Refund', message: `You're more than ${sorted[sorted.length - 1].hoursBefore}h before your reservation, so your full deposit of ${amtStr} will be refunded.\n\nWould you like to proceed?` };
                } else if (matchedTier.refundPercent <= 0) {
                    return { title: 'Deposit Non-Refundable', confirmText: 'Cancel (No Refund)', message: `You're cancelling within ${matchedTier.hoursBefore}h of your reservation.\n\nYour deposit of ${amtStr} will not be refunded.` };
                } else if (matchedTier.refundPercent >= 100) {
                    return { title: 'Cancel Reservation', confirmText: 'Yes, Cancel & Get Refund', message: `Your full deposit of ${amtStr} will be refunded.\n\nWould you like to proceed?` };
                } else {
                    const refundAmt = fmt((paidAmt * matchedTier.refundPercent) / 100);
                    return { title: 'Partial Deposit Refund', confirmText: `Cancel & Receive ${refundAmt}`, message: `Cancelling now (${Math.floor(hoursUntil)}h before) entitles you to a ${matchedTier.refundPercent}% refund.\n\nYou'll receive ${refundAmt} back (of ${amtStr} paid).` };
                }
            }
            const wh = policy?.depositWindowHours;
            if (wh != null) {
                if (hoursUntil >= wh) {
                    return { title: 'Cancel Reservation', confirmText: 'Yes, Cancel & Get Refund', message: `You're cancelling more than ${wh}h before your reservation, so your deposit of ${amtStr} will be refunded in full.\n\nWould you like to proceed?` };
                }
                const rp = policy?.depositRefundPercent ?? 0;
                if (rp > 0) {
                    const refundAmt = fmt((paidAmt * rp) / 100);
                    return { title: 'Partial Deposit Refund', confirmText: `Cancel & Receive ${refundAmt}`, message: `You're cancelling within ${wh}h of your reservation.\n\nYou'll receive a ${rp}% partial refund of ${refundAmt} (deposit paid: ${amtStr}).` };
                }
                return { title: 'Deposit Non-Refundable', confirmText: 'Cancel (No Refund)', message: `You're cancelling within ${wh}h of your reservation.\n\nYour deposit of ${amtStr} will not be refunded.` };
            }
            return { title: 'Deposit May Not Be Refunded', confirmText: 'Cancel Reservation', message: `This reservation has a deposit of ${amtStr}. Please contact the restaurant directly for their refund policy.\n\nAre you sure you want to cancel?` };
        }

        if (txType === 'BOOKING_FEE') {
            const wh = policy?.bookingFeeWindowHours;
            if (wh != null) {
                if (hoursUntil >= wh) {
                    return { title: 'Cancel Reservation', confirmText: 'Yes, Cancel & Get Refund', message: `You're cancelling more than ${wh}h before your reservation, so your booking fee of ${amtStr} will be refunded in full.\n\nWould you like to proceed?` };
                }
                const rp = policy?.bookingFeeRefundPercent ?? 0;
                if (rp > 0) {
                    const refundAmt = fmt((paidAmt * rp) / 100);
                    return { title: 'Partial Booking Fee Refund', confirmText: `Cancel & Receive ${refundAmt}`, message: `You're cancelling within ${wh}h of your reservation.\n\nYou'll receive a ${rp}% partial refund of ${refundAmt} (booking fee paid: ${amtStr}).` };
                }
                return { title: 'Booking Fee Non-Refundable', confirmText: 'Cancel (No Refund)', message: `Booking fees are non-refundable at this restaurant.\n\nYour booking fee of ${amtStr} will not be returned on cancellation.` };
            }
            return { title: 'Booking Fee May Not Be Refunded', confirmText: 'Cancel Reservation', message: `This reservation has a booking fee of ${amtStr}. Please contact the restaurant for their refund policy.\n\nAre you sure you want to cancel?` };
        }

        if (txType === 'CANCELLATION_FEE') {
            const tiers = policy?.cancellationFeeTiers;
            if (tiers && tiers.length > 0) {
                const sorted = [...tiers].sort((a, b) => a.hoursBefore - b.hoursBefore);
                const matchedTier = sorted.find(t => hoursUntil < t.hoursBefore);
                if (!matchedTier) {
                    return { title: 'Cancel Reservation', confirmText: 'Yes, Cancel', message: `You're more than ${sorted[sorted.length - 1].hoursBefore}h before your reservation, so no fee will be charged.\n\nWould you like to proceed?` };
                }
                const chargeAmt = fmt((paidAmt * matchedTier.chargePercent) / 100);
                return { title: 'Cancellation Fee Applies', confirmText: 'Cancel & Pay Fee', message: `Cancelling now (${Math.floor(hoursUntil)}h before) will incur a ${matchedTier.chargePercent}% fee.\n\nYour card will be charged ${chargeAmt} (of ${amtStr} hold).` };
            }
            const wh = policy?.cancelWindowHours;
            if (wh != null) {
                if (hoursUntil <= wh) {
                    return { title: 'Cancellation Fee Applies', confirmText: 'Cancel & Pay Fee', message: `You're cancelling within ${wh} hours of your reservation.\n\nYour card will be charged ${amtStr} as per the restaurant's cancellation policy.` };
                }
                return { title: 'Cancel Reservation', confirmText: 'Yes, Cancel', message: `You're outside the ${wh}-hour cancellation window, so no fee will be charged.\n\nWould you like to proceed?` };
            }
            return { title: 'Cancellation Fee May Apply', confirmText: 'Cancel Reservation', message: `This reservation has a ${amtStr} cancellation fee. Depending on how close your reservation is, this fee may be charged to your card.\n\nAre you sure you want to cancel?` };
        }

        return {
            title: 'Cancel Reservation',
            message: 'Are you sure you want to cancel this reservation? This cannot be undone.',
            confirmText: 'Yes, Cancel',
        };
    };

    const handleCancelReservation = async (reservation: Reservation) => {
        const hasPayment = reservation.paymentAmount != null
            && reservation.paymentCurrency != null
            && reservation.paymentTransactionType != null;

        let policy: PaymentPolicyResponse | null = null;

        // Fetch the historical policy lazily — only needed when there's a payment type.
        // This avoids the N policy-fetches-on-load that the old enrichment approach caused.
        if (hasPayment && reservation.paymentPolicyId != null) {
            try {
                policy = await paymentService.getReservationPolicy(reservation.paymentPolicyId);
            } catch (e) {
                // Policy fetch failed — dialog will fall back to a generic "contact restaurant" message.
            }
        }

        const { title, message, confirmText } = buildCancelDialog(reservation, policy);

        Alert.alert(title, message, [
            { text: 'Keep Reservation', style: 'cancel' },
            {
                text: confirmText,
                style: 'destructive',
                onPress: async () => {
                    try {
                        await cancelReservationApi(reservation.id);
                        Alert.alert('Reservation Cancelled', 'Your reservation has been cancelled successfully.');
                    } catch {
                        Alert.alert('Something went wrong', 'We couldn\'t cancel your reservation. Please try again or contact the restaurant.');
                    }
                },
            },
        ]);
    };

    const handleTagPress = (tagName: string, note?: string | null) =>
        Alert.alert(tagName, note?.trim() || 'No note provided.');

    // ── Status config ─────────────────────────────────────────────────────────
    const statusConfig: Record<string, { badge: object; textColor: string; label: string }> = {
        confirmed:               { badge: styles.statusConfirmed,  textColor: Colors.success,  label: 'CONFIRMED'                 },
        checked_in:              { badge: styles.statusConfirmed,  textColor: Colors.success,  label: 'CHECKED IN'                },
        pending:                 { badge: styles.statusPending,    textColor: Colors.warning,  label: 'PENDING'                   },
        on_hold:                 { badge: styles.statusOnHold,     textColor: Colors.orange,   label: 'AWAITING PAYMENT'          },
        cancellation_hold:       { badge: styles.statusOnHold,     textColor: Colors.orange,   label: 'HOLD PLACED'               },
        completed:               { badge: styles.statusCompleted,  textColor: NAVY,            label: 'COMPLETED'                 },
        cancelled:               { badge: styles.statusCancelled,  textColor: Colors.error,    label: 'CANCELLED'                 },
        cancelled_by_restaurant: { badge: styles.statusCancelled,  textColor: Colors.error,    label: 'CANCELLED BY RESTAURANT'  },
        no_show:                 { badge: styles.statusNoShow,     textColor: Colors.warning,  label: 'NO SHOW'                   } };

    // ── Status accent colour (left strip + header tint) ───────────────────────
    const statusAccent: Record<string, string> = {
        confirmed:               Colors.success,
        checked_in:              Colors.success,
        pending:                 Colors.warning,
        on_hold:                 Colors.orange,
        cancellation_hold:       Colors.orange,
        completed:               NAVY,
        cancelled:               Colors.error,
        cancelled_by_restaurant: Colors.error,
        no_show:                 Colors.warning };

    // ── Booking card ──────────────────────────────────────────────────────────
    const renderBookingCard = (reservation: Reservation) => {
        const isPast    = isReservationPast(reservation.date, reservation.time);
        const isNoShow  = reservation.status === 'no_show';
        const isCancellationHold = reservation.status === 'on_hold'
            && reservation.paymentTransactionType === 'CANCELLATION_FEE';
        const canCancel = (reservation.status === 'confirmed' || reservation.status === 'pending' || reservation.status === 'on_hold') && !isPast;
        const canReview = reservation.canReview && reservation.status === 'completed';
        const key       = isNoShow ? 'no_show' : isCancellationHold ? 'cancellation_hold' : reservation.status;
        const { badge, textColor, label } = statusConfig[key] ?? statusConfig.pending;
        const accent    = statusAccent[key] ?? NAVY;

        return (
            <View key={reservation.id} style={[styles.card, { borderLeftColor: accent, borderLeftWidth: r(3) }]}>

                {/* ── Header row: name + status badge ── */}
                <View style={styles.cardHeader}>
                    <AppText variant="cardTitle" color={Colors.textOnLight} numberOfLines={1} style={styles.restaurantName}>
                        {reservation.restaurant.name}
                    </AppText>
                    <View style={[styles.statusBadge, badge]}>
                        <AppText variant="captionMedium" color={textColor} style={styles.statusText}>{label}</AppText>
                    </View>
                </View>

                {/* ── Inline detail pills ── */}
                <View style={styles.pillRow}>
                    <View style={styles.pill}>
                        <AppText style={styles.pillIcon}>📅</AppText>
                        <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                            {formatReservationDate(reservation.date)}
                        </AppText>
                    </View>
                    <View style={styles.pillDot} />
                    <View style={styles.pill}>
                        <AppText style={styles.pillIcon}>🕐</AppText>
                        <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                            {reservation.time}
                        </AppText>
                    </View>
                    <View style={styles.pillDot} />
                    <View style={styles.pill}>
                        <AppText style={styles.pillIcon}>👥</AppText>
                        <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                            {reservation.partySize}
                        </AppText>
                    </View>
                </View>

                {reservation.status === 'cancelled_by_restaurant' && (
                    <View style={styles.noticeRow}>
                        <AppText variant="caption" color={Colors.textOnLightSecondary}>
                            Cancelled by restaurant. Contact restaurant for more details.
                        </AppText>
                    </View>
                )}

                {/* ── Payment summary pill ── */}
                {reservation.paymentAmount != null && reservation.paymentCurrency && (
                    <View style={styles.paymentRow}>
                        <AppText style={styles.pillIcon}>💳</AppText>
                        <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                            {(() => {
                                const amt = reservation.paymentAmount!.toLocaleString('en-GB', {
                                    style: 'currency',
                                    currency: reservation.paymentCurrency!,
                                });
                                const cancelledByRestaurant = reservation.status === 'cancelled_by_restaurant';
                                switch (reservation.paymentTransactionType) {
                                    case 'CANCELLATION_FEE':
                                        return cancelledByRestaurant ? `Hold released: ${amt}` : `Cancellation hold: ${amt}`;
                                    case 'DEPOSIT':
                                        return cancelledByRestaurant ? `Deposit refunded: ${amt}` : `Deposit paid: ${amt}`;
                                    case 'BOOKING_FEE':
                                        return cancelledByRestaurant ? `Booking fee refunded: ${amt}` : `Booking fee paid: ${amt}`;
                                    default:
                                        return cancelledByRestaurant ? `Refunded: ${amt}` : `Payment: ${amt}`;
                                }
                            })()}
                        </AppText>
                    </View>
                )}

                {/* ── Confirmation code ── */}
                <View style={styles.codeRow}>
                    <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.codeLabel}>REF</AppText>
                    <AppText variant="captionMedium" color={NAVY} style={styles.code}>
                        {reservation.confirmationCode}
                    </AppText>
                </View>

                {/* ── Tags ── */}
                {reservation.tags && reservation.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                        {reservation.tags.map((tag) => (
                            <TouchableOpacity
                                key={tag.tagId}
                                style={styles.tagPill}
                                onPress={() => handleTagPress(tag.tagName, tag.note)}
                                activeOpacity={0.8}
                            >
                                {tag.icon ? <AppText style={styles.tagIcon}>{tag.icon}</AppText> : null}
                                <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>{tag.tagName}</AppText>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* ── Special requests ── */}
                {reservation.specialRequests && (
                    <View style={styles.requestRow}>
                        <AppText style={styles.requestIcon}>💭</AppText>
                        <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ flex: 1 }} numberOfLines={2}>
                            {reservation.specialRequests}
                        </AppText>
                    </View>
                )}

                {/* ── Actions ── */}
                {(canCancel || canReview) && (
                    <View style={styles.actions}>
                        {canCancel && (
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelReservation(reservation)}>
                                <AppText variant="captionMedium" color={Colors.error}>✕  Cancel</AppText>
                            </TouchableOpacity>
                        )}
                        {canReview && (
                            <TouchableOpacity style={styles.reviewBtn} onPress={() => handleReviewPress(reservation)}>
                                <AppText variant="captionMedium" color={Colors.white}>⭐  Leave a Review</AppText>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Navy header ── */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <AppText variant="h3" color={Colors.white} style={styles.headerTitle}>My Bookings</AppText>
                </View>
                {/* Filter chips */}
                <View style={styles.filterRow}>
                    {FILTERS.map(({ key, label }) => {
                        const active = filter === key;
                        return (
                            <TouchableOpacity
                                key={key}
                                style={[styles.filterChip, active && styles.filterChipActive]}
                                onPress={() => setFilter(key)}
                                activeOpacity={0.8}
                            >
                                <AppText
                                    variant="captionMedium"
                                    color={active ? Colors.primary : 'rgba(255,255,255,0.75)'}
                                >
                                    {label}
                                </AppText>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* ── Content ── */}
            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={NAVY} />
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginTop: Spacing['3'] }}>
                        Loading your bookings...
                    </AppText>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AppText style={{ fontSize: rf(40), marginBottom: Spacing['3'] }}>⚠️</AppText>
                    <AppText variant="sectionTitle" color={NAVY} style={{ marginBottom: Spacing['2'] }}>
                        Couldn't load bookings
                    </AppText>
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ textAlign: 'center', marginBottom: Spacing['5'] }}>
                        {error.message}
                    </AppText>
                    <AppButton label="Retry" onPress={refetch} />
                </View>
            ) : (
                <FlatList
                    data={reservations}
                    renderItem={({ item }) => renderBookingCard(item)}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => { if (hasMore && !isLoading) loadMore?.(); }}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <AppText style={styles.emptyIcon}>📅</AppText>
                            <AppText variant="sectionTitle" color={NAVY} style={{ marginBottom: Spacing['2'] }}>
                                No bookings found
                            </AppText>
                            <AppText variant="body" color={Colors.textOnLightSecondary} style={{ textAlign: 'center' }}>
                                {filter === 'upcoming' ? "You don't have any upcoming reservations."
                                    : filter === 'past' ? "You don't have any past reservations."
                                        : "You haven't made any reservations yet."}
                            </AppText>
                        </View>
                    }
                    ListFooterComponent={hasMore && !isLoading ? (
                        <View style={styles.loadMore}>
                            <ActivityIndicator size="small" color={NAVY} />
                            <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ marginLeft: Spacing['2'] }}>
                                Loading more...
                            </AppText>
                        </View>
                    ) : null}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.appBackground },

    // ── Header ─────────────────────────────────────────────────────────────────
    header: {
        backgroundColor: NAVY,
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['3'],
        paddingBottom: Spacing['3'] },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing['3'] },
    headerTitle: {
        fontSize: FontSize['2xl'] },
    filterRow: {
        flexDirection: 'row',
        gap: Spacing['2'] },
    filterChip: {
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['1'] + r(2),
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(255,255,255,0.10)' },
    filterChipActive: {
        backgroundColor: Colors.white,
        borderColor: Colors.white },

    // ── List ───────────────────────────────────────────────────────────────────
    list: {
        paddingHorizontal: Spacing['4'],
        paddingTop: Spacing['4'],
        paddingBottom: Spacing['8'] },

    // ── Card ───────────────────────────────────────────────────────────────────
    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['3'],
        marginBottom: Spacing['3'],
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        shadowColor: '#1a2e3b',
        shadowOffset: { width: r(0), height: r(2) },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        overflow: 'hidden' },

    // Card header row
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing['2'],
        marginBottom: Spacing['2'] },
    restaurantName: {
        flex: 1,
        fontSize: FontSize.md },

    // Status badge
    statusBadge: {
        paddingHorizontal: Spacing['2'],
        paddingVertical: r(3),
        borderRadius: Radius.full,
        borderWidth: 1,
        flexShrink: 0 },
    statusText: { letterSpacing: 0.5, fontSize: FontSize.xs },
    statusConfirmed: { backgroundColor: Colors.successFaded,  borderColor: Colors.success },
    statusPending:   { backgroundColor: Colors.warningFaded,  borderColor: Colors.warning },
    statusOnHold:    { backgroundColor: Colors.orangeFaded,    borderColor: Colors.orange },
    statusCompleted: { backgroundColor: 'rgba(15,51,70,0.07)', borderColor: Colors.cardBorder },
    statusCancelled: { backgroundColor: Colors.errorFaded,    borderColor: Colors.error },
    statusNoShow:    { backgroundColor: Colors.warningFaded,  borderColor: Colors.warning },

    // Inline pill row
    pillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['2'],
        flexWrap: 'wrap' },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['1'] },
    pillIcon: { fontSize: FontSize.sm },
    pillDot: {
        width: r(3),
        height: r(3),
        borderRadius: r(2),
        backgroundColor: Colors.cardBorder },

    // Payment summary pill
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['2'],
        backgroundColor: Colors.backgroundSecondary ?? 'rgba(0,0,0,0.04)',
        paddingHorizontal: Spacing['2'],
        paddingVertical: Spacing['1'],
        borderRadius: r(6),
        alignSelf: 'flex-start' as const },

    // Confirmation code
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['2'] },
    codeLabel: {
        letterSpacing: 1,
        fontSize: FontSize.xs },
    code: {
        fontFamily: FontFamily.bold,
        letterSpacing: 1,
        fontSize: FontSize.sm },

    // Tags
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: r(6),
        marginBottom: Spacing['2'] },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing['2'],
        paddingVertical: r(3),
        borderRadius: Radius.full,
        backgroundColor: 'rgba(15,51,70,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(15,51,70,0.10)',
        gap: Spacing['1'] },
    tagIcon: { fontSize: FontSize.xs },

    // Special requests
    requestRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing['2'],
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['2'],
        marginBottom: Spacing['2'] },
    requestIcon: { fontSize: rf(13), marginTop: r(1) },

    // Cancellation notice
    noticeRow: {
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['2'],
        marginBottom: Spacing['2'],
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },

    // Actions
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing['2'],
        paddingTop: Spacing['2'],
        marginTop: Spacing['1'],
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder },
    cancelBtn: {
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['1'] + r(2),
        borderRadius: Radius.md,
        backgroundColor: Colors.errorFaded,
        borderWidth: 1,
        borderColor: Colors.error },
    reviewBtn: {
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['1'] + r(2),
        borderRadius: Radius.md,
        backgroundColor: Colors.accent },

    // States
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['5'] },
    empty: { alignItems: 'center', paddingVertical: Spacing['10'], paddingHorizontal: Spacing['5'] },
    emptyIcon: { fontSize: rf(44), marginBottom: Spacing['4'] },
    loadMore: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing['6'] } });

export default BookingsScreen;
