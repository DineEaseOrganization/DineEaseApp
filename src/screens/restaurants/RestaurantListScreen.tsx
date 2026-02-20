import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RestaurantListScreenProps } from '../../navigation/AppNavigator';
import { CuisineStat, TopCategory } from '../../types/api.types';
import { useLocation } from '../../hooks/useLocation';
import { mapRestaurantDetailToRestaurant, Restaurant } from '../../types';
import PartyDateTimePicker from '../booking/PartyDateTimePicker';
import { formatPartyDateTime } from '../../utils/Datetimeutils';
import FavoriteButton from '../../components/FavoriteButton';
import { CachedImage } from '../../components/CachedImage';
import {
  useNearbyRestaurants,
  useFeaturedRestaurants,
  useTopRestaurants,
  useAvailableCuisines,
} from '../../hooks/useRestaurantQueries';
import { CACHE_CONFIG } from '../../config/cache.config';

const { width } = Dimensions.get('window');

const RestaurantListScreen: React.FC<RestaurantListScreenProps> = ({ navigation }) => {
  const [partySize, setPartySize] = useState(2);
  const [selectedTime, setSelectedTime] = useState('ASAP');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [locationName, setLocationName] = useState('Loading...');
  const [searchRadius, setSearchRadius] = useState(10);
  const [activeTopCategory, setActiveTopCategory] = useState<TopCategory>(TopCategory.BOOKED);

  // Ref to throttle Nominatim reverse-geocoding: only re-call if moved >~500m
  const lastGeocodeCoords = useRef<{ lat: number; lng: number } | null>(null);

  const { location: userLocation, loading: locationLoading, refreshLocation, isUsingDefault } = useLocation();

  // ── Cached query hooks ──────────────────────────────────────────────────────
  const { data: nearbyData, isLoading: loadingNearby } = useNearbyRestaurants(userLocation, searchRadius);
  const { data: featuredData, isLoading: loadingFeatured, refetch: refetchFeatured } = useFeaturedRestaurants(userLocation, searchRadius);
  const { data: topData, isLoading: loadingTop } = useTopRestaurants(activeTopCategory, userLocation, searchRadius);
  const { data: cuisinesData, isLoading: loadingCuisines } = useAvailableCuisines(userLocation, searchRadius);

  const nearbyRestaurants: Restaurant[] = nearbyData?.restaurants.map(mapRestaurantDetailToRestaurant) ?? [];
  const featuredRestaurants: Restaurant[] = featuredData?.map(mapRestaurantDetailToRestaurant) ?? [];
  const topRestaurants: Restaurant[] = topData?.restaurants.map(mapRestaurantDetailToRestaurant) ?? [];
  const cuisines: CuisineStat[] = cuisinesData?.slice(0, 10) ?? [];
  // ────────────────────────────────────────────────────────────────────────────

  // Fetch readable location name when coordinates change meaningfully
  useEffect(() => {
    if (userLocation) {
      void getLocationName();
    }
  }, [userLocation]);

  /**
   * Reverse-geocode the current location via Nominatim.
   * Throttled via ref: skips the call if the user hasn't moved more than ~500m
   * (0.005 degrees ≈ 550m) since the last successful fetch.
   */
  const getLocationName = async () => {
    if (!userLocation) return;

    const prev = lastGeocodeCoords.current;
    if (
      prev &&
      Math.abs(prev.lat - userLocation.latitude) < CACHE_CONFIG.GEOCODE_THRESHOLD_DEGREES &&
      Math.abs(prev.lng - userLocation.longitude) < CACHE_CONFIG.GEOCODE_THRESHOLD_DEGREES
    ) {
      return; // Moved less than ~500m — reuse existing name
    }
    lastGeocodeCoords.current = { lat: userLocation.latitude, lng: userLocation.longitude };

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `format=json&` +
        `lat=${userLocation.latitude}&` +
        `lon=${userLocation.longitude}&` +
        `zoom=10&` +
        `addressdetails=1`,
        {
          headers: {
            'User-Agent': 'DineEaseApp/1.0',
          },
        },
      );

      if (!response.ok) {
        setLocationName('Current Location');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setLocationName('Current Location');
        return;
      }

      const data = await response.json();

      if (!data.address) {
        setLocationName('Current Location');
        return;
      }

      const address = data.address;
      const name =
        address.city ||
        address.town ||
        address.suburb ||
        address.village ||
        address.county ||
        'Current Location';

      setLocationName(name);
    } catch {
      setLocationName('Current Location');
    }
  };

  const handleCuisinePress = (cuisineType: string) => {
    if (!userLocation) return;
    navigation.navigate('CuisineRestaurants', {
      cuisineType,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radius: searchRadius,
    });
  };

  /**
   * Radius change: just update state.
   * TanStack Query detects the new key and fires the queries automatically.
   * Switching back to a previous radius returns data instantly from cache.
   */
  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
  };

  const renderFeaturedRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => navigation.navigate('RestaurantDetail', {
        restaurant: item,
        partySize,
        selectedDate,
        selectedTime,
      })}
    >
      <CachedImage
        uri={item.coverImageUrl || null}
        style={styles.featuredImage}
        fallbackColor="#e0e0e0"
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
            {item.latitude && item.longitude && userLocation && (
              <Text style={styles.distance}>
                {calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  item.latitude,
                  item.longitude,
                ).toFixed(1)} mi
              </Text>
            )}
          </View>
          <View style={styles.timeSlots}>
            {['17:00', '18:00', '19:00'].map((time, index) => (
              <TouchableOpacity
                key={index}
                style={styles.timeSlot}
                onPress={() => {
                  navigation.navigate('BookingScreen', {
                    restaurant: item,
                    selectedDate: new Date(),
                    partySize: partySize,
                  });
                }}
              >
                <Text style={styles.timeSlotText}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <FavoriteButton
          restaurantId={item.id}
          size="medium"
          style={styles.saveButton}
        />
      </View>
    </TouchableOpacity>
  );

  const renderCuisineType = ({ item }: { item: CuisineStat }) => (
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

  const renderTopRestaurant = (restaurant: Restaurant, index: number) => (
    <TouchableOpacity
      key={restaurant.id}
      style={styles.topRestaurantItem}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant, partySize, selectedDate, selectedTime })}
    >
      <View style={styles.topRestaurantRank}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
      </View>
      <CachedImage
        uri={restaurant.coverImageUrl || null}
        style={styles.topRestaurantImage}
        fallbackColor="#e0e0e0"
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
        {restaurant.latitude && restaurant.longitude && userLocation && (
          <Text style={styles.topRestaurantDistance}>
            {calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              restaurant.latitude,
              restaurant.longitude,
            ).toFixed(1)} mi
          </Text>
        )}
        <FavoriteButton
          restaurantId={restaurant.id}
          size="small"
          style={styles.topSaveButton}
        />
      </View>
    </TouchableOpacity>
  );

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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
        <ActivityIndicator size="large" color="#dc3545" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

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
        {/* Header */}
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
            <Text style={styles.selectorText}>{formatPartyDateTime(partySize, selectedDate, selectedTime)}</Text>
          </TouchableOpacity>
          <View style={styles.selectorInfo}>
            <Text style={styles.selectorIcon}>📍</Text>
            <Text style={styles.selectorText} numberOfLines={1}>{locationName}</Text>
          </View>
        </View>

        {/* Radius Selector */}
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
                  searchRadius === radius && styles.radiusButtonActive,
                ]}
                onPress={() => handleRadiusChange(radius)}
              >
                <Text style={[
                  styles.radiusButtonText,
                  searchRadius === radius && styles.radiusButtonTextActive,
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
                  onPress={() => navigation.navigate('RestaurantDetail', {
                    restaurant: item,
                    partySize,
                    selectedDate,
                    selectedTime,
                  })}
                >
                  <CachedImage
                    uri={item.coverImageUrl || null}
                    style={styles.featuredImage}
                    fallbackColor="#e0e0e0"
                  />
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
                              item.longitude,
                            ).toFixed(1)}{' '}
                            mi
                          </Text>
                        )}
                      </View>
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
                    <FavoriteButton
                      restaurantId={item.id}
                      size="medium"
                      style={styles.saveButton}
                    />
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
            <TouchableOpacity onPress={() => console.log('Navigate to search screen')}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          {loadingCuisines ? (
            <ActivityIndicator size="large" color="#dc3545" style={{ marginVertical: 20 }} />
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
            <TouchableOpacity onPress={() => void refetchFeatured()}>
              <Text style={styles.viewAll}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {loadingFeatured ? (
            <ActivityIndicator size="large" color="#dc3545" style={{ marginVertical: 20 }} />
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

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTopCategory === TopCategory.BOOKED && styles.activeTab]}
              onPress={() => setActiveTopCategory(TopCategory.BOOKED)}
            >
              <Text style={[styles.tabText, activeTopCategory === TopCategory.BOOKED && styles.activeTabText]}>
                Top booked
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTopCategory === TopCategory.VIEWED && styles.activeTab]}
              onPress={() => setActiveTopCategory(TopCategory.VIEWED)}
            >
              <Text style={[styles.tabText, activeTopCategory === TopCategory.VIEWED && styles.activeTabText]}>
                Top viewed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTopCategory === TopCategory.SAVED && styles.activeTab]}
              onPress={() => setActiveTopCategory(TopCategory.SAVED)}
            >
              <Text style={[styles.tabText, activeTopCategory === TopCategory.SAVED && styles.activeTabText]}>
                Top saved
              </Text>
            </TouchableOpacity>
          </View>

          {loadingTop ? (
            <ActivityIndicator size="large" color="#dc3545" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.topRestaurantsList}>
              {topRestaurants.map((restaurant, index) => renderTopRestaurant(restaurant, index))}
            </View>
          )}
        </View>
      </ScrollView>

      <PartyDateTimePicker
        visible={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        partySize={partySize}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onPartySizeChange={setPartySize}
        onDateChange={setSelectedDate}
        onTimeChange={setSelectedTime}
      />
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
    shadowOffset: { width: 0, height: 2 },
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
});

export default RestaurantListScreen;
