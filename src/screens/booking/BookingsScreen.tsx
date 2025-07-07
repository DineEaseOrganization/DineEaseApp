// src/screens/booking/BookingsScreen.tsx
import React, {useState} from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {dummyReservations} from '../../data/dummyData';
import {Reservation} from '../../types';
import {BookingsScreenProps} from '../../navigation/AppNavigator';

const BookingsScreen: React.FC<BookingsScreenProps> = ({navigation}) => {
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

    const filterReservations = (reservations: Reservation[]) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        switch (filter) {
            case 'upcoming':
                return reservations.filter(r =>
                    r.date >= today && (r.status === 'confirmed' || r.status === 'pending')
                );
            case 'past':
                return reservations.filter(r =>
                    r.date < today || r.status === 'completed' || r.status === 'cancelled'
                );
            default:
                return reservations;
        }
    };

    const filteredReservations = filterReservations(dummyReservations);

    const handleReviewPress = (reservation: Reservation) => {
        // Navigate to the Discover tab and then to ReviewScreen
        navigation.navigate('Discover', {
            screen: 'ReviewScreen',
            params: {reservation}
        });
    };

    const handleCancelReservation = (reservationId: number) => {
        Alert.alert(
            'Cancel Reservation',
            'Are you sure you want to cancel this reservation?',
            [
                {text: 'No', style: 'cancel'},
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => {
                        // Update the reservation status in the dummy data
                        const reservationIndex = dummyReservations.findIndex(r => r.id === reservationId);
                        if (reservationIndex !== -1) {
                            dummyReservations[reservationIndex].status = 'cancelled';
                        }
                        Alert.alert('Cancelled', 'Your reservation has been cancelled.');
                    }
                }
            ]
        );
    };

    const renderBookingCard = (reservation: Reservation) => (
        <View key={reservation.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
                <Text style={styles.restaurantName}>{reservation.restaurant.name}</Text>
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
            </View>

            <Text style={styles.bookingDate}>{reservation.date} at {reservation.time}</Text>
            <Text style={styles.bookingParty}>{reservation.partySize} guests</Text>
            <Text style={styles.bookingCode}>Confirmation: {reservation.confirmationCode}</Text>

            {reservation.specialRequests && (
                <Text style={styles.specialRequests}>
                    Special requests: {reservation.specialRequests}
                </Text>
            )}

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
                        <Text style={styles.reviewButtonText}>Write Review</Text>
                    </TouchableOpacity>
                )}
            </View>
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

            <ScrollView style={styles.bookingsList} showsVerticalScrollIndicator={false}>
                {filteredReservations.length > 0 ? (
                    filteredReservations.map(renderBookingCard)
                ) : (
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
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        marginBottom: 10,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        marginRight: 10,
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    filterTextActive: {
        color: 'white',
    },
    bookingsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    bookingCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusConfirmed: {
        backgroundColor: '#e8f5e8',
    },
    statusPending: {
        backgroundColor: '#fff3cd',
    },
    statusCompleted: {
        backgroundColor: '#d4edda',
    },
    statusCancelled: {
        backgroundColor: '#f8d7da',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusTextConfirmed: {
        color: '#27ae60',
    },
    statusTextPending: {
        color: '#f39c12',
    },
    statusTextCompleted: {
        color: '#155724',
    },
    statusTextCancelled: {
        color: '#721c24',
    },
    bookingDate: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
        fontWeight: '500',
    },
    bookingParty: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    bookingCode: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    specialRequests: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancelButton: {
        backgroundColor: '#e74c3c',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    reviewButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    reviewButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default BookingsScreen;