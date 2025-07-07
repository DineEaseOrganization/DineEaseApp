// src/screens/restaurants/RestaurantDetailScreen.tsx
import React, {useState} from 'react';
import {Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {dummyTimeSlots} from '../../data/dummyData';
import {RestaurantDetailScreenProps} from '../../navigation/AppNavigator';

const {width} = Dimensions.get('window');

const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({
                                                                           route,
                                                                           navigation
                                                                       }) => {
    const {restaurant} = route.params;
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [partySize, setPartySize] = useState(2);

    const getNextSevenDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'});
        }
    };

    const handleBooking = () => {
        navigation.navigate('BookingScreen', {
            restaurant,
            selectedDate,
            partySize
        });
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push('★');
        }
        if (hasHalfStar) {
            stars.push('☆');
        }

        return stars.join('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <Image source={{uri: restaurant.coverImageUrl}} style={styles.heroImage}/>

                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                {/* Restaurant Info */}
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.name}>{restaurant.name}</Text>
                        <Text style={styles.priceRange}>{restaurant.priceRange}</Text>
                    </View>

                    <Text style={styles.cuisine}>{restaurant.cuisineType}</Text>

                    <View style={styles.ratingContainer}>
                        <Text style={styles.stars}>{renderStars(restaurant.averageRating)}</Text>
                        <Text style={styles.rating}>
                            {restaurant.averageRating} ({restaurant.totalReviews} reviews)
                        </Text>
                    </View>

                    <Text style={styles.address}>{restaurant.address}</Text>

                    <Text style={styles.description}>{restaurant.description}</Text>

                    {/* Amenities */}
                    <View style={styles.amenitiesContainer}>
                        <Text style={styles.sectionTitle}>Amenities</Text>
                        <View style={styles.amenitiesList}>
                            {restaurant.amenities.map((amenity, index) => (
                                <View key={index} style={styles.amenityTag}>
                                    <Text style={styles.amenityText}>{amenity}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Party Size Selector */}
                    <View style={styles.partySizeContainer}>
                        <Text style={styles.sectionTitle}>Party Size</Text>
                        <View style={styles.partySizeSelector}>
                            {[1, 2, 3, 4, 5, 6].map((size) => (
                                <TouchableOpacity
                                    key={size}
                                    style={[
                                        styles.partySizeButton,
                                        partySize === size && styles.partySizeButtonActive
                                    ]}
                                    onPress={() => setPartySize(size)}
                                >
                                    <Text style={[
                                        styles.partySizeText,
                                        partySize === size && styles.partySizeTextActive
                                    ]}>
                                        {size}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Date Selector */}
                    <View style={styles.dateContainer}>
                        <Text style={styles.sectionTitle}>Select Date</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.dateScroll}
                        >
                            {getNextSevenDays().map((date, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dateButton,
                                        selectedDate.toDateString() === date.toDateString() && styles.dateButtonActive
                                    ]}
                                    onPress={() => setSelectedDate(date)}
                                >
                                    <Text style={[
                                        styles.dateText,
                                        selectedDate.toDateString() === date.toDateString() && styles.dateTextActive
                                    ]}>
                                        {formatDate(date)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Available Time Slots Preview */}
                    <View style={styles.timeSlotsContainer}>
                        <Text style={styles.sectionTitle}>Available Times</Text>
                        <View style={styles.timeSlotsList}>
                            {dummyTimeSlots.slice(0, 6).map((slot, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.timeSlot,
                                        !slot.available && styles.timeSlotDisabled
                                    ]}
                                >
                                    <Text style={[
                                        styles.timeSlotText,
                                        !slot.available && styles.timeSlotTextDisabled
                                    ]}>
                                        {slot.time}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.moreTimesText}>+ More times available</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Book Now Button */}
            <View style={styles.bookingButtonContainer}>
                <TouchableOpacity style={styles.bookingButton} onPress={handleBooking}>
                    <Text style={styles.bookingButtonText}>
                        Find Table for {partySize} on {formatDate(selectedDate)}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    heroImage: {
        width: width,
        height: 250,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    priceRange: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    cuisine: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    stars: {
        fontSize: 18,
        color: '#FFD700',
        marginRight: 8,
    },
    rating: {
        fontSize: 14,
        color: '#666',
    },
    address: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    amenitiesContainer: {
        marginBottom: 24,
    },
    amenitiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    amenityTag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8,
    },
    amenityText: {
        fontSize: 12,
        color: '#666',
    },
    partySizeContainer: {
        marginBottom: 24,
    },
    partySizeSelector: {
        flexDirection: 'row',
    },
    partySizeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    partySizeButtonActive: {
        backgroundColor: '#007AFF',
    },
    partySizeText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    partySizeTextActive: {
        color: 'white',
    },
    dateContainer: {
        marginBottom: 24,
    },
    dateScroll: {
        marginHorizontal: -20,
    },
    dateButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        marginHorizontal: 4,
        marginLeft: 20,
    },
    dateButtonActive: {
        backgroundColor: '#007AFF',
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    dateTextActive: {
        color: 'white',
    },
    timeSlotsContainer: {
        marginBottom: 100, // Space for booking button
    },
    timeSlotsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    timeSlot: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#e8f5e8',
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    timeSlotDisabled: {
        backgroundColor: '#f0f0f0',
    },
    timeSlotText: {
        fontSize: 14,
        color: '#27ae60',
        fontWeight: '500',
    },
    timeSlotTextDisabled: {
        color: '#999',
    },
    moreTimesText: {
        fontSize: 14,
        color: '#007AFF',
        marginTop: 8,
    },
    bookingButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    bookingButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    bookingButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default RestaurantDetailScreen;