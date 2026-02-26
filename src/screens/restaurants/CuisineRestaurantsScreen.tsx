// src/screens/restaurants/CuisineRestaurantsScreen.tsx
import React, {useState, useEffect} from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {DiscoverStackParamList} from '../../navigation/AppNavigator';
import {restaurantService} from '../../services/api';
import {Restaurant, mapRestaurantDetailToRestaurant} from '../../types';
import {CachedImage} from '../../components/CachedImage';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';

const NAVY = Colors.primary;

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

    useEffect(() => { void loadRestaurants(); }, []);

    const loadRestaurants = async () => {
        try {
            setLoading(true);
            const response = await restaurantService.getRestaurantsByCuisine(cuisineType, latitude, longitude, radius, 0, 20);
            setRestaurants(response.restaurants.map(mapRestaurantDetailToRestaurant));
            setHasMore(response.hasMore);
            setPage(0);
        } catch {
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
            const response = await restaurantService.getRestaurantsByCuisine(cuisineType, latitude, longitude, radius, nextPage, 20);
            setRestaurants(prev => [...prev, ...response.restaurants.map(mapRestaurantDetailToRestaurant)]);
            setHasMore(response.hasMore);
            setPage(nextPage);
        } finally {
            setLoadingMore(false);
        }
    };

    const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 3959;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const renderItem = ({item}: {item: Restaurant}) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RestaurantDetail', {restaurant: item})}
            activeOpacity={0.88}
        >
            <CachedImage uri={item.coverImageUrl} style={styles.image} fallbackColor="#cdd8e0" />

            <View style={styles.info}>
                <AppText variant="cardTitle" color={NAVY} numberOfLines={1} style={styles.name}>
                    {item.name}
                </AppText>

                <View style={styles.ratingRow}>
                    <AppText style={styles.star}>★</AppText>
                    <AppText variant="bodySemiBold" color={Colors.textOnLight}> {item.averageRating.toFixed(1)}</AppText>
                    <AppText variant="caption" color={Colors.textOnLightTertiary}> ({item.totalReviews})</AppText>
                </View>

                <AppText variant="caption" color={Colors.textOnLightSecondary} numberOfLines={1} style={styles.address}>
                    📍 {item.address}
                </AppText>

                <View style={styles.metaRow}>
                    {item.priceRange && (
                        <View style={styles.pricePill}>
                            <AppText variant="captionMedium" color={NAVY}>{item.priceRange}</AppText>
                        </View>
                    )}
                    <View style={styles.dot} />
                    <AppText variant="caption" color={Colors.textOnLightSecondary}>{item.cuisineType}</AppText>
                    {item.latitude && item.longitude && (
                        <>
                            <View style={styles.dot} />
                            <AppText variant="caption" color={Colors.textOnLightSecondary}>
                                {calcDistance(latitude, longitude, item.latitude, item.longitude).toFixed(1)} mi
                            </AppText>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <AppText variant="bodySemiBold" color="rgba(255,255,255,0.75)">←</AppText>
                    </TouchableOpacity>
                    <AppText variant="h3" color={Colors.white}>{cuisineType}</AppText>
                    <View style={{ width: r(32) }} />
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={NAVY} />
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginTop: Spacing['4'] }}>
                        Loading {cuisineType} restaurants...
                    </AppText>
                </View>
            </SafeAreaView>
        );
    }

    if (restaurants.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <AppText variant="bodySemiBold" color="rgba(255,255,255,0.75)">←</AppText>
                    </TouchableOpacity>
                    <AppText variant="h3" color={Colors.white}>{cuisineType}</AppText>
                    <View style={{ width: r(32) }} />
                </View>
                <View style={styles.center}>
                    <AppText style={styles.emptyIcon}>🍽️</AppText>
                    <AppText variant="sectionTitle" color={NAVY} style={{ marginBottom: Spacing['2'] }}>
                        No restaurants found
                    </AppText>
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ textAlign: 'center', marginBottom: Spacing['5'] }}>
                        No {cuisineType} restaurants found within {radius}km
                    </AppText>
                    <AppButton label="Try Again" onPress={loadRestaurants} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={restaurants}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMoreRestaurants}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={
                    <>
                        {/* Header — navy */}
                        <View style={styles.headerInline}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                                <AppText variant="bodySemiBold" color="rgba(255,255,255,0.75)">←</AppText>
                            </TouchableOpacity>
                            <View>
                                <AppText variant="h3" color={Colors.white}>{cuisineType}</AppText>
                                <AppText variant="caption" color="rgba(255,255,255,0.65)">
                                    {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} within {radius}km
                                </AppText>
                            </View>
                            <View style={{ width: r(32) }} />
                        </View>
                        <View style={{ height: Spacing['4'] }} />
                    </>
                }
                ListFooterComponent={loadingMore ? (
                    <View style={styles.footer}>
                        <ActivityIndicator size="small" color={NAVY} />
                    </View>
                ) : null}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.appBackground },

    header: {
        backgroundColor: NAVY,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['3'],
        paddingBottom: Spacing['3'] },
    // Inline header used inside FlatList ListHeaderComponent
    headerInline: {
        backgroundColor: NAVY,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['3'],
        paddingBottom: Spacing['3'],
        marginHorizontal: -Spacing['4'],  // counteract list padding
        marginTop: -Spacing['4'] },
    backBtn: { width: r(32), justifyContent: 'center' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['5'] },
    emptyIcon: { fontSize: rf(40), marginBottom: Spacing['4'] },

    list: { padding: Spacing['4'], paddingBottom: Spacing['8'] },

    // ── Card ──────────────────────────────────────────────────────────────────
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.xl,
        marginBottom: Spacing['3'],
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        shadowColor: '#1a2e3b',
        shadowOffset: { width: r(0), height: r(3) },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3 },
    image: { width: r(108), height: r(108) },
    info: { flex: 1, padding: Spacing['3'], justifyContent: 'center', gap: Spacing['1'] },
    name: { fontSize: FontSize.md },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    star: { color: Colors.star, fontSize: FontSize.sm },
    address: { },
    metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: r(2) },
    dot: { width: r(3), height: r(3), borderRadius: r(2), backgroundColor: Colors.cardBorder, marginHorizontal: r(5) },
    pricePill: {
        backgroundColor: 'rgba(15,51,70,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(15,51,70,0.12)',
        borderRadius: Radius.full,
        paddingHorizontal: Spacing['2'],
        paddingVertical: r(2) },
    footer: { paddingVertical: Spacing['5'], alignItems: 'center' } });

export default CuisineRestaurantsScreen;
