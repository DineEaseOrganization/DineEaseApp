
    
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { RestaurantListScreenProps } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  useAvailableCuisines } from '../../hooks/useRestaurantQueries';
import { CACHE_CONFIG } from '../../config/cache.config';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import { r } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';

const { width } = Dimensions.get('window');

// Brand navy — used as a structural/branding colour throughout
const NAVY = Colors.primary; // #0f3346

const RestaurantListScreen: React.FC<RestaurantListScreenProps> = ({ navigation }) => {
  const [partySize, setPartySize] = useState(2);
  const [selectedTime, setSelectedTime] = useState('ASAP');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [locationName, setLocationName] = useState('Loading...');
  const [searchRadius, setSearchRadius] = useState(10);
  const [activeTopCategory, setActiveTopCategory] = useState<TopCategory>(TopCategory.BOOKED);

  const lastGeocodeCoords = useRef<{ lat: number; lng: number } | null>(null);
  const { location: userLocation, loading: locationLoading, refreshLocation, isUsingDefault } = useLocation();

  const { data: nearbyData, isLoading: loadingNearby } = useNearbyRestaurants(userLocation, searchRadius);
  const { data: featuredData, isLoading: loadingFeatured, refetch: refetchFeatured } = useFeaturedRestaurants(userLocation, searchRadius);
  const { data: topData, isLoading: loadingTop } = useTopRestaurants(activeTopCategory, userLocation, searchRadius);
  const { data: cuisinesData, isLoading: loadingCuisines } = useAvailableCuisines(userLocation, searchRadius);

  const nearbyRestaurants: Restaurant[] = nearbyData?.restaurants.map(mapRestaurantDetailToRestaurant) ?? [];
  const featuredRestaurants: Restaurant[] = featuredData?.map(mapRestaurantDetailToRestaurant) ?? [];
  const topRestaurants: Restaurant[] = topData?.restaurants.map(mapRestaurantDetailToRestaurant) ?? [];
  const cuisines: CuisineStat[] = cuisinesData?.slice(0, 10) ?? [];

  useEffect(() => {
    if (userLocation) void getLocationName();
  }, [userLocation]);

  const getLocationName = async () => {
    if (!userLocation) return;
    const prev = lastGeocodeCoords.current;
    if (
      prev &&
      Math.abs(prev.lat - userLocation.latitude) < CACHE_CONFIG.GEOCODE_THRESHOLD_DEGREES &&
      Math.abs(prev.lng - userLocation.longitude) < CACHE_CONFIG.GEOCODE_THRESHOLD_DEGREES
    ) return;
    lastGeocodeCoords.current = { lat: userLocation.latitude, lng: userLocation.longitude };
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.latitude}&lon=${userLocation.longitude}&zoom=10&addressdetails=1`,
        { headers: { 'User-Agent': 'DineEaseApp/1.0' } },
      );
      if (!res.ok) { setLocationName('Current Location'); return; }
      const ct = res.headers.get('content-type');
      if (!ct?.includes('application/json')) { setLocationName('Current Location'); return; }
      const data = await res.json();
      if (!data.address) { setLocationName('Current Location'); return; }
      const a = data.address;
      setLocationName(a.city || a.town || a.suburb || a.village || a.county || 'Current Location');
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
      radius: searchRadius });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getCuisineEmoji = (cuisineType: string): string => {
    const map: Record<string, string> = {
      Italian: '🍝', Japanese: '🍣', Chinese: '🥢', Mexican: '🌮',
      Indian: '🍛', Thai: '🍜', French: '🥐', Greek: '🥗',
      Mediterranean: '🫒', American: '🍔', British: '🍺' };
    return map[cuisineType] || '🍽️';
  };

  // ── Horizontal carousel card ─────────────────────────────────────────────────
  const renderHorizontalCard = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.hCard}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item, partySize, selectedDate, selectedTime })}
      activeOpacity={0.88}
    >
      {/* Image — pure, no overlay */}
      <View style={styles.hCardImageWrap}>
        <CachedImage uri={item.coverImageUrl || null} style={styles.hCardImage} fallbackColor="#cdd8e0" />

        {/* Price badge — navy pill top-left */}
        <View style={styles.hCardPriceBadge}>
          <AppText variant="captionMedium" color={Colors.white} style={{ letterSpacing: 0.4 }}>
            {item.priceRange || '$$'}
          </AppText>
        </View>

        {/* Favorite — top right */}
        <FavoriteButton restaurantId={item.id} size="small" style={styles.hCardFav} />
      </View>

      {/* Info strip — white with navy name */}
      <View style={styles.hCardInfo}>
        {/* Navy left-accent bar on name */}
        <View style={styles.hCardNameRow}>
          <View style={styles.hCardNavyAccent} />
          <AppText variant="cardTitle" color={NAVY} numberOfLines={1} style={styles.hCardName}>
            {item.name}
          </AppText>
        </View>

        <View style={styles.hCardMeta}>
          <AppText style={styles.hCardStar}>★</AppText>
          <AppText variant="captionMedium" color={Colors.textOnLight}> {item.averageRating.toFixed(1)}</AppText>
          <View style={styles.hCardDot} />
          <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>{item.primaryCuisineType}</AppText>
          {item.latitude && item.longitude && userLocation && (
            <>
              <View style={styles.hCardDot} />
              <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                {calculateDistance(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude).toFixed(1)} mi
              </AppText>
            </>
          )}
        </View>

        {/* Burgundy time slot pills */}
        <View style={styles.hCardSlots}>
          {['17:00', '18:00', '19:00'].map((time, i) => (
            <TouchableOpacity
              key={i}
              style={styles.hCardSlot}
              onPress={() => navigation.navigate('BookingScreen', { restaurant: item, selectedDate: new Date(), partySize })}
            >
              <AppText variant="buttonSmall" color={Colors.white}>{time}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── Cuisine pill — navy circle ────────────────────────────────────────────────
  const renderCuisineItem = ({ item }: { item: CuisineStat }) => (
    <TouchableOpacity style={styles.cuisineItem} onPress={() => handleCuisinePress(item.cuisineType)}>
      <View style={styles.cuisineCircle}>
        <AppText style={styles.cuisineEmoji}>{getCuisineEmoji(item.cuisineType)}</AppText>
      </View>
      <AppText variant="captionMedium" color={Colors.textOnLight} style={styles.cuisineName}>
        {item.cuisineType}
      </AppText>
      <AppText variant="caption" color={Colors.textOnLightSecondary}>{item.count}</AppText>
    </TouchableOpacity>
  );

  // ── Top restaurants row ───────────────────────────────────────────────────────
  const renderTopRestaurant = (restaurant: Restaurant, index: number) => (
    <TouchableOpacity
      key={restaurant.id}
      style={[
        styles.topItem,
        index === topRestaurants.length - 1 && { borderBottomWidth: 0 },
      ]}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant, partySize, selectedDate, selectedTime })}
      activeOpacity={0.8}
    >
      {/* Rank pill — navy filled */}
      <View style={styles.rankBadge}>
        <AppText variant="captionMedium" color={Colors.white}>{index + 1}</AppText>
      </View>

      {/* Thumbnail — larger, rounded */}
      <CachedImage uri={restaurant.coverImageUrl || null} style={styles.topThumb} fallbackColor="#cdd8e0" />

      {/* Main info */}
      <View style={styles.topInfo}>
        {/* Name — Merriweather bold, navy, same as RestaurantCard */}
        <AppText variant="cardTitle" color={NAVY} numberOfLines={1} style={styles.topName}>
          {restaurant.name}
        </AppText>

        {/* Rating row — mirrors RestaurantCard ratingRow */}
        <View style={styles.topRatingRow}>
          <AppText style={styles.topStars}>
            {'★'.repeat(Math.floor(restaurant.averageRating))}
          </AppText>
          <AppText variant="bodySemiBold" color={Colors.textOnLight} style={styles.topRatingValue}>
            {restaurant.averageRating.toFixed(1)}
          </AppText>
          <AppText variant="caption" color={Colors.textOnLightTertiary} style={styles.topRatingReviews}>
            ({restaurant.totalReviews})
          </AppText>
        </View>

        {/* Cuisine + distance — caption, matches card address row style */}
        <View style={styles.topMeta}>
          <AppText variant="caption" color={Colors.textOnLightSecondary}>
            {restaurant.primaryCuisineType}
          </AppText>
          {restaurant.latitude && restaurant.longitude && userLocation && (
            <>
              <View style={styles.topMetaDot} />
              <AppText variant="caption" color={Colors.textOnLightSecondary}>
                {calculateDistance(userLocation.latitude, userLocation.longitude, restaurant.latitude, restaurant.longitude).toFixed(1)} mi
              </AppText>
            </>
          )}
        </View>
      </View>

      {/* Right: price + fav */}
      <View style={styles.topRight}>
        <View style={styles.topPricePill}>
          <AppText variant="captionMedium" color={NAVY}>{restaurant.priceRange || '$$'}</AppText>
        </View>
        <FavoriteButton restaurantId={restaurant.id} size="small" style={styles.topSaveButton} />
      </View>
    </TouchableOpacity>
  );

  // ── States ────────────────────────────────────────────────────────────────────
  if (locationLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={NAVY} />
        <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginTop: Spacing['4'] }}>
          Getting your location...
        </AppText>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.centerContainer}>
        <AppText variant="h3" color={NAVY} style={{ marginBottom: Spacing['2'] }}>
          Location Unavailable
        </AppText>
        <AppText variant="body" color={Colors.textOnLightSecondary} style={{ textAlign: 'center', marginBottom: Spacing['6'] }}>
          We need your location to show nearby restaurants.
        </AppText>
        <AppButton label="Try Again" onPress={refreshLocation} />
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Header — navy brand block ── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <AppText variant="h3" color={Colors.white}>Discover</AppText>
            <View style={styles.locationRow}>
              {isUsingDefault && (
                <AppText variant="caption" color={Colors.warning} style={styles.defaultBadge}>Default</AppText>
              )}
              <AppText style={styles.pinIcon}>📍</AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.75)">{locationName}</AppText>
            </View>
          </View>
        </View>

        {/* ── Party / time selector — on cream ── */}
        <TouchableOpacity style={styles.selectorCard} onPress={() => setShowPickerModal(true)} activeOpacity={0.85}>
          {/* Navy left accent strip */}
          <View style={styles.selectorAccent} />
          <View style={styles.selectorLeft}>
            <AppText style={styles.selectorIcon}>👥</AppText>
            <AppText variant="bodyMedium" color={Colors.textOnLight} numberOfLines={1}>
              {formatPartyDateTime(partySize, selectedDate, selectedTime)}
            </AppText>
          </View>
          <AppText variant="captionMedium" color={Colors.accent}>Change</AppText>
        </TouchableOpacity>

        {/* ── Radius selector ── */}
        <View style={styles.radiusSection}>
          <View style={styles.radiusHeader}>
            <AppText variant="bodyMedium" color={Colors.textOnLightSecondary}>Search Radius</AppText>
            <AppText variant="bodySemiBold" color={NAVY}>{searchRadius}km</AppText>
          </View>
          <View style={styles.radiusButtons}>
            {[5, 10, 20, 50].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusButton, searchRadius === r && styles.radiusButtonActive]}
                onPress={() => setSearchRadius(r)}
              >
                <AppText
                  variant="buttonSmall"
                  color={searchRadius === r ? Colors.white : Colors.textOnLightSecondary}
                >
                  {r}km
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Nearby ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            {/* Navy left tick on section titles */}
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTick} />
              <AppText variant="sectionTitle" color={NAVY}>Nearby</AppText>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('NearbyRestaurants', {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              radius: searchRadius })}>
              <AppText variant="bodyMedium" color={Colors.accent}>View more →</AppText>
            </TouchableOpacity>
          </View>

          {loadingNearby ? (
            <ActivityIndicator size="large" color={NAVY} style={styles.loader} />
          ) : nearbyRestaurants.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyIcon}>📍</AppText>
              <AppText variant="bodyMedium" color={Colors.textOnLight}>No restaurants found nearby</AppText>
              <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.emptySubtext}>
                Try using the search to explore other areas
              </AppText>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={nearbyRestaurants}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.hList}
              renderItem={renderHorizontalCard}
            />
          )}
        </View>

        {/* ── Browse by cuisine ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTick} />
              <AppText variant="sectionTitle" color={NAVY}>Browse by cuisine</AppText>
            </View>
          </View>
          {loadingCuisines ? (
            <ActivityIndicator size="large" color={NAVY} style={styles.loader} />
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={cuisines}
              renderItem={renderCuisineItem}
              keyExtractor={(item) => item.cuisineType}
              contentContainerStyle={styles.hList}
            />
          )}
        </View>

        {/* ── Featured ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTick} />
              <AppText variant="sectionTitle" color={NAVY}>Featured</AppText>
            </View>
            <TouchableOpacity onPress={() => void refetchFeatured()}>
              <AppText variant="bodyMedium" color={Colors.accent}>Refresh</AppText>
            </TouchableOpacity>
          </View>
          {loadingFeatured ? (
            <ActivityIndicator size="large" color={NAVY} style={styles.loader} />
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredRestaurants}
              renderItem={renderHorizontalCard}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.hList}
            />
          )}
        </View>

        {/* ── Top this week ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTick} />
              <AppText variant="sectionTitle" color={NAVY}>Top this week</AppText>
            </View>
          </View>
          <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.sectionSubtitle}>
            What's popular with other diners, updated weekly.
          </AppText>

          {/* Category tabs — navy active */}
          <View style={styles.tabRow}>
            {([TopCategory.BOOKED, TopCategory.VIEWED, TopCategory.SAVED] as TopCategory[]).map((cat) => {
              const label = cat === TopCategory.BOOKED ? 'Top booked' : cat === TopCategory.VIEWED ? 'Top viewed' : 'Top saved';
              const active = activeTopCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setActiveTopCategory(cat)}
                >
                  <AppText variant="bodyMedium" color={active ? Colors.white : Colors.textOnLightSecondary}>
                    {label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {loadingTop ? (
            <ActivityIndicator size="large" color={NAVY} style={styles.loader} />
          ) : (
            <View style={styles.topList}>
              {topRestaurants.map((r, i) => renderTopRestaurant(r, i))}
            </View>
          )}
        </View>

        <View style={{ height: Spacing['8'] }} />
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
  // ── Screen ────────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground },
  scrollContent: {
    paddingBottom: Spacing['6'] },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.appBackground,
    padding: Spacing['5'] },

  // ── Header — NAVY brand block ─────────────────────────────────────────────────
  header: {
    backgroundColor: NAVY,
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['2'],
    paddingBottom: Spacing['2'] },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: r(2),
    gap: Spacing['1'] },
  pinIcon: { fontSize: FontSize.xs },
  defaultBadge: {
    marginRight: r(6) },

  // ── Party selector ────────────────────────────────────────────────────────────
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing['5'],
    marginTop: Spacing['4'],
    marginBottom: Spacing['3'],
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    shadowColor: '#1a2e3b',
    shadowOffset: { width: r(0), height: r(2) },
    shadowOpacity: 0.07,
    shadowRadius: r(6),
    elevation: r(2) },
  selectorAccent: {
    position: 'absolute',
    left: Spacing['0'],
    top: Spacing['0'],
    bottom: Spacing['0'],
    width: r(4),
    backgroundColor: NAVY,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    flex: 1,
    paddingLeft: Spacing['2'] },
  selectorIcon: { fontSize: FontSize.lg },

  // ── Radius ────────────────────────────────────────────────────────────────────
  radiusSection: {
    marginHorizontal: Spacing['5'],
    marginBottom: Spacing['5'],
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing['4'],
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#1a2e3b',
    shadowOffset: { width: r(0), height: r(2) },
    shadowOpacity: 0.07,
    shadowRadius: r(6),
    elevation: r(2) },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing['3'] },
  radiusButtons: {
    flexDirection: 'row',
    gap: Spacing['2'] },
  radiusButton: {
    flex: 1,
    paddingVertical: Spacing['2'],
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.white },
  radiusButtonActive: {
    // Navy for radius — distinguishes from burgundy CTAs
    backgroundColor: NAVY,
    borderColor: NAVY },

  // ── Section ───────────────────────────────────────────────────────────────────
  section: {
    marginBottom: Spacing['8'] },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['4'] },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'] },
  // Small navy vertical tick to the left of every section title
  sectionTick: {
    width: r(3),
    height: r(20),
    backgroundColor: NAVY,
    borderRadius: r(2) },
  sectionSubtitle: {
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['4'],
    marginTop: -Spacing['2'] },
  loader: { marginVertical: Spacing['5'] },
  hList: {
    paddingHorizontal: Spacing['5'],
    gap: Spacing['4'] },

  // ── Horizontal card ───────────────────────────────────────────────────────────
  hCard: {
    width: width * 0.72,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#1a2e3b',
    shadowOffset: { width: r(0), height: r(3) },
    shadowOpacity: 0.1,
    shadowRadius: r(10),
    elevation: r(4) },
  hCardImageWrap: {
    height: Math.round(width * 0.32),
    position: 'relative' },
  hCardImage: {
    width: '100%',
    height: '100%' },
  hCardPriceBadge: {
    position: 'absolute',
    top: r(10),
    left: Spacing['3'],
    // Navy badge on image
    backgroundColor: `${NAVY}CC`,   // navy at 80% opacity
    paddingHorizontal: Spacing['2'],
    paddingVertical: r(3),
    borderRadius: Radius.full },
  hCardFav: {
    position: 'absolute',
    top: Spacing['2'],
    right: Spacing['2'] },
  hCardInfo: {
    paddingHorizontal: r(12),
    paddingTop: r(10),
    paddingBottom: r(12),
    backgroundColor: Colors.cardBackground },
  hCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    marginBottom: r(3) },
  // Thin navy left accent bar beside the name in horizontal cards
  hCardNavyAccent: {
    width: r(3),
    height: r(18),
    backgroundColor: NAVY,
    borderRadius: r(2) },
  hCardName: {
    flex: 1,
    fontSize: FontSize.md,
  },
  hCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: r(12) },
  hCardStar: {
    color: Colors.star,
    fontSize: FontSize.sm },
  hCardDot: {
    width: r(3),
    height: r(3),
    borderRadius: r(2),
    backgroundColor: Colors.cardBorder,
    marginHorizontal: r(5) },
  hCardSlots: {
    flexDirection: 'row',
    gap: r(8) },
  hCardSlot: {
    backgroundColor: Colors.accent,   // Burgundy CTA slots
    paddingHorizontal: r(12),
    paddingVertical: r(6),
    borderRadius: Radius.md },

  // ── Cuisine circles ───────────────────────────────────────────────────────────
  cuisineItem: {
    alignItems: 'center',
    width: r(76) },
  cuisineCircle: {
    width: r(64),
    height: r(64),
    borderRadius: Radius.full,
    backgroundColor: Colors.white,    // White — emoji shows naturally
    borderWidth: 2,
    borderColor: `${NAVY}30`,         // Subtle navy ring
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2'],
    shadowColor: NAVY,
    shadowOffset: { width: r(0), height: r(2) },
    shadowOpacity: 0.08,
    shadowRadius: r(4),
    elevation: r(2) },
  cuisineEmoji: { fontSize: FontSize['4xl'] },
  cuisineName: {
    textAlign: 'center',
    marginBottom: r(2) },

  // ── Category tabs — navy active ───────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['4'],
    gap: Spacing['2'] },
  tab: {
    paddingVertical: Spacing['2'],
    paddingHorizontal: Spacing['3'],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.cardBackground },
  tabActive: {
    backgroundColor: NAVY,            // Navy active tab
    borderColor: NAVY },

  // ── Top restaurants list ──────────────────────────────────────────────────────
  topList: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing['5'],
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    shadowColor: '#1a2e3b',
    shadowOffset: { width: r(0), height: r(2) },
    shadowOpacity: 0.07,
    shadowRadius: r(8),
    elevation: r(3) },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing['3'] },
  // Filled navy pill for rank number
  rankBadge: {
    width: r(24),
    height: r(24),
    borderRadius: Radius.full,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0 },
  topThumb: {
    width: r(64),
    height: r(64),
    borderRadius: Radius.lg,
    flexShrink: 0 },
  topInfo: {
    flex: 1,
    gap: r(3),
    minWidth: 0,  // allows text truncation
  },
  topName: {
    fontSize: FontSize.base,   // Scale cardTitle (18px) down for compact list row
    marginBottom: r(1) },
  topRatingRow: {
    flexDirection: 'row',
    alignItems: 'center' },
  topStars: {
    color: Colors.star,
    fontSize: FontSize.xs,
    letterSpacing: 0.5 },
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center' },
  topMetaDot: {
    width: r(3),
    height: r(3),
    borderRadius: r(2),
    backgroundColor: Colors.textOnLightTertiary,
    marginHorizontal: r(5) },
  topRight: {
    alignItems: 'flex-end',
    gap: Spacing['2'],
    flexShrink: 0 },
  // Subtle pill for price — navy text on cream bg
  topPricePill: {
    backgroundColor: 'rgba(15, 51, 70, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(15, 51, 70, 0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing['2'],
    paddingVertical: r(3) },
  topSaveButton: {
    width: r(28),
    height: r(28),
    justifyContent: 'center',
    alignItems: 'center' },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['10'],
    paddingHorizontal: Spacing['5'] },
  emptyIcon: {
    fontSize: FontSize['6xl'],
    marginBottom: Spacing['3'] },
  topRatingValue: {
    marginLeft: r(4) },
  topRatingReviews: {
    marginLeft: r(3) },
  emptySubtext: {
    marginTop: Spacing['1'],
    textAlign: 'center' } });

export default RestaurantListScreen;




