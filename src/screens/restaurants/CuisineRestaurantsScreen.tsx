// src/screens/restaurants/CuisineRestaurantsScreen.tsx
import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {DiscoverStackParamList} from '../../navigation/AppNavigator';
import {restaurantService} from '../../services/api';
import {Restaurant, mapRestaurantDetailToRestaurant} from '../../types';

type CuisineRestaurantsScreenRouteProp = RouteProp<DiscoverStackParamList, 'CuisineRestaurants'>;
type CuisineRestaurantsScreenNavigationProp = StackNavigationProp<DiscoverStackParamList, 'CuisineRestaurants'>;

interface Props {
    route: CuisineRestaurantsScreenRouteProp;
    navigation: CuisineRestaurantsScreenNavigationProp;
}

const CuisineRestaurantsScreen: React.FC<Props> = ({route, navigation}) => {
    const {cuisineType, latitude, longitude, radius = 10} = route.params;

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        void loadRestaurants();
    }, []);

    const loadRestaurants = async () => {
        try {
            setLoading(true);
            const response = await restaurantService.getRestaurantsByCuisine(
                cuisineType,
                latitude,
                longitude,
                radius,
                0,
                20
            );

            const mappedRestaurants = response.restaurants.map(mapRestaurantDetailToRestaurant);
            setRestaurants(mappedRestaurants);
            setHasMore(response.hasMore);
            setPage(0);
        } catch (error) {
            console.error('Error loading restaurants:', error);
            Alert.alert('Error', 'Failed to load restaurants');
        } finally {
            setLoading(false);
        }
    };

    const loadMoreRestaurants = async () => {
        if (loadingMore || !hasMore) return;

        try {
            setLoadingMore(true);
            const nextPage = page + 1;
            const response = await restaurantService.getRestaurantsByCuisine(
                cuisineType,
                latitude,
                longitude,
                radius,
                nextPage,
                20
            );

            const mappedRestaurants = response.restaurants.map(mapRestaurantDetailToRestaurant);
            setRestaurants(prev => [...prev, ...mappedRestaurants]);
            setHasMore(response.hasMore);
            setPage(nextPage);
        } catch (error) {
            console.error('Error loading more restaurants:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 3959; // Earth radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const renderRestaurant = ({item}: {item: Restaurant}) => (
        <TouchableOpacity
            style={styles.restaurantCard}
            onPress={() => navigation.navigate('RestaurantDetail', {restaurant: item})}
        >
            <Image
                source={{uri: item.coverImageUrl || 'https://via.placeholder.com/120'}}
                style={styles.restaurantImage}
            />
            <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{item.name}</Text>
                <View style={styles.ratingRow}>
                    <Text style={styles.star}>★</Text>
                    <Text style={styles.rating}>{item.averageRating.toFixed(1)}</Text>
                    <Text style={styles.reviews}>({item.totalReviews} reviews)</Text>
                </View>
                <Text style={styles.address}>{item.address}</Text>
                <View style={styles.detailsRow}>
                    <Text style={styles.priceRange}>{item.priceRange}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.cuisineType}>{item.cuisineType}</Text>
                    {item.latitude && item.longitude && (
                        <>
                            <Text style={styles.dot}>•</Text>
                            <Text style={styles.distance}>
                                {calculateDistance(latitude, longitude, item.latitude, item.longitude).toFixed(1)} mi
                            </Text>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#dc3545" />
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#dc3545" />
                <Text style={styles.loadingText}>Loading {cuisineType} restaurants...</Text>
            </View>
        );
    }

    if (restaurants.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No {cuisineType} restaurants found nearby</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadRestaurants}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={restaurants}
                renderItem={renderRestaurant}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                onEndReached={loadMoreRestaurants}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{cuisineType} Restaurants</Text>
                        <Text style={styles.headerSubtitle}>
                            {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} within {radius}km
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    emptyText: {
        fontSize: 16,
        color: '#666',
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
    listContent: {
        padding: 16,
    },
    header: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    restaurantCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    restaurantImage: {
        width: 120,
        height: 120,
    },
    restaurantInfo: {
        flex: 1,
        padding: 12,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    star: {
        color: '#FFD700',
        fontSize: 14,
        marginRight: 4,
    },
    rating: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginRight: 4,
    },
    reviews: {
        fontSize: 12,
        color: '#666',
    },
    address: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceRange: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    dot: {
        marginHorizontal: 6,
        color: '#999',
    },
    cuisineType: {
        fontSize: 14,
        color: '#666',
    },
    distance: {
        fontSize: 14,
        color: '#666',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default CuisineRestaurantsScreen;