// src/screens/booking/BookingsScreen.tsx
import React, { useCallback, useState } from 'react';
import { formatDateDayMonthYear } from '../../utils/Datetimeutils';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Reservation } from '../../types';
import { BookingsScreenProps } from '../../navigation/AppNavigator';
import { useReservations } from '../../hooks/useReservations';
import { mapReservationDtosToReservations } from '../../utils/reservationMapper';
import { processingService } from '../../services/api/processingService';
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

    const reservations = mapReservationDtosToReservations(reservationDtos, undefined, reviewedReservationIds);

    const handleReviewPress = (reservation: Reservation) => navigation.navigate('ReviewScreen', { reservation });

    const handleCancelReservation = async (reservationId: number) => {
        Alert.alert('Cancel Reservation', 'Are you sure you want to cancel this reservation?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel', style: 'destructive',
                onPress: async () => {
                    try {
                        await cancelReservationApi(reservationId);
                        Alert.alert('Cancelled', 'Your reservation has been cancelled.');
                    } catch {
                        Alert.alert('Error', 'Failed to cancel reservation. Please try again.');
                    }
                } },
        ]);
    };

    const handleTagPress = (tagName: string, note?: string | null) =>
        Alert.alert(tagName, note?.trim() || 'No note provided.');

    // ── Status config ─────────────────────────────────────────────────────────
    const statusConfig: Record<string, { badge: object; textColor: string; label: string }> = {
        confirmed: { badge: styles.statusConfirmed, textColor: Colors.success,  label: 'CONFIRMED' },
        pending:   { badge: styles.statusPending,   textColor: Colors.warning,  label: 'PENDING'   },
        completed: { badge: styles.statusCompleted, textColor: NAVY,            label: 'COMPLETED' },
        cancelled: { badge: styles.statusCancelled, textColor: Colors.error,    label: 'CANCELLED' },
        no_show:   { badge: styles.statusNoShow,    textColor: Colors.warning,  label: 'NO SHOW'   } };

    // ── Status accent colour (left strip + header tint) ───────────────────────
    const statusAccent: Record<string, string> = {
        confirmed: Colors.success,
        pending:   Colors.warning,
        completed: NAVY,
        cancelled: Colors.error,
        no_show:   Colors.warning };

    // ── Booking card ──────────────────────────────────────────────────────────
    const renderBookingCard = (reservation: Reservation) => {
        const isPast    = isReservationPast(reservation.date, reservation.time);
        const isNoShow  = reservation.status === 'no_show';
        const canCancel = (reservation.status === 'confirmed' || reservation.status === 'pending') && !isPast;
        const canReview = reservation.canReview && reservation.status === 'completed';
        const key       = isNoShow ? 'no_show' : reservation.status;
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
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelReservation(reservation.id)}>
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
