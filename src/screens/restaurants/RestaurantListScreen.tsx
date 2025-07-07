// src/screens/restaurants/RestaurantListScreen.tsx - OpenTable Style Light Theme
import React, {useState} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {dummyRestaurants, dummyTimeSlots} from '../../data/dummyData';
import {Restaurant} from '../../types';
import {RestaurantListScreenProps} from '../../navigation/AppNavigator';

const {width} = Dimensions.get('window');

const RestaurantListScreen: React.FC<RestaurantListScreenProps> = ({navigation}) => {
    const [partySize, setPartySize] = useState(2);
    const [selectedTime, setSelectedTime] = useState('Now');
    const [selectedLocation, setSelectedLocation] = useState('Nearby');

    const cuisineTypes = [
        {
            name: 'Mediterranean',
            image: 'https://images.unsplash.com/photo-1544511916-0148ccdeb877?w=100&h=100&fit=crop'
        },
        {name: 'Greek', image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=100&h=100&fit=crop'},
        {name: 'Japanese', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=100&h=100&fit=crop'},
        {name: 'Italian', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop'},
        {name: 'British', image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=100&h=100&fit=crop'},
    ];

    const featuredRestaurants = dummyRestaurants.slice(0, 2);
    const topRestaurants = dummyRestaurants;

    const handleRestaurantPress = (restaurant: Restaurant) => {
        navigation.navigate('RestaurantDetail', {restaurant});
    };

    const renderFeaturedRestaurant = ({item}: { item: Restaurant }) => (
        <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => handleRestaurantPress(item)}
        >
            <Image source={{uri: item.coverImageUrl}} style={styles.featuredImage}/>
            <View style={styles.featuredOverlay}>
                <View style={styles.featuredContent}>
                    <Text style={styles.featuredName}>{item.name}</Text>
                    <View style={styles.featuredDetails}>
                        <Text style={styles.featuredPrice}>{item.priceRange}</Text>
                        <Text style={styles.featuredCuisine}>{item.cuisineType}</Text>
                        <View style={styles.featuredRating}>
                            <Text style={styles.star}>★</Text>
                            <Text style={styles.ratingText}>{item.averageRating}</Text>
                        </View>
                        <Text style={styles.distance}>2.4 mi</Text>
                    </View>
                    {/* Time slots */}
                    <View style={styles.timeSlots}>
                        {dummyTimeSlots.slice(0, 3).map((slot, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.timeSlot}
                                onPress={() => {
                                    console.log(`Book table at ${slot.time} for ${item.name}`);
                                    // Navigate to booking screen with pre-selected time
                                    navigation.navigate('BookingScreen', {
                                        restaurant: item,
                                        selectedDate: new Date(),
                                        partySize: partySize
                                    });
                                }}
                            >
                                <Text style={styles.timeSlotText}>{slot.time}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => {
                        console.log(`Save/unsave ${item.name}`);
                        // Toggle save state for restaurant
                    }}
                >
                    <Text style={styles.saveIcon}>♡</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderCuisineType = ({item}: { item: any }) => (
        <TouchableOpacity
            style={styles.cuisineItem}
            onPress={() => {
                // Filter restaurants by cuisine type
                console.log(`Filter by cuisine: ${item.name}`);
                // You can implement filtering logic here
                // navigation.navigate('RestaurantList', { filter: item.name });
            }}
        >
            <Image source={{uri: item.image}} style={styles.cuisineImage}/>
            <Text style={styles.cuisineName}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderTopRestaurant = (restaurant: Restaurant, index: number) => (
        <TouchableOpacity
            key={restaurant.id}
            style={styles.topRestaurantItem}
            onPress={() => handleRestaurantPress(restaurant)}
        >
            <View style={styles.topRestaurantRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <Image source={{uri: restaurant.coverImageUrl}} style={styles.topRestaurantImage}/>
            <View style={styles.topRestaurantInfo}>
                <Text style={styles.topRestaurantName}>{restaurant.name}</Text>
                <View style={styles.topRestaurantRating}>
                    <Text style={styles.starSmall}>★★★★★</Text>
                    <Text style={styles.reviewCount}>{restaurant.totalReviews} reviews</Text>
                </View>
                <Text style={styles.topRestaurantCuisine}>{restaurant.cuisineType}</Text>
                <Text style={styles.topRestaurantLocation}>Nicosia</Text>
            </View>
            <View style={styles.topRestaurantRight}>
                <Text style={styles.topRestaurantPrice}>{restaurant.priceRange}</Text>
                <Text style={styles.topRestaurantDistance}>5.7 mi</Text>
                <TouchableOpacity
                    style={styles.topSaveButton}
                    onPress={() => {
                        console.log(`Save/unsave ${restaurant.name}`);
                        // Toggle save state for restaurant
                    }}
                >
                    <Text style={styles.topSaveIcon}>♡</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with greeting and avatar */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Good evening, Maria</Text>
                </View>

                {/* Party size, time, and location selectors */}
                <View style={styles.selectors}>
                    <TouchableOpacity style={styles.selectorButton}>
                        <Text style={styles.selectorIcon}>👥</Text>
                        <Text style={styles.selectorText}>{partySize} • {selectedTime}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.selectorButton}>
                        <Text style={styles.selectorIcon}>📍</Text>
                        <Text style={styles.selectorText}>{selectedLocation}</Text>
                    </TouchableOpacity>
                </View>

                {/* Browse by cuisine - at top */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Browse by cuisine</Text>
                        <TouchableOpacity onPress={() => {
                            console.log('View all cuisines');
                            // Navigate to full cuisine list or filter page
                        }}>
                            <Text style={styles.viewAll}>View all</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={cuisineTypes}
                        renderItem={renderCuisineType}
                        keyExtractor={(item) => item.name}
                        contentContainerStyle={styles.cuisineList}
                    />
                </View>

                {/* Featured restaurants - swipeable cards */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Book for late dinner tonight</Text>
                        <TouchableOpacity onPress={() => {
                            console.log('View all featured restaurants');
                            // Navigate to more featured restaurants
                        }}>
                            <Text style={styles.viewAll}>View all</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={featuredRestaurants}
                        renderItem={renderFeaturedRestaurant}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.featuredList}
                    />
                </View>

                {/* Top restaurants this week */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Top restaurants this week</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                        Explore what's popular with other diners with these lists, updated weekly.
                    </Text>

                    {/* Tab selector */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, styles.activeTab]}
                            onPress={() => console.log('Show top booked restaurants')}
                        >
                            <Text style={[styles.tabText, styles.activeTabText]}>Top booked</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.tab}
                            onPress={() => console.log('Show top viewed restaurants')}
                        >
                            <Text style={styles.tabText}>Top viewed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.tab}
                            onPress={() => console.log('Show top saved restaurants')}
                        >
                            <Text style={styles.tabText}>Top saved</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Top restaurants list */}
                    <View style={styles.topRestaurantsList}>
                        {topRestaurants.map((restaurant, index) => renderTopRestaurant(restaurant, index))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    selectors: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 10,
    },
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    selectorIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    selectorText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    viewAll: {
        fontSize: 16,
        color: '#dc3545',
        fontWeight: '500',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        paddingHorizontal: 20,
        marginBottom: 16,
        lineHeight: 20,
    },
    cuisineList: {
        paddingHorizontal: 20,
    },
    cuisineItem: {
        alignItems: 'center',
        marginRight: 20,
    },
    cuisineImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: 8,
    },
    cuisineName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    featuredList: {
        paddingHorizontal: 20,
    },
    featuredCard: {
        width: width * 0.75,
        marginRight: 16,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    featuredImage: {
        width: '100%',
        height: 180,
    },
    featuredOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    featuredContent: {
        flex: 1,
    },
    featuredName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    featuredDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featuredPrice: {
        fontSize: 14,
        color: 'white',
        marginRight: 8,
    },
    featuredCuisine: {
        fontSize: 14,
        color: 'white',
        marginRight: 8,
    },
    featuredRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    star: {
        color: '#FFD700',
        fontSize: 14,
        marginRight: 2,
    },
    ratingText: {
        fontSize: 14,
        color: 'white',
    },
    distance: {
        fontSize: 14,
        color: 'white',
    },
    timeSlots: {
        flexDirection: 'row',
        gap: 8,
    },
    timeSlot: {
        backgroundColor: '#dc3545',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    timeSlotText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    saveButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveIcon: {
        color: 'white',
        fontSize: 18,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 24,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#dc3545',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#dc3545',
        fontWeight: '500',
    },
    topRestaurantsList: {
        paddingHorizontal: 20,
    },
    topRestaurantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    topRestaurantRank: {
        width: 30,
        alignItems: 'center',
        marginRight: 12,
    },
    rankNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    topRestaurantImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    topRestaurantInfo: {
        flex: 1,
    },
    topRestaurantName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    topRestaurantRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    starSmall: {
        color: '#FFD700',
        fontSize: 12,
        marginRight: 4,
    },
    reviewCount: {
        fontSize: 12,
        color: '#666',
    },
    topRestaurantCuisine: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    topRestaurantLocation: {
        fontSize: 14,
        color: '#666',
    },
    topRestaurantRight: {
        alignItems: 'flex-end',
    },
    topRestaurantPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    topRestaurantDistance: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    topSaveButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topSaveIcon: {
        color: '#dc3545',
        fontSize: 16,
    },
});

export default RestaurantListScreen;