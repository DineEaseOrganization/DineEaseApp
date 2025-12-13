import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    TouchableOpacity,
    Image,
    StyleSheet
} from 'react-native';
import { restaurantService } from '../../services/api';
import { mapRestaurantDetailToRestaurant, Restaurant } from '../../types';
import { RouteProp } from '@react-navigation/native';
import { DiscoverStackParamList } from '../../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';

type NearbyRestaurantsScreenRouteProp = RouteProp<DiscoverStackParamList, 'NearbyRestaurants'>;
type NearbyRestaurantsScreenNavigationProp = StackNavigationProp<DiscoverStackParamList, 'NearbyRestaurants'>;

interface Props {
    route: NearbyRestaurantsScreenRouteProp;
    navigation: NearbyRestaurantsScreenNavigationProp;
}

const NearbyRestaurantsScreen: React.FC<Props> = ({ route, navigation }) => {
    const { latitude, longitude, radius = 5 } = route.params;

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

            const res = await restaurantService.getNearbyRestaurants(
              latitude,
              longitude,
              radius,
              0,
              20
            );

            setRestaurants(res.restaurants.map(mapRestaurantDetailToRestaurant));
            setHasMore(res.hasMore);
            setPage(0);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;

        try {
            setLoadingMore(true);
            const next = page + 1;

            const res = await restaurantService.getNearbyRestaurants(
              latitude,
              longitude,
              radius,
              next,
              20
            );

            setRestaurants(prev => [
                ...prev,
                ...res.restaurants.map(mapRestaurantDetailToRestaurant)
            ]);
            setHasMore(res.hasMore);
            setPage(next);
        } finally {
            setLoadingMore(false);
        }
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(lat1 * Math.PI / 180) *
          Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2;

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const renderRestaurant = ({ item }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
      >
          <Image
            source={{ uri: item.coverImageUrl || 'https://via.placeholder.com/120' }}
            style={styles.image}
          />

          <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>

              <View style={styles.ratingRow}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.rating}>{item.averageRating.toFixed(1)}</Text>
                  <Text style={styles.reviews}>({item.totalReviews} reviews)</Text>
              </View>

              <Text style={styles.address} numberOfLines={1}>
                  {item.address}
              </Text>

              <View style={styles.detailsRow}>
                  <Text style={styles.price}>{item.priceRange}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.cuisine}>{item.primaryCuisineType}</Text>

                  {item.latitude && item.longitude && (
                    <>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.distance}>
                            {calculateDistance(
                              latitude,
                              longitude,
                              item.latitude,
                              item.longitude
                            ).toFixed(1)} km
                        </Text>
                    </>
                  )}
              </View>
          </View>
      </TouchableOpacity>
    );

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          {loading ? (
            <ActivityIndicator size="large" color="#dc3545" style={{ marginTop: 30 }} />
          ) : (
            <>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Nearby Restaurants</Text>
                    <Text style={styles.headerSubtitle}>
                        {restaurants.length} restaurants within {radius}km
                    </Text>
                </View>
                <FlatList
                  data={restaurants}
                  renderItem={renderRestaurant}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ padding: 16 }}
                  onEndReached={loadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={
                      loadingMore ? (
                        <ActivityIndicator size="small" color="#dc3545" style={{ marginVertical: 20 }} />
                      ) : null
                  }
                />
            </>
          )}
      </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: 20,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        elevation: 3,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: 120,
        height: 120,
    },
    info: {
        flex: 1,
        padding: 12,
    },
    name: {
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
        marginVertical: 6,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    dot: {
        marginHorizontal: 6,
        color: '#999',
    },
    cuisine: {
        fontSize: 14,
        color: '#666',
    },
    distance: {
        fontSize: 14,
        color: '#666',
    },
});

export default NearbyRestaurantsScreen;