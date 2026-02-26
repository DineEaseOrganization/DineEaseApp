import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Keyboard,
    ListRenderItemInfo,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import { restaurantService } from '../../services/api';
import { mapRestaurantDetailToRestaurant, Restaurant } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { useLocation } from '../../hooks/useLocation';
import { SearchScreenNavigationProp } from '../../navigation/AppNavigator';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';
import { CachedImage } from '../../components/CachedImage';

const { height } = Dimensions.get("window");
const NAVY = Colors.primary;

interface SearchResult {
    lat: string;
    lon: string;
    display_name: string;
}

const RestaurantSearchScreen = () => {
    const navigation = useNavigation<SearchScreenNavigationProp>();
    const { location, loading: locationLoading } = useLocation();

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
    const [searchPin, setSearchPin] = useState<{ latitude: number; longitude: number } | null>(null);
    const [searchRadius, setSearchRadius] = useState(10);

    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const mapRef = useRef<MapView | null>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showPreview = () => {
        Animated.timing(slideAnim, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true }).start();
    };

    const hidePreview = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true }).start(() => setSelectedRestaurant(null));
    };

    const searchLocation = async (query: string) => {
        if (query.length < 3) { setSearchResults([]); return; }
        try {
            setSearchLoading(true);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`,
                { headers: { 'User-Agent': 'DineEaseApp/1.0' } }
            );
            const data = await response.json();
            const formatted: SearchResult[] = data.map((item: any) => ({
                lat: item.lat, lon: item.lon, display_name: item.display_name
            }));
            setSearchResults(formatted);
            setShowResults(formatted.length > 0);
        } catch {
            Alert.alert('Search Error', 'Failed to search location. Please try again.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchText(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (text.length < 3) { setSearchResults([]); setShowResults(false); return; }
        searchTimeout.current = setTimeout(() => searchLocation(text), 500);
    };

    const goToCurrentLocation = () => {
        if (location) {
            const region = { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
            setCurrentRegion(region);
            mapRef.current?.animateToRegion(region, 1000);
            loadRestaurants(location.latitude, location.longitude);
            setSearchText('');
            setSearchResults([]);
            setShowResults(false);
            setSearchPin(null);
        }
    };

    const handleSearchResultSelect = async (result: SearchResult) => {
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        const newRegion: Region = { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setSearchPin({ latitude, longitude });
        setCurrentRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        setSearchText(result.display_name.split(',').slice(0, 2).join(','));
        setShowResults(false);
        Keyboard.dismiss();
        await loadRestaurants(latitude, longitude);
    };

    const handleMapLongPress = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setSearchPin({ latitude, longitude });
        const newRegion: Region = { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setCurrentRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
        await loadRestaurants(latitude, longitude);
        setSearchText('Custom location');
    };

    const loadRestaurants = async (lat: number, lng: number, radius: number = searchRadius) => {
        try {
            setLoading(true);
            const res = await restaurantService.getNearbyRestaurants(lat, lng, radius, 0, 50);
            setRestaurants([]);
            if (res.restaurants.length === 0) {
                Alert.alert('No Restaurants Found', `No restaurants found within ${radius}km. Try increasing the radius.`, [{ text: 'OK' }]);
                return;
            }
            const mapped: Restaurant[] = res.restaurants.map((r) => ({
                ...mapRestaurantDetailToRestaurant(r),
                distance: calculateDistance(lat, lng, r.latitude, r.longitude),
                openNow: r.isActive,
                mapCoordinate: { latitude: r.latitude || 0, longitude: r.longitude || 0 } }));
            setRestaurants(mapped);
        } catch {
            Alert.alert('Error', 'Failed to load restaurants. Please try again.');
            setRestaurants([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number | null, lon2: number | null): number => {
        if (lat2 === null || lon2 === null) return 0;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    useEffect(() => {
        if (!location) return;
        const initialRegion = { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };
        setCurrentRegion(initialRegion);
        loadRestaurants(location.latitude, location.longitude);
    }, [location]);

    if (locationLoading || !location) {
        return (
            <SafeAreaView style={styles.safeContainer}>
                <View style={styles.header}>
                    <AppText variant="h3" color={Colors.white}>Explore</AppText>
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={NAVY} />
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginTop: Spacing['3'] }}>
                        Getting your location...
                    </AppText>
                </View>
            </SafeAreaView>
        );
    }

    const handleMarkerPress = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        if (restaurant.mapCoordinate) {
            mapRef.current?.animateToRegion({ ...restaurant.mapCoordinate, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 300);
        }
        showPreview();
    };

    const renderRestaurantItem = ({ item }: ListRenderItemInfo<Restaurant>) => (
        <TouchableOpacity style={styles.card} onPress={() => handleMarkerPress(item)} activeOpacity={0.88}>
            <CachedImage
                uri={item.coverImageUrl || null}
                style={styles.cardImage}
                fallbackColor="#cdd8e0"
            />
            <View style={styles.cardContent}>
                <AppText variant="cardTitle" color={NAVY} numberOfLines={1} style={styles.cardName}>
                    {item.name}
                </AppText>

                <View style={styles.cardMeta}>
                    <AppText style={styles.ratingStar}>★</AppText>
                    <AppText variant="bodySemiBold" color={Colors.textOnLight}> {item.averageRating.toFixed(1)}</AppText>
                    <AppText variant="caption" color={Colors.textOnLightTertiary}> ({item.totalReviews})</AppText>
                    <View style={styles.dot} />
                    <AppText variant="caption" color={Colors.textOnLightSecondary}>
                        {item.distance?.toFixed(1)} km
                    </AppText>
                </View>

                <AppText variant="caption" color={Colors.textOnLightSecondary} numberOfLines={1}>
                    📍 {item.address}
                </AppText>

                <View style={styles.cardFooter}>
                    {item.cuisineType ? (
                        <AppText variant="caption" color={Colors.textOnLightSecondary}>{item.cuisineType}</AppText>
                    ) : null}
                    <View style={[styles.statusBadge, item.openNow ? styles.openBadge : styles.closedBadge]}>
                        <AppText variant="captionMedium" color={item.openNow ? Colors.success : Colors.error}>
                            {item.openNow ? "Open" : "Closed"}
                        </AppText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.container}>

                {/* ── Navy header ── */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <AppText variant="h3" color={Colors.white}>Explore</AppText>
                    </View>

                    {/* Search input */}
                    <View style={styles.searchInputWrapper}>
                        <AppText style={styles.searchIcon}>🔍</AppText>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search any city or country..."
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={searchText}
                            onChangeText={handleSearchChange}
                            onFocus={() => searchResults.length > 0 && setShowResults(true)}
                            returnKeyType="search"
                        />
                        {searchLoading && <ActivityIndicator size="small" color={Colors.white} />}
                        {searchText.length > 0 && !searchLoading && (
                            <TouchableOpacity
                                onPress={() => { setSearchText(''); setSearchResults([]); setShowResults(false); }}
                                style={styles.clearButton}
                            >
                                <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)">✕</AppText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.locationButton}
                            onPress={() => {
                                if (currentRegion) {
                                    setSearchPin({ latitude: currentRegion.latitude, longitude: currentRegion.longitude });
                                    loadRestaurants(currentRegion.latitude, currentRegion.longitude);
                                    setSearchText('Current map location');
                                    setShowResults(false);
                                    Keyboard.dismiss();
                                }
                            }}
                        >
                            <AppText style={styles.locationIcon}>📍</AppText>
                        </TouchableOpacity>
                    </View>

                    {/* Radius row */}
                    <View style={styles.radiusRow}>
                        <AppText variant="captionMedium" color="rgba(255,255,255,0.65)" style={styles.radiusLabel}>
                            Radius:
                        </AppText>
                        {[5, 10, 20, 50].map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={[styles.radiusChip, searchRadius === r && styles.radiusChipActive]}
                                onPress={() => {
                                    setSearchRadius(r);
                                    if (currentRegion) loadRestaurants(currentRegion.latitude, currentRegion.longitude, r);
                                }}
                            >
                                <AppText
                                    variant="captionMedium"
                                    color={searchRadius === r ? NAVY : 'rgba(255,255,255,0.85)'}
                                >
                                    {r}km
                                </AppText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Search results dropdown */}
                    {showResults && searchResults.length > 0 && (
                        <View style={styles.dropdown}>
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item, i) => `s-${i}-${item.lat}`}
                                nestedScrollEnabled
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSearchResultSelect(item)}>
                                        <AppText style={styles.dropdownPin}>📍</AppText>
                                        <View style={styles.dropdownText}>
                                            <AppText variant="bodyMedium" color={Colors.textOnLight} numberOfLines={1}>
                                                {item.display_name.split(',')[0]}
                                            </AppText>
                                            <AppText variant="caption" color={Colors.textOnLightSecondary} numberOfLines={1}>
                                                {item.display_name}
                                            </AppText>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                style={styles.dropdownList}
                            />
                        </View>
                    )}
                </View>

                {/* ── Map ── */}
                {currentRegion && (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={currentRegion}
                        region={currentRegion}
                        showsUserLocation
                        showsMyLocationButton={false}
                        onRegionChangeComplete={(region) => setCurrentRegion(region)}
                        onLongPress={handleMapLongPress}
                    >
                        {searchPin && (
                            <Marker coordinate={searchPin} title="Search Location">
                                <View style={styles.searchPinMarker}>
                                    <AppText style={styles.searchPinIcon}>📍</AppText>
                                </View>
                            </Marker>
                        )}

                        {restaurants.filter(r => r.mapCoordinate).map((r) => (
                            <Marker key={r.id} coordinate={r.mapCoordinate!} onPress={() => handleMarkerPress(r)}>
                                <View style={[styles.marker, selectedRestaurant?.id === r.id && styles.markerSelected]}>
                                    <AppText
                                        variant="captionMedium"
                                        color={selectedRestaurant?.id === r.id ? Colors.white : NAVY}
                                    >
                                        {r.priceRange || "$$"}
                                    </AppText>
                                </View>
                            </Marker>
                        ))}
                    </MapView>
                )}

                {/* ── Home button ── */}
                <TouchableOpacity style={styles.homeButton} onPress={goToCurrentLocation}>
                    <AppText style={styles.homeIcon}>🏠</AppText>
                </TouchableOpacity>

                {/* ── Instruction bar ── */}
                <View style={styles.instructionBar}>
                    <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.instructionText}>
                        Long press map to drop pin · Radius: {searchRadius}km
                    </AppText>
                </View>

                {/* ── Restaurant list ── */}
                <View style={styles.listContainer}>
                    <View style={styles.listHeader}>
                        <View style={styles.sectionTick} />
                        <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                            {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} found
                        </AppText>
                        {currentRegion && (
                            <TouchableOpacity
                                style={styles.refreshButton}
                                onPress={() => loadRestaurants(currentRegion.latitude, currentRegion.longitude)}
                            >
                                <AppText variant="captionMedium" color={Colors.white}>🔄 Refresh</AppText>
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={NAVY} />
                            <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginTop: Spacing['3'] }}>
                                Finding restaurants...
                            </AppText>
                        </View>
                    ) : restaurants.length === 0 ? (
                        <View style={styles.emptyState}>
                            <AppText style={styles.emptyIcon}>🍽️</AppText>
                            <AppText variant="sectionTitle" color={NAVY} style={styles.emptyTitle}>No restaurants found</AppText>
                            <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.emptySubtitle}>
                                Try increasing the radius or searching a different location
                            </AppText>
                            <TouchableOpacity style={styles.goHomeButton} onPress={goToCurrentLocation}>
                                <AppText variant="captionMedium" color={Colors.white}>🏠 My Location</AppText>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={restaurants}
                            renderItem={renderRestaurantItem}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </View>

                {/* ── Preview panel ── */}
                {selectedRestaurant && (
                    <Animated.View
                        style={[
                            styles.previewPanel,
                            {
                                transform: [{
                                    translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [320, 0] })
                                }]
                            }
                        ]}
                    >
                        <TouchableOpacity onPress={hidePreview} style={styles.closeButton}>
                            <AppText variant="bodyMedium" color={Colors.textOnLight}>✕</AppText>
                        </TouchableOpacity>

                        <CachedImage
                            uri={selectedRestaurant.coverImageUrl || null}
                            style={styles.previewImage}
                            fallbackColor="#cdd8e0"
                        />

                        <View style={styles.previewContent}>
                            <AppText variant="cardTitle" color={NAVY} style={styles.previewTitle}>
                                {selectedRestaurant.name}
                            </AppText>
                            <AppText variant="caption" color={Colors.textOnLightSecondary}>
                                {selectedRestaurant.cuisineType} · {selectedRestaurant.averageRating.toFixed(1)}★ · {selectedRestaurant.distance?.toFixed(1)} km away
                            </AppText>

                            <TouchableOpacity
                                style={styles.previewButton}
                                onPress={() => {
                                    hidePreview();
                                    navigation.navigate("RestaurantDetail", { restaurant: selectedRestaurant });
                                }}
                            >
                                <AppText variant="button" color={Colors.white}>View Restaurant</AppText>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}
            </View>
        </SafeAreaView>
    );
};

export default RestaurantSearchScreen;

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: NAVY },
    container: {
        flex: 1,
        backgroundColor: Colors.appBackground },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing['5'] },

    // ── Navy header ───────────────────────────────────────────────────────────
    header: {
        backgroundColor: NAVY,
        paddingTop: Spacing['3'],
        paddingHorizontal: Spacing['4'],
        paddingBottom: Spacing['3'],
        zIndex: 20 },
    headerRow: {
        marginBottom: Spacing['3'] },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing['3'],
        height: r(44),
        marginBottom: Spacing['2'],
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)' },
    searchIcon: {
        fontSize: FontSize.md,
        marginRight: Spacing['2'] },
    searchInput: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.white,
        fontFamily: 'Inter_400Regular' },
    clearButton: {
        padding: Spacing['1'],
        marginLeft: Spacing['1'] },
    locationButton: {
        marginLeft: Spacing['2'],
        padding: Spacing['1'] },

    // ── Radius row ────────────────────────────────────────────────────────────
    radiusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'] },
    radiusLabel: {
        marginRight: Spacing['2'],
    },
    radiusChip: {
        paddingVertical: Spacing['1'],
        paddingHorizontal: r(10),
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)' },
    radiusChipActive: {
        backgroundColor: Colors.white,
        borderColor: Colors.white },

    // ── Dropdown ──────────────────────────────────────────────────────────────
    dropdown: {
        backgroundColor: Colors.white,
        marginTop: Spacing['2'],
        borderRadius: Radius.lg,
        shadowColor: '#000',
        shadowOffset: { width: r(0), height: r(4) },
        shadowOpacity: 0.15,
        shadowRadius: r(12),
        elevation: r(8),
        maxHeight: r(280) },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing['3'],
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
        gap: Spacing['2'] },
    dropdownPin: {
        fontSize: FontSize.lg },
    dropdownText: {
        flex: 1,
    },
    dropdownList: {
        maxHeight: r(260),
        borderRadius: Radius.lg,
    },

    // ── Map ────────────────────────────────────────────────────────────────────
    map: {
        height: height * 0.35,
        width: "100%" },

    // ── Home button ───────────────────────────────────────────────────────────
    homeButton: {
        position: 'absolute',
        right: Spacing['4'],
        top: (height * 0.35) + r(110),
        backgroundColor: Colors.accent,
        width: r(48),
        height: r(48),
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: Colors.accent,
        shadowOffset: { width: r(0), height: r(3) },
        shadowOpacity: 0.35,
        shadowRadius: r(6),
        elevation: r(5) },

    // ── Instruction bar ───────────────────────────────────────────────────────
    instructionBar: {
        backgroundColor: Colors.cardBackground,
        paddingVertical: Spacing['2'],
        paddingHorizontal: Spacing['4'],
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder },

    // ── List container ────────────────────────────────────────────────────────
    listContainer: {
        flex: 1,
        backgroundColor: Colors.appBackground,
        paddingHorizontal: Spacing['4'],
        paddingTop: Spacing['3'] },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['3'] },
    sectionTick: {
        width: r(3),
        height: r(14),
        backgroundColor: NAVY,
        borderRadius: r(2) },
    refreshButton: {
        marginLeft: 'auto',
        backgroundColor: Colors.accent,
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['1'] + r(2),
        borderRadius: Radius.full },

    // ── Empty state ───────────────────────────────────────────────────────────
    emptyState: {
        alignItems: 'center',
        paddingTop: Spacing['10'] },
    goHomeButton: {
        backgroundColor: NAVY,
        paddingHorizontal: Spacing['5'],
        paddingVertical: Spacing['3'],
        borderRadius: Radius.full },

    // ── Map markers ───────────────────────────────────────────────────────────
    marker: {
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing['2'],
        paddingVertical: Spacing['1'],
        borderRadius: Radius.full,
        borderWidth: 2,
        borderColor: NAVY,
        shadowColor: '#000',
        shadowOffset: { width: r(0), height: r(1) },
        shadowOpacity: 0.15,
        shadowRadius: r(3),
        elevation: r(3) },
    markerSelected: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent },
    searchPinMarker: {
        alignItems: 'center' },

    // ── Restaurant card ────────────────────────────────────────────────────────
    card: {
        flexDirection: "row",
        marginBottom: Spacing['3'],
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.xl,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        shadowColor: '#1a2e3b',
        shadowOffset: { width: r(0), height: r(3) },
        shadowOpacity: 0.08,
        shadowRadius: r(10),
        elevation: r(3) },
    cardImage: {
        width: r(108),
        height: r(108) },
    cardContent: {
        flex: 1,
        padding: Spacing['3'],
        justifyContent: 'center',
        gap: Spacing['1'] },
    cardName: {
        fontSize: FontSize.md },
    cardMeta: {
        flexDirection: "row",
        alignItems: "center" },
    ratingStar: {
        color: Colors.star,
        fontSize: FontSize.sm },
    dot: {
        width: r(3),
        height: r(3),
        borderRadius: r(2),
        backgroundColor: Colors.cardBorder,
        marginHorizontal: r(5) },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing['1'] },
    statusBadge: {
        paddingHorizontal: Spacing['2'],
        paddingVertical: r(2),
        borderRadius: Radius.md },
    openBadge: {
        backgroundColor: Colors.successFaded },
    closedBadge: {
        backgroundColor: Colors.errorFaded },

    // ── Preview panel ─────────────────────────────────────────────────────────
    previewPanel: {
        position: "absolute",
        bottom: Spacing['0'],
        left: Spacing['0'],
        right: Spacing['0'],
        backgroundColor: Colors.cardBackground,
        borderTopLeftRadius: Radius['2xl'],
        borderTopRightRadius: Radius['2xl'],
        padding: Spacing['4'],
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: r(0), height: r(-4) },
        shadowOpacity: 0.10,
        shadowRadius: r(16),
        elevation: r(10) },
    closeButton: {
        position: "absolute",
        top: Spacing['4'],
        right: Spacing['4'],
        backgroundColor: Colors.appBackground,
        zIndex: 10,
        padding: Spacing['2'],
        borderRadius: Radius.full,
        width: r(34),
        height: r(34),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.cardBorder },
    previewImage: {
        width: "100%",
        height: r(140),
        borderRadius: Radius.lg,
        marginBottom: Spacing['3'] },
    previewContent: {
        paddingHorizontal: Spacing['1'] },
    previewButton: {
        marginTop: Spacing['4'],
        backgroundColor: Colors.accent,
        padding: Spacing['4'],
        borderRadius: Radius.lg,
        alignItems: "center" },
    locationIcon: {
        fontSize: FontSize.lg,
    },
    searchPinIcon: {
        fontSize: rf(22),
    },
    homeIcon: {
        fontSize: FontSize.xl,
    },
    instructionText: {
        textAlign: 'center',
    },
    emptyIcon: {
        fontSize: rf(40),
        marginBottom: Spacing['3'],
    },
    emptyTitle: {
        marginBottom: Spacing['2'],
    },
    emptySubtitle: {
        textAlign: 'center',
        marginBottom: Spacing['5'],
    },
    listContent: {
        paddingBottom: r(220),
    },
    previewTitle: {
        marginBottom: Spacing['1'],
    } });
