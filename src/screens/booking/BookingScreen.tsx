// src/screens/booking/BookingScreen.tsx
import React, {useState} from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {dummyTimeSlots} from '../../data/dummyData';
import {BookingScreenProps} from '../../navigation/AppNavigator';

const BookingScreen: React.FC<BookingScreenProps> = ({route, navigation}) => {
    const {restaurant, selectedDate, partySize} = route.params;

    const [selectedTime, setSelectedTime] = useState<string>('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleConfirmBooking = () => {
        if (!selectedTime || !customerName || !customerPhone) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }

        // Mock booking confirmation
        const confirmationCode = 'RES' + Math.random().toString(36).substr(2, 6).toUpperCase();

        navigation.navigate('BookingConfirmation', {
            booking: {
                restaurant,
                date: selectedDate,
                time: selectedTime,
                partySize,
                customerName,
                customerPhone,
                customerEmail,
                specialRequests,
                confirmationCode,
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Make Reservation</Text>
                </View>

                {/* Restaurant Info */}
                <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName}>{restaurant.name}</Text>
                    <Text style={styles.bookingDetails}>
                        {formatDate(selectedDate)} • {partySize} guests
                    </Text>
                </View>

                {/* Time Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Select Time</Text>
                    <View style={styles.timeGrid}>
                        {dummyTimeSlots.map((slot, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.timeSlot,
                                    !slot.available && styles.timeSlotDisabled,
                                    selectedTime === slot.time && styles.timeSlotSelected,
                                ]}
                                onPress={() => slot.available && setSelectedTime(slot.time)}
                                disabled={!slot.available}
                            >
                                <Text style={[
                                    styles.timeSlotText,
                                    !slot.available && styles.timeSlotTextDisabled,
                                    selectedTime === slot.time && styles.timeSlotTextSelected,
                                ]}>
                                    {slot.time}
                                </Text>
                                {slot.available && slot.remainingTables && slot.remainingTables <= 2 && (
                                    <Text style={styles.remainingText}>
                                        {slot.remainingTables} left
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Customer Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Information</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Full Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={customerName}
                            onChangeText={setCustomerName}
                            placeholder="Enter your full name"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Phone Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={customerPhone}
                            onChangeText={setCustomerPhone}
                            placeholder="+357 99 123456"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={customerEmail}
                            onChangeText={setCustomerEmail}
                            placeholder="your.email@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Special Requests (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={specialRequests}
                            onChangeText={setSpecialRequests}
                            placeholder="Birthday celebration, dietary requirements, etc."
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </View>

                {/* Booking Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking Summary</Text>
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Restaurant:</Text>
                            <Text style={styles.summaryValue}>{restaurant.name}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Date:</Text>
                            <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Time:</Text>
                            <Text style={styles.summaryValue}>{selectedTime || 'Not selected'}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Party Size:</Text>
                            <Text style={styles.summaryValue}>{partySize} guests</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Confirm Button */}
            <View style={styles.confirmButtonContainer}>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        (!selectedTime || !customerName || !customerPhone) && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirmBooking}
                    disabled={!selectedTime || !customerName || !customerPhone}
                >
                    <Text style={styles.confirmButtonText}>Confirm Reservation</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
    },
    backButton: {
        fontSize: 16,
        color: '#007AFF',
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    restaurantInfo: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 10,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    bookingDetails: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    timeSlot: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        marginRight: 12,
        marginBottom: 12,
        minWidth: 80,
        alignItems: 'center',
    },
    timeSlotSelected: {
        backgroundColor: '#007AFF',
    },
    timeSlotDisabled: {
        backgroundColor: '#e0e0e0',
        opacity: 0.5,
    },
    timeSlotText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    timeSlotTextSelected: {
        color: 'white',
    },
    timeSlotTextDisabled: {
        color: '#999',
    },
    remainingText: {
        fontSize: 10,
        color: '#e74c3c',
        marginTop: 2,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    summaryContainer: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    confirmButtonContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    confirmButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default BookingScreen;