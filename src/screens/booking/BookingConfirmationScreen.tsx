// src/screens/booking/BookingConfirmationScreen.tsx
import React from 'react';
import {SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import {BookingConfirmationScreenProps} from '../../navigation/AppNavigator';

const BookingConfirmationScreen: React.FC<BookingConfirmationScreenProps> = ({
                                                                                 route,
                                                                                 navigation
                                                                             }) => {
    const {booking} = route.params;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleShare = async () => {
        try {
            const message = `Reservation Confirmed!\n\n` +
                `Restaurant: ${booking.restaurant.name}\n` +
                `Date: ${formatDate(booking.date)}\n` +
                `Time: ${booking.time}\n` +
                `Party Size: ${booking.partySize} guests\n` +
                `Confirmation Code: ${booking.confirmationCode}`;

            await Share.share({
                message,
                title: 'Restaurant Reservation Confirmation',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleDone = () => {
        // Reset stack to restaurant list, removing BookingScreen and RestaurantDetail from memory
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'RestaurantList' }],
            })
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                {/* Success Icon */}
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Text style={styles.checkMark}>✓</Text>
                    </View>
                    <Text style={styles.successTitle}>Reservation Confirmed!</Text>
                    <Text style={styles.successSubtitle}>
                        You're all set! We've sent confirmation details to your phone.
                    </Text>
                </View>

                {/* Confirmation Details */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.sectionTitle}>Reservation Details</Text>

                    <View style={styles.detailCard}>
                        <View style={styles.restaurantHeader}>
                            <Text style={styles.restaurantName}>{booking.restaurant.name}</Text>
                            <Text style={styles.confirmationCode}>#{booking.confirmationCode}</Text>
                        </View>

                        <View style={styles.divider}/>

                        <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Date</Text>
                                <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Time</Text>
                                <Text style={styles.detailValue}>{booking.time}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Party Size</Text>
                                <Text style={styles.detailValue}>{booking.partySize} guests</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Name</Text>
                                <Text style={styles.detailValue}>{booking.customerName}</Text>
                            </View>
                        </View>

                        <View style={styles.divider}/>

                        <View style={styles.addressContainer}>
                            <Text style={styles.detailLabel}>Address</Text>
                            <Text style={styles.addressText}>{booking.restaurant.address}</Text>
                        </View>

                        {booking.specialRequests && (
                            <>
                                <View style={styles.divider}/>
                                <View style={styles.specialRequestsContainer}>
                                    <Text style={styles.detailLabel}>Special Requests</Text>
                                    <Text style={styles.specialRequestsText}>{booking.specialRequests}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Important Information */}
                <View style={styles.infoContainer}>
                    <Text style={styles.sectionTitle}>Important Information</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoIcon}>🕒</Text>
                            <Text style={styles.infoText}>
                                Please arrive 10 minutes before your reservation time
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoIcon}>📱</Text>
                            <Text style={styles.infoText}>
                                Show this confirmation or mention your confirmation code
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoIcon}>❌</Text>
                            <Text style={styles.infoText}>
                                Cancellations must be made at least 2 hours in advance
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Contact Information */}
                <View style={styles.contactContainer}>
                    <Text style={styles.sectionTitle}>Need Help?</Text>
                    <TouchableOpacity style={styles.contactButton}>
                        <Text style={styles.contactButtonText}>
                            Call Restaurant: {booking.restaurant.phoneNumber}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Text style={styles.shareButtonText}>Share Details</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
    },
    successContainer: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: 'white',
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#27ae60',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkMark: {
        fontSize: 40,
        color: 'white',
        fontWeight: 'bold',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    detailsContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    detailCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    restaurantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    restaurantName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    confirmationCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    addressContainer: {
        marginBottom: 16,
    },
    addressText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    specialRequestsContainer: {
        marginBottom: 0,
    },
    specialRequestsText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    infoContainer: {
        padding: 20,
    },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    infoIcon: {
        fontSize: 20,
        marginRight: 12,
        marginTop: 2,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        lineHeight: 20,
    },
    contactContainer: {
        padding: 20,
        paddingBottom: 120, // Space for action buttons
    },
    contactButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    contactButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    actionButtonsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        flexDirection: 'row',
    },
    shareButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginRight: 10,
    },
    shareButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '500',
    },
    doneButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginLeft: 10,
    },
    doneButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default BookingConfirmationScreen;