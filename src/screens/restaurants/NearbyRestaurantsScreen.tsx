import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { restaurantService } from '../../services/api';
import { mapRestaurantDetailToRestaurant, Restaurant } from '../../types';
import { RouteProp } from '@react-navigation/native';
import { DiscoverStackParamList } from '../../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import { CachedImage } from '../../components/CachedImage';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import { r } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

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

    useEffect(() => { void loadRestaurants(); }, []);

    const loadRestaurants = async () => {
        try {
            setLoading(true);
            const res = await restaurantService.getNearbyRestaurants(latitude, longitude, radius, 0, 20);
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
            const res = await restaurantService.getNearbyRestaurants(latitude, longitude, radius, next, 20);
            setRestaurants(prev => [...prev, ...res.restaurants.map(mapRestaurantDetailToRestaurant)]);
            setHasMore(res.hasMore);
            setPage(next);
        } finally {
            setLoadingMore(false);
        }
    };

    const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const renderItem = ({ item }: { item: Restaurant }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
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
                    <AppText variant="caption" color={Colors.textOnLightSecondary}>{item.primaryCuisineType}</AppText>
                    {item.latitude && item.longitude && (
                        <>
                            <View style={styles.dot} />
                            <AppText variant="caption" color={Colors.textOnLightSecondary}>
                                {calcDistance(latitude, longitude, item.latitude, item.longitude).toFixed(1)} km
                            </AppText>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header — navy */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <AppText variant="bodySemiBold" color="rgba(255,255,255,0.75)">←</AppText>
                </TouchableOpacity>
                <View>
                    <AppText variant="h3" color={Colors.white}>Nearby</AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.65)">
                        Within {radius}km
                    </AppText>
                </View>
                <View style={{ width: r(32) }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={NAVY} />
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginTop: Spacing['4'] }}>
                        Finding nearby restaurants...
                    </AppText>
                </View>
            ) : (
                <FlatList
                    data={restaurants}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <View style={styles.sectionTick} />
                            <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                                {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} found
                            </AppText>
                        </View>
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loadingMore ? (
                        <View style={styles.footer}>
                            <ActivityIndicator size="small" color={NAVY} />
                        </View>
                    ) : null}
                />
            )}
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
    backBtn: { width: r(32), justifyContent: 'center' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['5'] },

    list: { padding: Spacing['4'], paddingBottom: Spacing['8'] },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['3'] },
    sectionTick: { width: r(3), height: r(14), backgroundColor: NAVY, borderRadius: r(2) },

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

export default NearbyRestaurantsScreen;
