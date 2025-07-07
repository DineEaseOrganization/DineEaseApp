import React, {JSX, useEffect, useState} from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    ImageStyle,
    ListRenderItem,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Restaurant} from "../../types";
import {dummyRestaurants} from "../../data/dummyData";

// Import your existing types

const {width, height} = Dimensions.get('window');

// TypeScript interfaces for the search screen
interface MapRegion {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

interface MapCoordinate {
    latitude: number;
    longitude: number;
}

interface SearchFilters {
    cuisine: string;
    priceRange: string;
    rating: string;
    openNow: boolean;
    distance: number;
}

interface EnhancedRestaurant extends Restaurant {
    mapCoordinate?: MapCoordinate;
    openNow?: boolean;
    distance?: number;
}

interface MapViewProps {
    style: ViewStyle;
    region: MapRegion | null;
    children?: React.ReactNode;
    onPress?: () => void;
}

interface MarkerProps {
    coordinate: MapCoordinate;
    children: React.ReactNode;
    onPress?: () => void;
}

// Mock React Native MapView component for demonstration
const MapView: React.FC<MapViewProps> = ({style, region, children, onPress}) => (
    <View style={[style, {backgroundColor: '#E3F2FD'}]}>
        <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#E8F5E8',
        }}>
            {/* Mock map background with streets */}
            <View style={{
                position: 'absolute',
                top: '30%',
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: '#DDD',
            }}/>
            <View style={{
                position: 'absolute',
                top: '60%',
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: '#DDD',
            }}/>
            <View style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '30%',
                width: 2,
                backgroundColor: '#DDD',
            }}/>
            <View style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '70%',
                width: 2,
                backgroundColor: '#DDD',
            }}/>
            {children}
        </View>
    </View>
);

const Marker: React.FC<MarkerProps> = ({coordinate, children, onPress}) => (
    <TouchableOpacity
        style={{
            position: 'absolute',
            left: `${coordinate.longitude}%`,
            top: `${coordinate.latitude}%`,
            transform: [{translateX: -15}, {translateY: -15}],
        }}
        onPress={onPress}
    >
        {children}
    </TouchableOpacity>
);

interface SearchScreenProps {
    navigation: {
        navigate: (screen: string, params?: any) => void;
    };
}

const SearchScreen: React.FC<SearchScreenProps> = ({navigation}) => {
    const [userLocation, setUserLocation] = useState<MapRegion | null>(null);
    const [searchLocation, setSearchLocation] = useState<string>('');
    const [selectedLocation, setSelectedLocation] = useState<string>('Nearby');
    const [restaurants, setRestaurants] = useState<EnhancedRestaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<EnhancedRestaurant | null>(null);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState<boolean>(false);
    const [mapView, setMapView] = useState<boolean>(true);
    const [filters, setFilters] = useState<SearchFilters>({
        cuisine: '',
        priceRange: '',
        rating: '',
        openNow: false,
        distance: 5
    });

    // Enhanced restaurant data with coordinates for map
    const restaurantsWithCoordinates: EnhancedRestaurant[] = dummyRestaurants.map((restaurant, index) => ({
        ...restaurant,
        // Mock map coordinates for display (in a real app, use actual lat/lng)
        mapCoordinate: {latitude: 25 + index * 10, longitude: 30 + index * 8},
        openNow: index % 2 === 0, // Mock open/closed status
        distance: (index + 1) * 1.2, // Mock distance
    }));

    const locationSuggestions: string[] = [
        "Nicosia, Cyprus",
        "Limassol, Cyprus",
        "Larnaca, Cyprus",
        "Paphos, Cyprus",
        "Ayia Napa, Cyprus",
        "London, UK",
        "Athens, Greece",
        "Istanbul, Turkey"
    ];

    useEffect(() => {
        // Simulate getting user location
        setUserLocation({
            latitude: 35.1676,
            longitude: 33.3736,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        });
        setRestaurants(restaurantsWithCoordinates);
    }, []);

    const handleLocationSearch = (location: string): void => {
        setSelectedLocation(location);
        setSearchLocation(location);
        setShowLocationSuggestions(false);
        // In real app, you'd update map region and fetch restaurants for this location
    };

    const handleRestaurantPress = (restaurant: Restaurant): void => {
        navigation.navigate('RestaurantDetail', {restaurant});
    };

    const renderStars = (rating: number): string => {
        const fullStars = Math.floor(rating);
        const stars = Array(fullStars).fill('★').join('');
        return stars;
    };

    const renderRestaurantCard: ListRenderItem<EnhancedRestaurant> = ({item}) => (
        <TouchableOpacity
            style={styles.restaurantCard}
            onPress={() => handleRestaurantPress(item)}
        >
            <Image source={{uri: item.coverImageUrl}} style={styles.restaurantImage}/>

            <View style={styles.restaurantInfo}>
                <View style={styles.restaurantHeader}>
                    <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.priceRange}>
                        <Text style={styles.priceText}>{item.priceRange}</Text>
                    </View>
                </View>

                <Text style={styles.cuisineType}>{item.cuisineType}</Text>

                <View style={styles.restaurantMeta}>
                    <View style={styles.rating}>
                        <Text style={styles.stars}>{renderStars(item.averageRating)}</Text>
                        <Text style={styles.ratingText}>{item.averageRating}</Text>
                        <Text style={styles.reviewCount}>({item.totalReviews})</Text>
                    </View>

                    <View style={styles.distance}>
                        <Ionicons name="location-outline" size={16} color="#666"/>
                        <Text style={styles.distanceText}>{item.distance?.toFixed(1) || '1.2'} km</Text>
                    </View>
                </View>

                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, {backgroundColor: item.openNow ? '#E7F5E7' : '#FFF0F0'}]}>
                        <Text style={[styles.statusText, {color: item.openNow ? '#2E7D32' : '#D32F2F'}]}>
                            {item.openNow ? 'Open' : 'Closed'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderFilterChip = (title: string, isActive: boolean = false): JSX.Element => (
        <TouchableOpacity style={[styles.filterChip, isActive && styles.activeFilterChip]}>
            <Text style={[styles.filterChipText, isActive && styles.activeFilterChipText]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff"/>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.locationSection}>
                    <View style={styles.locationHeader}>
                        <Ionicons name="location" size={20} color="#007AFF"/>
                        <Text style={styles.locationLabel}>Search location</Text>
                    </View>

                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Enter location..."
                            value={searchLocation}
                            onChangeText={(text) => {
                                setSearchLocation(text);
                                setShowLocationSuggestions(text.length > 2);
                            }}
                        />
                        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon}/>
                    </View>

                    <Text style={styles.selectedLocation}>{selectedLocation}</Text>
                </View>

                {/* Filter chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFilters(true)}
                    >
                        <Ionicons name="options-outline" size={16} color="#333"/>
                        <Text style={styles.filterButtonText}>Filters</Text>
                    </TouchableOpacity>

                    {renderFilterChip('Open now')}
                    {renderFilterChip('Top rated')}
                    {renderFilterChip('Nearby', true)}
                    {renderFilterChip('$-$$')}
                    {renderFilterChip('Mediterranean')}
                </ScrollView>

                {/* View toggle */}
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[styles.toggleButton, mapView && styles.activeToggle]}
                        onPress={() => setMapView(true)}
                    >
                        <Text style={[styles.toggleText, mapView && styles.activeToggleText]}>Map</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, !mapView && styles.activeToggle]}
                        onPress={() => setMapView(false)}
                    >
                        <Text style={[styles.toggleText, !mapView && styles.activeToggleText]}>List</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            {mapView ? (
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        region={userLocation}
                    >
                        {/* User location marker */}
                        <View style={styles.userMarker}>
                            <View style={styles.userMarkerInner}/>
                            <View style={styles.userMarkerPulse}/>
                        </View>

                        {/* Restaurant markers */}
                        {restaurants.map((restaurant) => (
                            <Marker
                                key={restaurant.id}
                                coordinate={restaurant.mapCoordinate || {latitude: 30, longitude: 35}}
                                onPress={() => setSelectedRestaurant(restaurant)}
                            >
                                <View style={[
                                    styles.restaurantMarker,
                                    selectedRestaurant?.id === restaurant.id && styles.selectedMarker
                                ]}>
                                    <Text style={styles.markerText}>{restaurant.priceRange}</Text>
                                </View>
                            </Marker>
                        ))}
                    </MapView>

                    {/* Map controls */}
                    <View style={styles.mapControls}>
                        <TouchableOpacity style={styles.mapControlButton}>
                            <Text style={styles.mapControlText}>+</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mapControlButton}>
                            <Text style={styles.mapControlText}>-</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Locate button */}
                    <TouchableOpacity style={styles.locateButton}>
                        <Ionicons name="navigate" size={24} color="#666"/>
                    </TouchableOpacity>

                    {/* Restaurant list at bottom */}
                    <View style={styles.bottomSheet}>
                        <View style={styles.bottomSheetHandle}/>
                        <Text style={styles.resultsText}>{restaurants.length} restaurants found</Text>
                        <FlatList
                            data={restaurants}
                            renderItem={renderRestaurantCard}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.restaurantList}
                        />
                    </View>
                </View>
            ) : (
                <View style={styles.listContainer}>
                    <View style={styles.listHeader}>
                        <Text style={styles.resultsText}>
                            {restaurants.length} restaurants near {selectedLocation}
                        </Text>
                    </View>
                    <FlatList
                        data={restaurants}
                        renderItem={renderRestaurantCard}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.restaurantList}
                    />
                </View>
            )}

            {/* Location suggestions modal */}
            <Modal
                visible={showLocationSuggestions}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLocationSuggestions(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setShowLocationSuggestions(false)}
                >
                    <View style={styles.suggestionsContainer}>
                        {locationSuggestions
                            .filter(location =>
                                location.toLowerCase().includes(searchLocation.toLowerCase())
                            )
                            .map((location, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => handleLocationSearch(location)}
                                >
                                    <Ionicons name="location-outline" size={20} color="#666"/>
                                    <Text style={styles.suggestionText}>{location}</Text>
                                </TouchableOpacity>
                            ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Restaurant detail modal */}
            <Modal
                visible={selectedRestaurant !== null}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedRestaurant(null)}
            >
                {selectedRestaurant && (
                    <View style={styles.detailModal}>
                        <View style={styles.detailHeader}>
                            <Image
                                source={{uri: selectedRestaurant.coverImageUrl}}
                                style={styles.detailImage}
                            />
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setSelectedRestaurant(null)}
                            >
                                <Ionicons name="close" size={24} color="#fff"/>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.detailContent}>
                            <View style={styles.detailInfo}>
                                <Text style={styles.detailName}>{selectedRestaurant.name}</Text>
                                <Text style={styles.detailCuisine}>{selectedRestaurant.cuisineType}</Text>

                                <View style={styles.detailMeta}>
                                    <View style={styles.detailRating}>
                                        <Text
                                            style={styles.detailStars}>{renderStars(selectedRestaurant.averageRating)}</Text>
                                        <Text style={styles.detailRatingText}>{selectedRestaurant.averageRating}</Text>
                                        <Text
                                            style={styles.detailReviewCount}>({selectedRestaurant.totalReviews} reviews)</Text>
                                    </View>
                                    <Text style={styles.detailPrice}>{selectedRestaurant.priceRange}</Text>
                                </View>

                                <View style={styles.detailStatus}>
                                    <View style={styles.statusItem}>
                                        <Ionicons name="time-outline" size={16} color="#666"/>
                                        <Text style={styles.detailStatusText}>
                                            {selectedRestaurant.openNow ? 'Open now' : 'Closed'}
                                        </Text>
                                    </View>
                                    <View style={styles.statusItem}>
                                        <Ionicons name="location-outline" size={16} color="#666"/>
                                        <Text
                                            style={styles.detailStatusText}>{selectedRestaurant.distance?.toFixed(1) || '1.2'} km
                                            away</Text>
                                    </View>
                                </View>

                                <Text style={styles.detailAddress}>{selectedRestaurant.address}</Text>
                                <Text style={styles.detailDescription}>{selectedRestaurant.description}</Text>
                            </View>
                        </ScrollView>

                        <View style={styles.detailActions}>
                            <TouchableOpacity
                                style={styles.reserveButton}
                                onPress={() => {
                                    setSelectedRestaurant(null);
                                    navigation.navigate('BookingScreen', {
                                        restaurant: selectedRestaurant,
                                        selectedDate: new Date(),
                                        partySize: 2
                                    });
                                }}
                            >
                                <Text style={styles.reserveButtonText}>Reserve a Table</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.menuButton}
                                onPress={() => {
                                    setSelectedRestaurant(null);
                                    navigation.navigate('RestaurantDetail', {restaurant: selectedRestaurant});
                                }}
                            >
                                <Text style={styles.menuButtonText}>View Details</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Modal>

            {/* Filters modal */}
            <Modal
                visible={showFilters}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowFilters(false)}
            >
                <View style={styles.filtersModal}>
                    <View style={styles.filtersHeader}>
                        <Text style={styles.filtersTitle}>Filters</Text>
                        <TouchableOpacity onPress={() => setShowFilters(false)}>
                            <Ionicons name="close" size={24} color="#333"/>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.filtersContent}>
                        {/* Cuisine filter */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Cuisine Type</Text>
                            <View style={styles.filterOptions}>
                                {['All', 'Mediterranean', 'Greek', 'Japanese', 'British'].map((cuisine) => (
                                    <TouchableOpacity
                                        key={cuisine}
                                        style={[
                                            styles.filterOption,
                                            filters.cuisine === cuisine && styles.activeFilterOption
                                        ]}
                                        onPress={() => setFilters({...filters, cuisine})}
                                    >
                                        <Text style={[
                                            styles.filterOptionText,
                                            filters.cuisine === cuisine && styles.activeFilterOptionText
                                        ]}>
                                            {cuisine}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Price range filter */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Price Range</Text>
                            <View style={styles.priceRangeContainer}>
                                {['$', '$$', '$$$', '$$$$'].map((price) => (
                                    <TouchableOpacity
                                        key={price}
                                        style={[
                                            styles.priceOption,
                                            filters.priceRange === price && styles.activePriceOption
                                        ]}
                                        onPress={() => setFilters({...filters, priceRange: price})}
                                    >
                                        <Text style={[
                                            styles.priceOptionText,
                                            filters.priceRange === price && styles.activePriceOptionText
                                        ]}>
                                            {price}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Open now toggle */}
                        <View style={styles.filterSection}>
                            <TouchableOpacity
                                style={styles.toggleContainer}
                                onPress={() => setFilters({...filters, openNow: !filters.openNow})}
                            >
                                <Text style={styles.filterLabel}>Open now</Text>
                                <View style={[styles.toggle, filters.openNow && styles.activeToggleFilter]}>
                                    <View style={[styles.toggleThumb, filters.openNow && styles.activeToggleThumb]}/>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <View style={styles.filtersActions}>
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => setFilters({
                                cuisine: '',
                                priceRange: '',
                                rating: '',
                                openNow: false,
                                distance: 5
                            })}
                        >
                            <Text style={styles.clearButtonText}>Clear All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => setShowFilters(false)}
                        >
                            <Text style={styles.applyButtonText}>Apply Filters</Text>
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
        backgroundColor: '#ffffff',
    } as ViewStyle,
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    } as ViewStyle,
    locationSection: {
        marginBottom: 16,
    } as ViewStyle,
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    } as ViewStyle,
    locationLabel: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    } as TextStyle,
    searchContainer: {
        position: 'relative',
        marginBottom: 8,
    } as ViewStyle,
    searchInput: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingRight: 40,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    } as TextStyle,
    searchIcon: {
        position: 'absolute',
        right: 12,
        top: 12,
    } as ViewStyle,
    selectedLocation: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    } as TextStyle,
    filtersContainer: {
        marginBottom: 16,
    } as ViewStyle,
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    } as ViewStyle,
    filterButtonText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#333',
    } as TextStyle,
    filterChip: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    } as ViewStyle,
    activeFilterChip: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    } as ViewStyle,
    filterChipText: {
        fontSize: 14,
        color: '#333',
    } as TextStyle,
    activeFilterChipText: {
        color: '#fff',
    } as TextStyle,
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 4,
    } as ViewStyle,
    toggleButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    } as ViewStyle,
    activeToggle: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    } as ViewStyle,
    toggleText: {
        fontSize: 14,
        color: '#666',
    } as TextStyle,
    activeToggleText: {
        color: '#333',
        fontWeight: '600',
    } as TextStyle,
    mapContainer: {
        flex: 1,
        position: 'relative',
    } as ViewStyle,
    map: {
        flex: 1,
    } as ViewStyle,
    userMarker: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{translateX: -8}, {translateY: -8}],
    } as ViewStyle,
    userMarkerInner: {
        width: 16,
        height: 16,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#fff',
    } as ViewStyle,
    userMarkerPulse: {
        position: 'absolute',
        width: 32,
        height: 32,
        backgroundColor: '#007AFF',
        borderRadius: 16,
        opacity: 0.3,
        top: -8,
        left: -8,
    } as ViewStyle,
    restaurantMarker: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    } as ViewStyle,
    selectedMarker: {
        backgroundColor: '#D32F2F',
        transform: [{scale: 1.2}],
    } as ViewStyle,
    markerText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    } as TextStyle,
    mapControls: {
        position: 'absolute',
        top: 20,
        right: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    } as ViewStyle,
    mapControlButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    } as ViewStyle,
    mapControlText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    } as TextStyle,
    locateButton: {
        position: 'absolute',
        bottom: 280,
        right: 16,
        width: 48,
        height: 48,
        backgroundColor: '#fff',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    } as ViewStyle,
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    } as ViewStyle,
    bottomSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 16,
    } as ViewStyle,
    listContainer: {
        flex: 1,
    } as ViewStyle,
    listHeader: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    } as ViewStyle,
    resultsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 16,
        marginBottom: 8,
    } as TextStyle,
    restaurantList: {
        padding: 16,
    } as ViewStyle,
    restaurantCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    } as ViewStyle,
    restaurantImage: {
        width: '100%',
        height: 120,
    } as ImageStyle,
    restaurantInfo: {
        padding: 12,
    } as ViewStyle,
    restaurantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    } as ViewStyle,
    restaurantName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 8,
    } as TextStyle,
    priceRange: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    } as ViewStyle,
    priceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    } as TextStyle,
    cuisineType: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    } as TextStyle,
    restaurantMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    } as ViewStyle,
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    stars: {
        fontSize: 14,
        color: '#FFD700',
        marginRight: 4,
    } as TextStyle,
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
        color: '#333',
    } as TextStyle,
    reviewCount: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    } as TextStyle,
    distance: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    distanceText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    } as TextStyle,
    statusContainer: {
        marginBottom: 8,
    } as ViewStyle,
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    } as ViewStyle,
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    } as TextStyle,
    address: {
        fontSize: 12,
        color: '#666',
    } as TextStyle,
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        paddingTop: Platform.OS === 'ios' ? 100 : 80,
    } as ViewStyle,
    suggestionsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        maxHeight: 200,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    } as ViewStyle,
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    } as ViewStyle,
    suggestionText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
    } as TextStyle,
    detailModal: {
        flex: 1,
        backgroundColor: '#fff',
    } as ViewStyle,
    detailHeader: {
        position: 'relative',
    } as ViewStyle,
    detailImage: {
        width: '100%',
        height: 200,
    } as ImageStyle,
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        right: 16,
        width: 32,
        height: 32,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    } as ViewStyle,
    detailContent: {
        flex: 1,
    } as ViewStyle,
    detailInfo: {
        padding: 20,
    } as ViewStyle,
    detailName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    } as TextStyle,
    detailCuisine: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    } as TextStyle,
    detailMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    } as ViewStyle,
    detailRating: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    detailStars: {
        fontSize: 18,
        color: '#FFD700',
        marginRight: 6,
    } as TextStyle,
    detailRatingText: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 6,
        color: '#333',
    } as TextStyle,
    detailReviewCount: {
        fontSize: 16,
        color: '#666',
        marginLeft: 6,
    } as TextStyle,
    detailPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    } as TextStyle,
    detailStatus: {
        flexDirection: 'row',
        marginBottom: 16,
    } as ViewStyle,
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    } as ViewStyle,
    detailStatusText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    } as TextStyle,
    detailAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    } as TextStyle,
    detailDescription: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    } as TextStyle,
    detailActions: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    } as ViewStyle,
    reserveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    } as ViewStyle,
    reserveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    } as TextStyle,
    menuButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    } as ViewStyle,
    menuButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    } as TextStyle,
    filtersModal: {
        flex: 1,
        backgroundColor: '#fff',
    } as ViewStyle,
    filtersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    } as ViewStyle,
    filtersTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    } as TextStyle,
    filtersContent: {
        flex: 1,
        paddingHorizontal: 20,
    } as ViewStyle,
    filterSection: {
        marginVertical: 20,
    } as ViewStyle,
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    } as TextStyle,
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    } as ViewStyle,
    filterOption: {
        backgroundColor: '#f8f8f8',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    } as ViewStyle,
    activeFilterOption: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    } as ViewStyle,
    filterOptionText: {
        fontSize: 14,
        color: '#333',
    } as TextStyle,
    activeFilterOptionText: {
        color: '#fff',
    } as TextStyle,
    priceRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    } as ViewStyle,
    priceOption: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    } as ViewStyle,
    activePriceOption: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    } as ViewStyle,
    priceOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    } as TextStyle,
    activePriceOptionText: {
        color: '#fff',
    } as TextStyle,
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    } as ViewStyle,
    toggle: {
        width: 50,
        height: 30,
        backgroundColor: '#e0e0e0',
        borderRadius: 15,
        padding: 2,
        justifyContent: 'center',
    } as ViewStyle,
    activeToggleFilter: {
        backgroundColor: '#007AFF',
    } as ViewStyle,
    toggleThumb: {
        width: 26,
        height: 26,
        backgroundColor: '#fff',
        borderRadius: 13,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    } as ViewStyle,
    activeToggleThumb: {
        transform: [{translateX: 20}],
    } as ViewStyle,
    filtersActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        gap: 12,
    } as ViewStyle,
    clearButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    } as ViewStyle,
    clearButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    } as TextStyle,
    applyButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    } as ViewStyle,
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    } as TextStyle,
});

export default SearchScreen;