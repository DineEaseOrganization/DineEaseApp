import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFavorites } from '../../context/FavoritesContext';
import { Restaurant } from '../../types';
import { FavoritesScreenProps } from '../../navigation/AppNavigator';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/AppNavigator';
import { CachedImage } from '../../components/CachedImage';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';
import AppButton from '../../components/ui/AppButton';
import { Ionicons } from '@expo/vector-icons';

const NAVY = Colors.primary;

// ── Favorite card ──────────────────────────────────────────────────────────────
const FavoriteCard: React.FC<{
    restaurant: Restaurant;
    onPress: () => void;
    onRemove: () => void;
    isRemoving: boolean;
}> = ({ restaurant, onPress, onRemove, isRemoving }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>

        {/* ── Hero image ── */}
        <View style={styles.imageWrap}>
            <CachedImage
                uri={restaurant.coverImageUrl ?? undefined}
                style={styles.cardImage}
                resizeMode="cover"
                fallbackColor="#cdd8e0"
            />
            {/* Heart button overlay */}
            <TouchableOpacity
                style={styles.heartBtn}
                onPress={onRemove}
                disabled={isRemoving}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.8}
            >
                {isRemoving
                    ? <ActivityIndicator size="small" color={Colors.error} />
                    : <Ionicons name="heart" size={18} color={Colors.error} />
                }
            </TouchableOpacity>
            {/* Price pill overlay */}
            {restaurant.priceRange && (
                <View style={styles.pricePill}>
                    <AppText variant="captionMedium" color={Colors.white}>{restaurant.priceRange}</AppText>
                </View>
            )}
        </View>

        {/* ── Info body ── */}
        <View style={styles.cardBody}>
            <AppText variant="cardTitle" color={NAVY} numberOfLines={1} style={styles.cardName}>
                {restaurant.name}
            </AppText>

            <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.cuisine}>
                {restaurant.cuisineType}
            </AppText>

            <View style={styles.metaRow}>
                {/* Stars */}
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <AppText
                            key={i}
                            style={[styles.starGlyph, { color: i <= Math.round(restaurant.averageRating) ? '#F5A623' : Colors.cardBorder }]}
                        >
                            ★
                        </AppText>
                    ))}
                </View>
                <AppText variant="captionMedium" color={Colors.textOnLight} style={{ marginLeft: 5 }}>
                    {restaurant.averageRating.toFixed(1)}
                </AppText>
                <AppText variant="caption" color={Colors.textOnLightTertiary}>
                    {' '}({restaurant.totalReviews})
                </AppText>
            </View>

            <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={12} color={Colors.textOnLightTertiary} />
                <AppText variant="caption" color={Colors.textOnLightTertiary} numberOfLines={1} style={{ flex: 1 }}>
                    {restaurant.address}
                </AppText>
            </View>

            {/* Book CTA */}
            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.bookBtn} onPress={onPress} activeOpacity={0.85}>
                    <AppText variant="captionMedium" color={Colors.white}>Book a Table</AppText>
                    <Ionicons name="arrow-forward" size={12} color={Colors.white} />
                </TouchableOpacity>
            </View>
        </View>
    </TouchableOpacity>
);

// ── Skeleton ───────────────────────────────────────────────────────────────────
const LoadingSkeleton: React.FC = () => (
    <View style={styles.listContent}>
        {[1, 2, 3].map((_, i) => (
            <View key={i} style={[styles.card, { marginBottom: Spacing['4'] }]}>
                <View style={[styles.cardImage, { backgroundColor: '#dde5ea' }]} />
                <View style={styles.cardBody}>
                    <View style={[styles.skelLine, { width: '70%', marginBottom: 8 }]} />
                    <View style={[styles.skelLine, { width: '45%', marginBottom: 8 }]} />
                    <View style={[styles.skelLine, { width: '55%' }]} />
                </View>
            </View>
        ))}
    </View>
);

// ── Main screen ────────────────────────────────────────────────────────────────
const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
    const profileNavigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
    const { favorites, isLoading, error, removeFromFavorites, refreshFavorites } = useFavorites();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshFavorites();
        setIsRefreshing(false);
    };

    const handleRestaurantPress = (restaurant: Restaurant) => {
        profileNavigation.navigate('RestaurantDetail', { restaurant });
    };

    const handleRemoveFavorite = async (restaurantId: number) => {
        setRemovingIds(prev => new Set([...prev, restaurantId]));
        try { await removeFromFavorites(restaurantId); }
        finally {
            setRemovingIds(prev => { const s = new Set(prev); s.delete(restaurantId); return s; });
        }
    };

    const handleExplore = () => profileNavigation.dispatch(CommonActions.navigate({
        name: 'Discover', params: { screen: 'RestaurantList' },
    }));

    const Header = () => (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Ionicons name="chevron-back" size={20} color={Colors.white} />
            </TouchableOpacity>
            <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>
                Favourites
            </AppText>
            {favorites.length > 0 ? (
                <View style={styles.countBadge}>
                    <AppText variant="captionMedium" color={Colors.white}>{favorites.length}</AppText>
                </View>
            ) : (
                <View style={{ width: 36 }} />
            )}
        </View>
    );

    if (isLoading && favorites.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <Header />
                <LoadingSkeleton />
            </SafeAreaView>
        );
    }

    if (error && favorites.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <Header />
                <View style={styles.center}>
                    <AppText style={{ fontSize: 44, marginBottom: Spacing['4'] }}>⚠️</AppText>
                    <AppText variant="sectionTitle" color={NAVY} style={{ marginBottom: Spacing['2'] }}>
                        Something went wrong
                    </AppText>
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ textAlign: 'center', marginBottom: Spacing['5'] }}>
                        {error}
                    </AppText>
                    <AppButton label="Try Again" onPress={handleRefresh} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header />

            {favorites.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="heart-outline" size={36} color={Colors.accent} />
                    </View>
                    <AppText variant="sectionTitle" color={NAVY} style={{ marginBottom: Spacing['2'], textAlign: 'center' }}>
                        No saved restaurants yet
                    </AppText>
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ textAlign: 'center', marginBottom: Spacing['6'] }}>
                        Discover amazing restaurants and tap the heart to save them here.
                    </AppText>
                    <AppButton label="Explore Restaurants" onPress={handleExplore} />
                    <View style={styles.tipBox}>
                        <AppText style={{ fontSize: 14 }}>💡</AppText>
                        <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ flex: 1 }}>
                            Tap the heart icon on any restaurant to save it
                        </AppText>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={({ item }) => (
                        <FavoriteCard
                            restaurant={item}
                            onPress={() => handleRestaurantPress(item)}
                            onRemove={() => handleRemoveFavorite(item.id)}
                            isRemoving={removingIds.has(item.id)}
                        />
                    )}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={NAVY}
                            colors={[NAVY]}
                        />
                    }
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <View style={styles.sectionTick} />
                            <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                                {favorites.length} saved {favorites.length === 1 ? 'restaurant' : 'restaurants'}
                            </AppText>
                        </View>
                    }
                    ItemSeparatorComponent={() => <View style={{ height: Spacing['3'] }} />}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.appBackground },

    // ── Header ─────────────────────────────────────────────────────────────────
    header: {
        backgroundColor: NAVY,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['3'],
    },
    backBtn: {
        width: 36, height: 36,
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: FontSize.lg },
    countBadge: {
        backgroundColor: Colors.accent,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing['2'] + 2,
        paddingVertical: 4,
        minWidth: 28,
        alignItems: 'center',
    },

    // ── List ───────────────────────────────────────────────────────────────────
    listContent: {
        paddingHorizontal: Spacing['4'],
        paddingBottom: Spacing['8'],
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        paddingTop: Spacing['4'],
        paddingBottom: Spacing['3'],
    },
    sectionTick: { width: 3, height: 14, backgroundColor: NAVY, borderRadius: 2 },

    // ── Card ───────────────────────────────────────────────────────────────────
    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },

    // Image section
    imageWrap: {
        position: 'relative',
        width: '100%',
        height: 160,
        backgroundColor: '#cdd8e0',
    },
    cardImage: {
        width: '100%',
        height: 160,
    },
    heartBtn: {
        position: 'absolute',
        top: Spacing['3'],
        right: Spacing['3'],
        width: 36, height: 36,
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    pricePill: {
        position: 'absolute',
        bottom: Spacing['2'],
        left: Spacing['3'],
        backgroundColor: 'rgba(15,51,70,0.75)',
        borderRadius: Radius.full,
        paddingHorizontal: Spacing['2'] + 2,
        paddingVertical: 4,
    },

    // Info body
    cardBody: {
        padding: Spacing['3'],
    },
    cardName: {
        fontSize: FontSize.md,
        marginBottom: 2,
    },
    cuisine: {
        marginBottom: Spacing['2'],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 11,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing['1'],
    },
    starsRow: {
        flexDirection: 'row',
        gap: 1,
    },
    starGlyph: {
        fontSize: 13,
        fontFamily: FontFamily.regular,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: Spacing['3'],
    },

    // Footer CTA
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
        paddingTop: Spacing['2'],
        alignItems: 'flex-end',
    },
    bookBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: NAVY,
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['1'] + 2,
        borderRadius: Radius.md,
    },

    // ── Skeleton ───────────────────────────────────────────────────────────────
    skelLine: { height: 13, backgroundColor: '#dde5ea', borderRadius: Radius.sm },

    // ── States ─────────────────────────────────────────────────────────────────
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing['6'],
    },
    emptyIconCircle: {
        width: 80, height: 80,
        borderRadius: Radius.full,
        backgroundColor: Colors.accentFaded,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['4'],
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        backgroundColor: 'rgba(15,51,70,0.05)',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(15,51,70,0.08)',
        padding: Spacing['3'],
        marginTop: Spacing['5'],
    },
});

export default FavoritesScreen;
