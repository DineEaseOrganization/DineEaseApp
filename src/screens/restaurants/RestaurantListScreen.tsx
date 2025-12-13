// src/screens/restaurants/RestaurantListScreen.tsx
import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {RestaurantListScreenProps} from '../../navigation/AppNavigator';
import {CuisineStat, RestaurantDetail, TimeRange, TopCategory} from "../../types/api.types";
import {restaurantService} from "../../services/api";
import {useLocation} from '../../hooks/useLocation';
import {mapRestaurantDetailToRestaurant, Restaurant} from "../../types"; // Import the hook

const {width} = Dimensions.get('window');

const RestaurantListScreen: React.FC<RestaurantListScreenProps> = ({navigation}) => {
    const [partySize, setPartySize] = useState(2);
    const [selectedTime, setSelectedTime] = useState('ASAP');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showPickerModal, setShowPickerModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [locationName, setLocationName] = useState('Loading...'); // NEW: Store location name
    const [searchRadius, setSearchRadius] = useState(10); // Default 10km

    // Data state
    const [featuredRestaurants, setFeaturedRestaurants] = useState<RestaurantDetail[]>([]);
    const [topRestaurants, setTopRestaurants] = useState<RestaurantDetail[]>([]);
    const [cuisines, setCuisines] = useState<CuisineStat[]>([]);
    const [activeTopCategory, setActiveTopCategory] = useState<TopCategory>(TopCategory.BOOKED);
    const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([]);

    // Loading states
    const [loadingFeatured, setLoadingFeatured] = useState(true);
    const [loadingTop, setLoadingTop] = useState(true);
    const [loadingCuisines, setLoadingCuisines] = useState(true);
    const [loadingNearby, setLoadingNearby] = useState(true);


    // Use the location hook
    const {location: userLocation, loading: locationLoading, refreshLocation, isUsingDefault} = useLocation();

    useEffect(() => {
        // Only load data when we have location
        if (userLocation) {
            loadData();
            getLocationName(); // NEW: Get readable location name
        }
    }, [userLocation]);

    useEffect(() => {
        if (userLocation) {
            loadTopRestaurants(activeTopCategory);
        }
    }, [activeTopCategory, userLocation]);

    const loadData = async () => {
        if (!userLocation) return;

        await Promise.all([
            loadFeaturedRestaurants(),
            loadTopRestaurants(activeTopCategory),
            loadCuisines(),
            loadNearbyRestaurants()
        ]);
    };

    // NEW: Get readable location name from coordinates
    const getLocationName = async () => {
        if (!userLocation) return;

        try {
            // Use Nominatim reverse geocoding (free, no API key needed)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?` +
              `format=json&` +
              `lat=${userLocation.latitude}&` +
              `lon=${userLocation.longitude}&` +
              `zoom=10&` +
              `addressdetails=1`,
              {
                  headers: {
                      'User-Agent': 'DineEaseApp/1.0'
                  }
              }
            );

            const data = await response.json();

            // Extract city/town/suburb name
            const address = data.address;
            const locationName = address.city ||
              address.town ||
              address.suburb ||
              address.village ||
              address.county ||
              'Current Location';

            setLocationName(locationName);
        } catch (error) {
            console.error('Error getting location name:', error);
            setLocationName('Current Location');
        }
    };

    const loadNearbyRestaurants = async (radius = searchRadius) => {
        if (!userLocation) return;

        try {
            setLoadingNearby(true);
            const response = await restaurantService.getNearbyRestaurants(
              userLocation.latitude,
              userLocation.longitude,
              radius,
              0,
              20
            );

            // Backend returns: { restaurants: [...], hasMore: true }
            setNearbyRestaurants(response.restaurants.map(mapRestaurantDetailToRestaurant));

        } catch (err) {
            console.error('Error loading nearby restaurants:', err);
        } finally {
            setLoadingNearby(false);
        }
    };

    const loadFeaturedRestaurants = async (radius = searchRadius) => {
        if (!userLocation) return;

        try {
            setLoadingFeatured(true);
            const data = await restaurantService.getFeaturedRestaurants(
              10,
              userLocation.latitude,
              userLocation.longitude,
              radius
            );
            setFeaturedRestaurants(data.map(mapRestaurantDetailToRestaurant));
        } catch (error) {
            console.error('Error loading featured restaurants:', error);
            Alert.alert('Error', 'Failed to load featured restaurants');
        } finally {
            setLoadingFeatured(false);
        }
    };

    const loadTopRestaurants = async (category: TopCategory, radius = searchRadius) => {
        if (!userLocation) return;

        try {
            setLoadingTop(true);

            // Try THIS_WEEK first
            let data = await restaurantService.getTopRestaurants(
              category,
              TimeRange.THIS_WEEK,
              userLocation.latitude,
              userLocation.longitude,
              radius,
              10
            );

            // If no results, fallback to ALL_TIME
            if (data.restaurants.length === 0) {
                console.log('No results for THIS_WEEK, trying ALL_TIME');
                data = await restaurantService.getTopRestaurants(
                  category,
                  TimeRange.ALL_TIME,
                  userLocation.latitude,
                  userLocation.longitude,
                  radius,
                  10
                );
            }

            setTopRestaurants(data.restaurants.map(mapRestaurantDetailToRestaurant));
        } catch (error) {
            console.error('Error loading top restaurants:', error);
            Alert.alert('Error', 'Failed to load top restaurants');
        } finally {
            setLoadingTop(false);
        }
    };

    const loadCuisines = async (radius = searchRadius) => {
        if (!userLocation) return;

        try {
            setLoadingCuisines(true);
            const data = await restaurantService.getAvailableCuisines(
              userLocation.latitude,
              userLocation.longitude,
              radius
            );
            setCuisines(data.slice(0, 10)); // Top 10 cuisines
        } catch (error) {
            console.error('Error loading cuisines:', error);
            Alert.alert('Error', 'Failed to load cuisines');
        } finally {
            setLoadingCuisines(false);
        }
    };

    const handleRestaurantPress = (restaurant: RestaurantDetail) => {
        navigation.navigate('RestaurantDetail', {restaurant});
    };

    const handleCuisinePress = (cuisineType: string) => {
        if (!userLocation) return;

        navigation.navigate('CuisineRestaurants', {
            cuisineType: cuisineType,
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radius: searchRadius
        });
    };

    // NEW: Format date/time display
    const getDisplayText = () => {
        const today = new Date();
        const isToday = selectedDate.toDateString() === today.toDateString();

        if (isToday && selectedTime === 'ASAP') {
            return `${partySize} • Now`;
        } else if (isToday) {
            return `${partySize} • ${selectedTime}`;
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const isTomorrow = selectedDate.toDateString() === tomorrow.toDateString();

            const dateStr = isTomorrow ? 'Tomorrow' : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `${partySize} • ${dateStr} ${selectedTime}`;
        }
    };

    // NEW: Handle radius change
    const handleRadiusChange = (newRadius: number) => {
        setSearchRadius(newRadius);
        if (userLocation) {
            loadNearbyRestaurants(newRadius);
            loadFeaturedRestaurants(newRadius);
            loadCuisines(newRadius);
            loadTopRestaurants(activeTopCategory, newRadius);
        }
    };

    const renderFeaturedRestaurant = ({item}: { item: RestaurantDetail }) => (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => handleRestaurantPress(item)}
      >
          <Image
            source={{uri: item.coverImageUrl || 'https://via.placeholder.com/400x180'}}
            style={styles.featuredImage}
          />
          <View style={styles.featuredOverlay}>
              <View style={styles.featuredContent}>
                  <Text style={styles.featuredName}>{item.name}</Text>
                  <View style={styles.featuredDetails}>
                      <Text style={styles.featuredPrice}>{item.priceRange || '$$'}</Text>
                      <Text style={styles.featuredCuisine}>{item.primaryCuisineType}</Text>
                      <View style={styles.featuredRating}>
                          <Text style={styles.star}>★</Text>
                          <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
                      </View>
                      {item.latitude && item.longitude && (
                        <Text style={styles.distance}>
                            {calculateDistance(
                              userLocation.latitude,
                              userLocation.longitude,
                              item.latitude,
                              item.longitude
                            ).toFixed(1)} mi
                        </Text>
                      )}
                  </View>
                  {/* Placeholder time slots - will integrate with booking API later */}
                  <View style={styles.timeSlots}>
                      {['17:00', '18:00', '19:00'].map((time, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.timeSlot}
                          onPress={() => {
                              navigation.navigate('BookingScreen', {
                                  restaurant: item,
                                  selectedDate: new Date(),
                                  partySize: partySize
                              });
                          }}
                        >
                            <Text style={styles.timeSlotText}>{time}</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                    console.log(`Save/unsave ${item.name}`);
                    // Will implement with favorites API in Phase 4
                }}
              >
                  <Text style={styles.saveIcon}>♡</Text>
              </TouchableOpacity>
          </View>
      </TouchableOpacity>
    );

    const renderCuisineType = ({item}: { item: CuisineStat }) => (
      <TouchableOpacity
        style={styles.cuisineItem}
        onPress={() => handleCuisinePress(item.cuisineType)}
      >
          <View style={styles.cuisineImagePlaceholder}>
              <Text style={styles.cuisineEmoji}>{getCuisineEmoji(item.cuisineType)}</Text>
          </View>
          <Text style={styles.cuisineName}>{item.cuisineType}</Text>
          <Text style={styles.cuisineCount}>{item.count}</Text>
      </TouchableOpacity>
    );

    const renderTopRestaurant = (restaurant: RestaurantDetail, index: number) => (
      <TouchableOpacity
        key={restaurant.id}
        style={styles.topRestaurantItem}
        onPress={() => handleRestaurantPress(restaurant)}
      >
          <View style={styles.topRestaurantRank}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
          </View>
          <Image
            source={{uri: restaurant.coverImageUrl || 'https://via.placeholder.com/60'}}
            style={styles.topRestaurantImage}
          />
          <View style={styles.topRestaurantInfo}>
              <Text style={styles.topRestaurantName}>{restaurant.name}</Text>
              <View style={styles.topRestaurantRating}>
                  <Text style={styles.starSmall}>{'★'.repeat(Math.round(restaurant.averageRating))}</Text>
                  <Text style={styles.reviewCount}>{restaurant.totalReviews} reviews</Text>
              </View>
              <Text style={styles.topRestaurantCuisine}>{restaurant.primaryCuisineType}</Text>
              <Text style={styles.topRestaurantLocation}>{restaurant.address}</Text>
          </View>
          <View style={styles.topRestaurantRight}>
              <Text style={styles.topRestaurantPrice}>{restaurant.priceRange || '$$'}</Text>
              {restaurant.latitude && restaurant.longitude && (
                <Text style={styles.topRestaurantDistance}>
                    {calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      restaurant.latitude,
                      restaurant.longitude
                    ).toFixed(1)} mi
                </Text>
              )}
              <TouchableOpacity
                style={styles.topSaveButton}
                onPress={() => {
                    console.log(`Save/unsave ${restaurant.name}`);
                    // Will implement with favorites API in Phase 4
                }}
              >
                  <Text style={styles.topSaveIcon}>♡</Text>
              </TouchableOpacity>
          </View>
      </TouchableOpacity>
    );

    // Helper function to calculate distance
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 3959; // Earth radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Helper function to get emoji for cuisine type
    const getCuisineEmoji = (cuisineType: string): string => {
        const emojiMap: { [key: string]: string } = {
            'Italian': '🍝',
            'Japanese': '🍣',
            'Chinese': '🥢',
            'Mexican': '🌮',
            'Indian': '🍛',
            'Thai': '🍜',
            'French': '🥐',
            'Greek': '🥗',
            'Mediterranean': '🫒',
            'American': '🍔',
            'British': '🍺',
        };
        return emojiMap[cuisineType] || '🍽️';
    };

    if (locationLoading) {
        return (
          <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#dc3545"/>
              <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        );
    }

    // Show error if no location
    if (!userLocation) {
        return (
          <View style={styles.centerContainer}>
              <Text style={styles.errorText}>Could not get your location</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refreshLocation}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
          </View>
        );
    }

    return (
      <SafeAreaView style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header with greeting */}
              <View style={styles.header}>
                  <Text style={styles.greeting}>Good evening</Text>
                  {isUsingDefault && (
                    <Text style={styles.defaultLocationText}>
                        📍 Using default location (London)
                    </Text>
                  )}
              </View>

              {/* Party size, time, and location selectors */}
              <View style={styles.selectors}>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setShowPickerModal(true)}
                  >
                      <Text style={styles.selectorIcon}>👥</Text>
                      <Text style={styles.selectorText}>{getDisplayText()}</Text>
                  </TouchableOpacity>
                  <View style={styles.selectorInfo}>
                      <Text style={styles.selectorIcon}>📍</Text>
                      <Text style={styles.selectorText} numberOfLines={1}>{locationName}</Text>
                  </View>
              </View>

              {/* NEW: Radius Selector */}
              <View style={styles.radiusSection}>
                  <View style={styles.radiusHeader}>
                      <Text style={styles.radiusLabel}>Search Radius</Text>
                      <Text style={styles.radiusValue}>{searchRadius}km</Text>
                  </View>
                  <View style={styles.radiusButtons}>
                      {[5, 10, 20, 50].map((radius) => (
                        <TouchableOpacity
                          key={radius}
                          style={[
                              styles.radiusButton,
                              searchRadius === radius && styles.radiusButtonActive
                          ]}
                          onPress={() => handleRadiusChange(radius)}
                        >
                            <Text style={[
                                styles.radiusButtonText,
                                searchRadius === radius && styles.radiusButtonTextActive
                            ]}>
                                {radius}km
                            </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
              </View>

              {/* Nearby Restaurants */}
              <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Nearby</Text>

                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('NearbyRestaurants', {
                              latitude: userLocation.latitude,
                              longitude: userLocation.longitude,
                              radius: searchRadius,
                          })
                        }
                      >
                          <Text style={styles.viewAll}>View more →</Text>
                      </TouchableOpacity>
                  </View>

                  {loadingNearby ? (
                    <ActivityIndicator size="large" color="#dc3545" style={{ marginVertical: 20 }} />
                  ) : nearbyRestaurants.length === 0 ? (
                    <View style={styles.emptyNearbyContainer}>
                        <Text style={styles.emptyNearbyIcon}>📍</Text>
                        <Text style={styles.emptyNearbyText}>No restaurants found nearby</Text>
                        <Text style={styles.emptyNearbySubtext}>Try using the search to explore other areas</Text>
                    </View>
                  ) : (
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={nearbyRestaurants}
                      keyExtractor={(item) => item.id.toString()}
                      contentContainerStyle={styles.featuredList}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.featuredCard}
                          onPress={() => handleRestaurantPress(item)}
                        >
                            <Image
                              source={{ uri: item.coverImageUrl || 'https://via.placeholder.com/400x180' }}
                              style={styles.featuredImage}
                            />

                            {/* Same overlay layout as Featured */}
                            <View style={styles.featuredOverlay}>
                                <View style={styles.featuredContent}>
                                    <Text style={styles.featuredName} numberOfLines={1}>
                                        {item.name}
                                    </Text>

                                    <View style={styles.featuredDetails}>
                                        <Text style={styles.featuredPrice}>{item.priceRange || '$$'}</Text>

                                        <Text style={styles.featuredCuisine}>{item.primaryCuisineType}</Text>

                                        <View style={styles.featuredRating}>
                                            <Text style={styles.star}>★</Text>
                                            <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
                                        </View>

                                        {item.latitude && item.longitude && (
                                          <Text style={styles.distance}>
                                              {calculateDistance(
                                                userLocation.latitude,
                                                userLocation.longitude,
                                                item.latitude,
                                                item.longitude
                                              ).toFixed(1)}{' '}
                                              mi
                                          </Text>
                                        )}
                                    </View>

                                    {/* Simple time slots to match Featured */}
                                    <View style={styles.timeSlots}>
                                        {['17:00', '18:00', '19:00'].map((time, i) => (
                                          <TouchableOpacity
                                            key={i}
                                            style={styles.timeSlot}
                                            onPress={() =>
                                              navigation.navigate('BookingScreen', {
                                                  restaurant: item,
                                                  selectedDate: new Date(),
                                                  partySize: partySize,
                                              })
                                            }
                                          >
                                              <Text style={styles.timeSlotText}>{time}</Text>
                                          </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Save icon for consistency */}
                                <TouchableOpacity
                                  style={styles.saveButton}
                                  onPress={() => console.log('save/unsave', item.name)}
                                >
                                    <Text style={styles.saveIcon}>♡</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                      )}
                    />
                  )}
              </View>

              {/* Browse by cuisine */}
              <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Browse by cuisine</Text>
                      <TouchableOpacity onPress={() => navigation.navigate('RestaurantSearch', {})}>
                          <Text style={styles.viewAll}>View all</Text>
                      </TouchableOpacity>
                  </View>
                  {loadingCuisines ? (
                    <ActivityIndicator size="large" color="#dc3545" style={{marginVertical: 20}}/>
                  ) : (
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={cuisines}
                      renderItem={renderCuisineType}
                      keyExtractor={(item) => item.cuisineType}
                      contentContainerStyle={styles.cuisineList}
                    />
                  )}
              </View>

              {/* Featured restaurants */}
              <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Featured restaurants</Text>
                      <TouchableOpacity onPress={loadFeaturedRestaurants}>
                          <Text style={styles.viewAll}>Refresh</Text>
                      </TouchableOpacity>
                  </View>
                  {loadingFeatured ? (
                    <ActivityIndicator size="large" color="#dc3545" style={{marginVertical: 20}}/>
                  ) : (
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={featuredRestaurants}
                      renderItem={renderFeaturedRestaurant}
                      keyExtractor={(item) => item.id.toString()}
                      contentContainerStyle={styles.featuredList}
                    />
                  )}
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
                        style={[styles.tab, activeTopCategory === TopCategory.BOOKED && styles.activeTab]}
                        onPress={() => setActiveTopCategory(TopCategory.BOOKED)}
                      >
                          <Text style={[
                              styles.tabText,
                              activeTopCategory === TopCategory.BOOKED && styles.activeTabText
                          ]}>
                              Top booked
                          </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tab, activeTopCategory === TopCategory.VIEWED && styles.activeTab]}
                        onPress={() => setActiveTopCategory(TopCategory.VIEWED)}
                      >
                          <Text style={[
                              styles.tabText,
                              activeTopCategory === TopCategory.VIEWED && styles.activeTabText
                          ]}>
                              Top viewed
                          </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tab, activeTopCategory === TopCategory.SAVED && styles.activeTab]}
                        onPress={() => setActiveTopCategory(TopCategory.SAVED)}
                      >
                          <Text style={[
                              styles.tabText,
                              activeTopCategory === TopCategory.SAVED && styles.activeTabText
                          ]}>
                              Top saved
                          </Text>
                      </TouchableOpacity>
                  </View>

                  {loadingTop ? (
                    <ActivityIndicator size="large" color="#dc3545" style={{marginVertical: 20}}/>
                  ) : (
                    <View style={styles.topRestaurantsList}>
                        {topRestaurants.map((restaurant, index) => renderTopRestaurant(restaurant, index))}
                    </View>
                  )}
              </View>
          </ScrollView>

          {/* Party Size & Time Picker Modal */}
          <Modal
            visible={showPickerModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPickerModal(false)}
          >
              <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                          <Text style={styles.modalTitle}>Select Party Size & Time</Text>
                          <TouchableOpacity onPress={() => setShowPickerModal(false)}>
                              <Text style={styles.modalClose}>✕</Text>
                          </TouchableOpacity>
                      </View>

                      {/* Party Size Selector */}
                      <View style={styles.modalSection}>
                          <Text style={styles.modalSectionTitle}>Party Size</Text>
                          <View style={styles.partySizeGrid}>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                                <TouchableOpacity
                                  key={size}
                                  style={[
                                      styles.partySizeButton,
                                      partySize === size && styles.partySizeButtonActive
                                  ]}
                                  onPress={() => setPartySize(size)}
                                >
                                    <Text style={[
                                        styles.partySizeButtonText,
                                        partySize === size && styles.partySizeButtonTextActive
                                    ]}>
                                        {size}
                                    </Text>
                                </TouchableOpacity>
                              ))}
                          </View>
                      </View>

                      {/* Date Selector */}
                      <View style={styles.modalSection}>
                          <Text style={styles.modalSectionTitle}>Date</Text>
                          <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowDatePicker(true)}
                          >
                              <Text style={styles.datePickerIcon}>📅</Text>
                              <Text style={styles.datePickerText}>
                                  {selectedDate.toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                  })}
                              </Text>
                          </TouchableOpacity>

                          {showDatePicker && (
                            <DateTimePicker
                              value={selectedDate}
                              mode="date"
                              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                              minimumDate={new Date()}
                              onChange={(event, date) => {
                                  setShowDatePicker(Platform.OS === 'ios');
                                  if (date) setSelectedDate(date);
                              }}
                            />
                          )}
                      </View>

                      {/* Time Selector */}
                      <View style={styles.modalSection}>
                          <Text style={styles.modalSectionTitle}>Time</Text>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => setShowTimePicker(!showTimePicker)}
                          >
                              <Text style={styles.timePickerIcon}>🕐</Text>
                              <Text style={styles.timePickerText}>{selectedTime}</Text>
                              <Text style={styles.dropdownArrow}>{showTimePicker ? '▲' : '▼'}</Text>
                          </TouchableOpacity>

                          {showTimePicker && (
                            <ScrollView style={styles.timeDropdown} nestedScrollEnabled={true}>
                                {['ASAP', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
                                    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
                                    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
                                    '21:00', '21:30', '22:00'].map((time) => (
                                  <TouchableOpacity
                                    key={time}
                                    style={styles.timeDropdownItem}
                                    onPress={() => {
                                        setSelectedTime(time);
                                        setShowTimePicker(false);
                                    }}
                                  >
                                      <Text style={[
                                          styles.timeDropdownText,
                                          selectedTime === time && styles.timeDropdownTextActive
                                      ]}>
                                          {time}
                                      </Text>
                                      {selectedTime === time && (
                                        <Text style={styles.checkmark}>✓</Text>
                                      )}
                                  </TouchableOpacity>
                                ))}
                            </ScrollView>
                          )}
                      </View>

                      {/* Done Button */}
                      <TouchableOpacity
                        style={styles.modalDoneButton}
                        onPress={() => {
                            setShowPickerModal(false);
                            setShowTimePicker(false);
                        }}
                      >
                          <Text style={styles.modalDoneButtonText}>Done</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </Modal>
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    selectors: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 24,
        gap: 12,
    },
    selectorButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    selectorIcon: {
        fontSize: 18,
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
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    viewAll: {
        fontSize: 14,
        color: '#dc3545',
        fontWeight: '500',
    },
    cuisineList: {
        paddingHorizontal: 20,
    },
    cuisineItem: {
        alignItems: 'center',
        marginRight: 20,
    },
    cuisineImagePlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    cuisineEmoji: {
        fontSize: 32,
    },
    cuisineName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    cuisineCount: {
        fontSize: 12,
        color: '#666',
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#dc3545',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#dc3545',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    defaultLocationText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    // NEW: Radius Selector Styles
    radiusSection: {
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 16,
    },
    radiusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    radiusLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    radiusValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#dc3545',
    },
    radiusButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    radiusButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    radiusButtonActive: {
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
    },
    radiusButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    radiusButtonTextActive: {
        color: '#fff',
    },
    emptyNearbyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyNearbyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyNearbyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyNearbySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    selectorInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    modalClose: {
        fontSize: 28,
        color: '#666',
        fontWeight: '300',
    },
    modalSection: {
        marginBottom: 24,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    partySizeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    partySizeButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    partySizeButtonActive: {
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
    },
    partySizeButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
    },
    partySizeButtonTextActive: {
        color: '#fff',
    },
    // Date Picker Styles
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    datePickerIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    datePickerText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    // Time Picker Styles
    timePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    timePickerIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    timePickerText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#666',
    },
    timeDropdown: {
        maxHeight: 200,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginTop: 8,
    },
    timeDropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    timeDropdownText: {
        fontSize: 16,
        color: '#333',
    },
    timeDropdownTextActive: {
        color: '#dc3545',
        fontWeight: '600',
    },
    checkmark: {
        fontSize: 16,
        color: '#dc3545',
        fontWeight: 'bold',
    },
    timeScrollView: {
        maxHeight: 200,
    },
    modalDoneButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    modalDoneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default RestaurantListScreen;