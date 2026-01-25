// src/screens/booking/BookingsScreen.tsx
import React, {useState} from 'react';
import {Alert, SafeAreaView, FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator} from 'react-native';
import {Reservation} from '../../types';
import {BookingsScreenProps} from '../../navigation/AppNavigator';
import {useReservations} from '../../hooks/useReservations';
import {mapReservationDtosToReservations} from '../../utils/reservationMapper';

const BookingsScreen: React.FC<BookingsScreenProps> = ({navigation}) => {
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const {
        reservations: reservationDtos,
        isLoading,
        error,
        refetch,
        cancelReservation: cancelReservationApi,
        totalElements,
        hasMore,
        loadMore
    } = useReservations({
        usePagination: true,
        filter: filter,
        pageSize: 20
    });

    // Map backend DTOs to UI Reservation type
    const reservations = mapReservationDtosToReservations(reservationDtos);

    const handleReviewPress = (reservation: Reservation) => {
        // Navigate to ReviewScreen within BookingsStack
        navigation.navigate('ReviewScreen', { reservation });
    };

    const handleCancelReservation = async (reservationId: number) => {
        Alert.alert(
            'Cancel Reservation',
            'Are you sure you want to cancel this reservation?',
            [
                {text: 'No', style: 'cancel'},
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelReservationApi(reservationId);
                            Alert.alert('Cancelled', 'Your reservation has been cancelled.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel reservation. Please try again.');
                            console.error('Error canceling reservation:', error);
                        }
                    }
                }
            ]
        );
    };

    const renderBookingCard = (reservation: Reservation) => (
        <View key={reservation.id} style={styles.bookingCard}>
            {/* Status Badge - Top Right Corner */}
            <View style={[
                styles.statusBadge,
                reservation.status === 'confirmed' && styles.statusConfirmed,
                reservation.status === 'pending' && styles.statusPending,
                reservation.status === 'completed' && styles.statusCompleted,
                reservation.status === 'cancelled' && styles.statusCancelled,
            ]}>
                <Text style={[
                    styles.statusText,
                    reservation.status === 'confirmed' && styles.statusTextConfirmed,
                    reservation.status === 'pending' && styles.statusTextPending,
                    reservation.status === 'completed' && styles.statusTextCompleted,
                    reservation.status === 'cancelled' && styles.statusTextCancelled,
                ]}>
                    {reservation.status.toUpperCase()}
                </Text>
            </View>

            {/* Restaurant Name - Full Width */}
            <Text style={styles.restaurantName} numberOfLines={2} ellipsizeMode="tail">
                {reservation.restaurant.name}
            </Text>

            {/* Date & Time Row */}
            <View style={styles.infoRow}>
                <View style={styles.leftInfoItem}>
                    <Text style={styles.icon}>📅</Text>
                    <Text style={styles.infoText}>{reservation.date}</Text>
                </View>
                <View style={styles.rightInfoItem}>
                    <Text style={styles.icon}>🕐</Text>
                    <Text style={styles.infoText}>{reservation.time}</Text>
                </View>
            </View>

            {/* Party Size & Confirmation Row */}
            <View style={styles.infoRow}>
                <View style={styles.leftInfoItem}>
                    <Text style={styles.icon}>👥</Text>
                    <Text style={styles.infoText}>{reservation.partySize} {reservation.partySize === 1 ? 'guest' : 'guests'}</Text>
                </View>
                <View style={styles.rightInfoItem}>
                    <Text style={styles.confirmationLabel}>Code:</Text>
                    <Text style={styles.confirmationCode}>{reservation.confirmationCode}</Text>
                </View>
            </View>

            {/* Special Requests */}
            {reservation.specialRequests && (
                <View style={styles.specialRequestsContainer}>
                    <Text style={styles.specialRequestsLabel}>💭</Text>
                    <Text style={styles.specialRequestsText} numberOfLines={2}>
                        {reservation.specialRequests}
                    </Text>
                </View>
            )}

            {/* Action Buttons */}
            {(reservation.status === 'confirmed' || (reservation.canReview && reservation.status === 'completed')) && (
                <View style={styles.actionButtons}>
                    {reservation.status === 'confirmed' && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancelReservation(reservation.id)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    )}

                    {reservation.canReview && reservation.status === 'completed' && (
                        <TouchableOpacity
                            style={styles.reviewButton}
                            onPress={() => handleReviewPress(reservation)}
                        >
                            <Text style={styles.reviewButtonText}>✍️ Review</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Bookings</Text>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                {[
                    {key: 'all', label: 'All'},
                    {key: 'upcoming', label: 'Upcoming'},
                    {key: 'past', label: 'Past'}
                ].map((filterOption) => (
                    <TouchableOpacity
                        key={filterOption.key}
                        style={[
                            styles.filterButton,
                            filter === filterOption.key && styles.filterButtonActive
                        ]}
                        onPress={() => setFilter(filterOption.key as 'all' | 'upcoming' | 'past')}
                    >
                        <Text style={[
                            styles.filterText,
                            filter === filterOption.key && styles.filterTextActive
                        ]}>
                            {filterOption.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Loading State */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading your bookings...</Text>
                </View>
            ) : error ? (
                /* Error State */
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load bookings</Text>
                    <Text style={styles.errorSubtext}>{error.message}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                /* Data State */
                <FlatList
                    data={reservations}
                    renderItem={({ item }) => renderBookingCard(item)}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.bookingsList}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => {
                        if (hasMore && !isLoading) {
                            loadMore?.();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No bookings found</Text>
                            <Text style={styles.emptyStateSubtext}>
                                {filter === 'upcoming'
                                    ? "You don't have any upcoming reservations."
                                    : filter === 'past'
                                        ? "You don't have any past reservations."
                                        : "You haven't made any reservations yet."
                                }
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        hasMore && !isLoading ? (
                            <View style={styles.loadMoreContainer}>
                                <ActivityIndicator size="small" color="#007AFF" />
                                <Text style={styles.loadMoreText}>Loading more...</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E8ECF0',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1A1D1F',
        letterSpacing: -0.5,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        marginBottom: 16,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#F0F3F6',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    filterText: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '600',
    },
    filterTextActive: {
        color: 'white',
    },
    bookingsList: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    bookingCard: {
        backgroundColor: 'white',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F3F6',
        position: 'relative',
    },
    restaurantName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1D1F',
        marginBottom: 10,
        marginTop: 4,
        lineHeight: 22,
        letterSpacing: -0.2,
        paddingRight: 100,
        flexShrink: 1,
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        zIndex: 10,
    },
    statusConfirmed: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    statusPending: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    statusCompleted: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    statusCancelled: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statusTextConfirmed: {
        color: '#059669',
    },
    statusTextPending: {
        color: '#D97706',
    },
    statusTextCompleted: {
        color: '#2563EB',
    },
    statusTextCancelled: {
        color: '#DC2626',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
    },
    leftInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    rightInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    icon: {
        fontSize: 16,
        width: 20,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    confirmationLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    confirmationCode: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0284C7',
        fontFamily: 'monospace',
    },
    specialRequestsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#FFFBEB',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        marginTop: 2,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    specialRequestsLabel: {
        fontSize: 14,
    },
    specialRequestsText: {
        flex: 1,
        fontSize: 13,
        color: '#78350F',
        lineHeight: 18,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F3F6',
    },
    cancelButton: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    cancelButtonText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '700',
    },
    reviewButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    reviewButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1D1F',
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    emptyStateSubtext: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 80,
    },
    errorText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#DC2626',
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    errorSubtext: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 4,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    loadMoreContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
        paddingBottom: 32,
    },
    loadMoreText: {
        marginLeft: 12,
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
    },
});

export default BookingsScreen;