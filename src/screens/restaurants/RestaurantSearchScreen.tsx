import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Image,
    Dimensions,
    Animated,
    Easing,
    Keyboard,
    Alert,
    ListRenderItemInfo
} from "react-native";
import MapView, { Marker, Region, MapPressEvent } from "react-native-maps";
import { restaurantService } from "../../services/api";
import { mapRestaurantDetailToRestaurant, Restaurant } from "../../types";
import { useNavigation } from "@react-navigation/native";
import { useLocation } from "../../hooks/useLocation";
import { SearchScreenNavigationProp } from "../../navigation/AppNavigator";

const { height } = Dimensions.get("window");

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

    // Search state
    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const mapRef = useRef<MapView | null>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const showPreview = () => {
        Animated.timing(slideAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start();
    };

    const hidePreview = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => setSelectedRestaurant(null));
    };

    const searchLocation = async (query: string) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        try {
            setSearchLoading(true);

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `format=json&` +
                `q=${encodeURIComponent(query)}&` +
                `limit=8&` +
                `addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'DineEaseApp/1.0'
                    }
                }
            );

            const data = await response.json();

            const formatted: SearchResult[] = data.map((item: any) => ({
                lat: item.lat,
                lon: item.lon,
                display_name: item.display_name
            }));

            setSearchResults(formatted);
            setShowResults(formatted.length > 0);
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert('Search Error', 'Failed to search location. Please try again.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSearchChange = (text: string) => {
        setSearchText(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (text.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        searchTimeout.current = setTimeout(() => {
            searchLocation(text);
        }, 500);
    };

    const goToCurrentLocation = () => {
        if (location) {
            const region = {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            };
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

        const newRegion: Region = {
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        };

        setSearchPin({ latitude, longitude });
        setCurrentRegion(newRegion);

        if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
        }

        const displayName = result.display_name.split(',').slice(0, 2).join(',');
        setSearchText(displayName);
        setShowResults(false);
        Keyboard.dismiss();

        await loadRestaurants(latitude, longitude);
    };

    const handleMapLongPress = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;

        setSearchPin({ latitude, longitude });

        const newRegion: Region = {
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        };

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
                Alert.alert(
                    'No Restaurants Found',
                    `No restaurants found within ${radius}km. Try increasing the search radius or searching a different location.`,
                    [{ text: 'OK' }]
                );
                return;
            }

            const mapped: Restaurant[] = res.restaurants.map((r) => ({
                ...mapRestaurantDetailToRestaurant(r),
                distance: calculateDistance(lat, lng, r.latitude, r.longitude),
                openNow: r.isActive,
                mapCoordinate: {
                    latitude: r.latitude || 0,
                    longitude: r.longitude || 0,
                },
            }));

            setRestaurants(mapped);
        } catch (error) {
            console.error("Failed loading restaurants:", error);
            Alert.alert('Error', 'Failed to load restaurants. Please try again.');
            setRestaurants([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number | null, lon2: number | null): number => {
        if (lat2 === null || lon2 === null) return 0;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        if (!location) return;

        const initialRegion = {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        };

        setCurrentRegion(initialRegion);
        loadRestaurants(location.latitude, location.longitude);
    }, [location]);

    if (locationLoading || !location) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
        );
    }

    const handleMarkerPress = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        if (restaurant.mapCoordinate) {
            mapRef.current?.animateToRegion(
                {
                    ...restaurant.mapCoordinate,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                },
                300
            );
        }
        showPreview();
    };

    const handleListItemPress = (restaurant: Restaurant) => {
        handleMarkerPress(restaurant);
    };

    const renderRestaurantItem = ({ item }: ListRenderItemInfo<Restaurant>) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleListItemPress(item)}
        >
            <Image
                source={{ uri: item.coverImageUrl || 'https://via.placeholder.com/120' }}
                style={styles.cardImage}
            />

            <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardCuisine}>{item.cuisineType}</Text>

                <View style={styles.row}>
                    <Text style={styles.ratingStar}>★</Text>
                    <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
                    <Text style={styles.reviewCount}>({item.totalReviews})</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.distanceText}>
                        {item.distance?.toFixed(1)} km
                    </Text>
                </View>

                <Text style={styles.address} numberOfLines={1}>{item.address}</Text>

                <Text
                    style={[
                        styles.openNow,
                        item.openNow ? styles.open : styles.closed,
                    ]}
                >
                    {item.openNow ? "Open" : "Closed"}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* SEARCH BAR */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search any city or country..."
                        value={searchText}
                        onChangeText={handleSearchChange}
                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                        returnKeyType="search"
                        placeholderTextColor="#999"
                    />
                    {searchLoading && (
                        <ActivityIndicator size="small" color="#007AFF" />
                    )}
                    {searchText.length > 0 && !searchLoading && (
                        <TouchableOpacity
                            onPress={() => {
                                setSearchText('');
                                setSearchResults([]);
                                setShowResults(false);
                            }}
                            style={styles.clearButton}
                        >
                            <Text style={styles.clearButtonText}>✕</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.searchHereButton}
                        onPress={() => {
                            if (currentRegion) {
                                setSearchPin({
                                    latitude: currentRegion.latitude,
                                    longitude: currentRegion.longitude,
                                });
                                loadRestaurants(currentRegion.latitude, currentRegion.longitude);
                                setSearchText('Current map location');
                                setShowResults(false);
                                Keyboard.dismiss();
                            }
                        }}
                    >
                        <Text style={styles.searchHereIcon}>📍</Text>
                    </TouchableOpacity>
                </View>

                {/* RADIUS SELECTOR */}
                <View style={styles.radiusContainer}>
                    <Text style={styles.radiusLabel}>Radius:</Text>
                    <View style={styles.radiusButtons}>
                        {[5, 10, 20, 50].map((radius) => (
                            <TouchableOpacity
                                key={radius}
                                style={[
                                    styles.radiusButton,
                                    searchRadius === radius && styles.radiusButtonActive
                                ]}
                                onPress={() => {
                                    setSearchRadius(radius);
                                    if (currentRegion) {
                                        // Pass the new radius directly
                                        loadRestaurants(currentRegion.latitude, currentRegion.longitude, radius);
                                    }
                                }}
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

                {/* SEARCH RESULTS DROPDOWN */}
                {showResults && searchResults.length > 0 && (
                    <View style={styles.searchResultsContainer}>
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item, index) => `search-${index}-${item.lat}-${item.lon}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.searchResultItem}
                                    onPress={() => handleSearchResultSelect(item)}
                                >
                                    <Text style={styles.searchResultIcon}>📍</Text>
                                    <View style={styles.searchResultTextContainer}>
                                        <Text style={styles.searchResultName}>
                                            {item.display_name.split(',')[0]}
                                        </Text>
                                        <Text style={styles.searchResultAddress} numberOfLines={2}>
                                            {item.display_name}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            style={styles.searchResultsList}
                            nestedScrollEnabled={true}
                        />
                    </View>
                )}
            </View>

            {/* MAP */}
            {currentRegion && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={currentRegion}
                    region={currentRegion}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    onRegionChangeComplete={(region) => {
                        setCurrentRegion(region);
                    }}
                    onLongPress={handleMapLongPress}
                >
                    {/* Search Pin */}
                    {searchPin && (
                        <Marker
                            coordinate={searchPin}
                            pinColor="red"
                            title="Search Location"
                            description="Tap and hold on map to move"
                        >
                            <View style={styles.searchPinContainer}>
                                <View style={styles.searchPin}>
                                    <Text style={styles.searchPinText}>📍</Text>
                                </View>
                                <View style={styles.searchPinShadow} />
                            </View>
                        </Marker>
                    )}

                    {/* Restaurant markers */}
                    {restaurants.filter(r => r.mapCoordinate).map((r) => (
                        <Marker
                            key={r.id}
                            coordinate={r.mapCoordinate!}
                            onPress={() => handleMarkerPress(r)}
                        >
                            <View
                                style={[
                                    styles.marker,
                                    selectedRestaurant?.id === r.id && styles.selectedMarker,
                                ]}
                            >
                                <Text style={[
                                    styles.markerText,
                                    selectedRestaurant?.id === r.id && styles.selectedMarkerText
                                ]}>
                                    {r.priceRange || "$$"}
                                </Text>
                            </View>
                        </Marker>
                    ))}
                </MapView>
            )}

            {/* Floating home button */}
            <TouchableOpacity
                style={styles.floatingHomeButton}
                onPress={goToCurrentLocation}
            >
                <Text style={styles.floatingHomeIcon}>🏠</Text>
            </TouchableOpacity>

            {/* Instruction banner */}
            <View style={styles.instructionContainer}>
                <Text style={styles.instructionText}>
                    💡 Long press map to drop pin • 📍 Search here • 🏠 Go home • Radius: {searchRadius}km
                </Text>
            </View>

            {/* RESTAURANT LIST */}
            <View style={styles.listContainer}>
                <View style={styles.listHeader}>
                    <Text style={styles.resultsText}>
                        {restaurants.length} restaurants ({searchRadius}km)
                    </Text>
                    {currentRegion && (
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={() => {
                                loadRestaurants(currentRegion.latitude, currentRegion.longitude);
                            }}
                        >
                            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#dc3545" style={{marginTop: 20}} />
                ) : restaurants.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            No restaurants found within {searchRadius}km
                        </Text>
                        <Text style={styles.emptyStateSubtext}>
                            Try increasing the search radius or searching a different location
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyStateButton}
                            onPress={goToCurrentLocation}
                        >
                            <Text style={styles.emptyStateButtonText}>🏠 Go to My Location</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={restaurants}
                        renderItem={renderRestaurantItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 200 }}
                    />
                )}
            </View>

            {/* PREVIEW CARD */}
            {selectedRestaurant && (
                <Animated.View
                    style={[
                        styles.previewCard,
                        {
                            transform: [
                                {
                                    translateY: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [300, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <TouchableOpacity
                        onPress={hidePreview}
                        style={styles.closeButton}
                    >
                        <Text style={{ fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>

                    <Image
                        source={{ uri: selectedRestaurant.coverImageUrl || 'https://via.placeholder.com/400' }}
                        style={styles.previewImage}
                    />

                    <View style={styles.previewContent}>
                        <Text style={styles.previewTitle}>{selectedRestaurant.name}</Text>
                        <Text style={styles.previewSubtitle}>
                            {selectedRestaurant.cuisineType} • {selectedRestaurant.averageRating.toFixed(1)}★
                        </Text>
                        <Text style={styles.previewDistance}>
                            {selectedRestaurant.distance?.toFixed(1)} km away
                        </Text>

                        <TouchableOpacity
                            style={styles.previewButton}
                            onPress={() => {
                                hidePreview();
                                navigation.navigate("RestaurantDetail", { restaurant: selectedRestaurant });
                            }}
                        >
                            <Text style={styles.previewButtonText}>View Restaurant</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

export default RestaurantSearchScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },

    // SEARCH STYLES
    searchContainer: {
        backgroundColor: "#fff",
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
        borderRadius: 10,
        margin: 10,
        marginBottom: 5,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 4,
        marginLeft: 4,
    },
    clearButtonText: {
        fontSize: 16,
        color: '#666',
    },
    searchHereButton: {
        padding: 4,
        marginLeft: 8,
        // backgroundColor: '#FF3B30',
        borderRadius: 6,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchHereIcon: {
        fontSize: 16,
    },

    // RADIUS SELECTOR
    radiusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 10,
        backgroundColor: '#fff',
    },
    radiusLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginRight: 10,
    },
    radiusButtons: {
        flexDirection: 'row',
        flex: 1,
        gap: 8,
    },
    radiusButton: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#f1f1f1',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    radiusButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    radiusButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    radiusButtonTextActive: {
        color: '#fff',
    },

    // SEARCH RESULTS DROPDOWN
    searchResultsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 10,
        maxHeight: 300,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    searchResultsList: {
        borderRadius: 10,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchResultIcon: {
        fontSize: 18,
        marginRight: 12,
    },
    searchResultTextContainer: {
        flex: 1,
    },
    searchResultName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    searchResultAddress: {
        fontSize: 13,
        color: '#666',
    },

    // MAP
    map: {
        height: height * 0.45,
        width: "100%",
    },

    // FLOATING HOME BUTTON
    floatingHomeButton: {
        position: 'absolute',
        right: 16,
        top: height * 0.45 - 60,
        backgroundColor: '#007AFF',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 5,
    },
    floatingHomeIcon: {
        fontSize: 24,
    },

    // INSTRUCTION BANNER
    instructionContainer: {
        backgroundColor: '#FFF9E6',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#FFE4A3',
    },
    instructionText: {
        fontSize: 11,
        color: '#996515',
        textAlign: 'center',
        fontWeight: '500',
    },

    // SEARCH PIN
    searchPinContainer: {
        alignItems: 'center',
    },
    searchPin: {
        width: 40,
        height: 40,
        borderRadius: 20,
        // backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    searchPinText: {
        fontSize: 24,
    },
    searchPinShadow: {
        width: 12,
        height: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginTop: 2,
    },

    // RESTAURANT LIST
    listContainer: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    resultsText: {
        fontSize: 16,
        fontWeight: "600",
    },
    refreshButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    refreshButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // EMPTY STATE
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    emptyStateButton: {
        marginTop: 20,
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    emptyStateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // RESTAURANT MARKERS
    marker: {
        backgroundColor: "white",
        borderWidth: 2,
        borderColor: '#007AFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    selectedMarker: {
        backgroundColor: "#007AFF",
        borderColor: "#003f7f",
    },
    markerText: {
        fontSize: 12,
        fontWeight: "bold",
        color: '#333',
    },
    selectedMarkerText: {
        color: '#fff',
    },

    // RESTAURANT CARDS
    card: {
        flexDirection: "row",
        marginBottom: 12,
        backgroundColor: "#fff",
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        overflow: "hidden",
    },
    cardImage: {
        width: 120,
        height: 120,
    },
    cardContent: {
        flex: 1,
        padding: 10,
    },
    cardName: { fontSize: 16, fontWeight: "bold", color: '#333' },
    cardCuisine: { color: "#666", fontSize: 14, marginTop: 2 },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 6,
    },
    ratingStar: { color: "#FFD700", fontSize: 14 },
    ratingText: { marginLeft: 4, fontWeight: "600", color: '#333' },
    reviewCount: { marginLeft: 4, color: "#777", fontSize: 12 },
    dot: { marginHorizontal: 6, color: "#777" },
    distanceText: { color: "#555", fontSize: 12 },
    address: { color: "#666", fontSize: 12, marginTop: 2 },
    openNow: {
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: "flex-start",
        fontSize: 11,
        fontWeight: "bold",
    },
    open: { backgroundColor: "#D4EDDA", color: "#155724" },
    closed: { backgroundColor: "#F8D7DA", color: "#721C24" },

    // PREVIEW CARD
    previewCard: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        padding: 15,
        elevation: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    previewImage: {
        width: "100%",
        height: 140,
        borderRadius: 12,
        marginBottom: 12,
    },
    previewContent: { paddingHorizontal: 5 },
    previewTitle: { fontSize: 20, fontWeight: "bold", color: '#333' },
    previewSubtitle: { color: "#666", marginTop: 4, fontSize: 14 },
    previewDistance: { marginTop: 4, color: "#555", fontSize: 13 },
    previewButton: {
        marginTop: 12,
        backgroundColor: "#007AFF",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    previewButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    closeButton: {
        position: "absolute",
        top: 15,
        right: 15,
        backgroundColor: "#fff",
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
});