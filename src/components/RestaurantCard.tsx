import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Restaurant } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { CachedImage } from './CachedImage';
import { Colors, Radius, Spacing } from '../theme';
import AppText from './ui/AppText';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: (restaurant: Restaurant) => void;
  showFavoriteButton?: boolean;
  onFavoriteToggle?: (restaurantId: number, isFavorite: boolean) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onPress,
  showFavoriteButton = true,
  onFavoriteToggle,
}) => {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isToggling, setIsToggling] = useState(false);

  const favorite = isFavorite(restaurant.id);

  const handleFavoritePress = async () => {
    if (isToggling || !isAuthenticated) return;
    setIsToggling(true);
    try {
      const result = await toggleFavorite(restaurant.id);
      if (result.success && onFavoriteToggle) {
        onFavoriteToggle(restaurant.id, !favorite);
      }
    } finally {
      setIsToggling(false);
    }
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return '★'.repeat(full) + (half && full < 5 ? '☆' : '');
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(restaurant)}
      activeOpacity={0.88}
    >
      {/* ── Image — pure, no overlay ── */}
      <View style={styles.imageContainer}>
        <CachedImage
          uri={restaurant.coverImageUrl}
          style={styles.image}
          fallbackColor="#e8e4da"
        />

        {/* Price badge — top right, semi-transparent dark pill */}
        <View style={styles.priceBadge}>
          <AppText variant="captionMedium" color={Colors.white} style={styles.priceText}>
            {restaurant.priceRange}
          </AppText>
        </View>

        {/* Favorite button — top left, white circle */}
        {showFavoriteButton && isAuthenticated && (
          <TouchableOpacity
            style={[styles.favBtn, favorite && styles.favBtnActive]}
            onPress={handleFavoritePress}
            disabled={isToggling}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <AppText style={styles.favIcon}>{favorite ? '❤️' : '🤍'}</AppText>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Info section ── */}
      <View style={styles.info}>

        {/* Row 1: Name + cuisine type */}
        <AppText variant="cardTitle" color={Colors.primary} numberOfLines={1} style={styles.name}>
          {restaurant.name}
        </AppText>
        <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.cuisine}>
          {restaurant.cuisineType}
        </AppText>

        {/* Row 2: Rating */}
        <View style={styles.ratingRow}>
          <AppText style={styles.stars}>{renderStars(restaurant.averageRating)}</AppText>
          <AppText variant="bodySemiBold" color={Colors.textOnLight} style={styles.ratingNum}>
            {restaurant.averageRating.toFixed(1)}
          </AppText>
          <AppText variant="caption" color={Colors.textOnLightTertiary}>
            {'  '}({restaurant.totalReviews} {restaurant.totalReviews === 1 ? 'review' : 'reviews'})
          </AppText>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Row 3: Address */}
        <View style={styles.addressRow}>
          <AppText style={styles.addressPin}>📍</AppText>
          <AppText variant="caption" color={Colors.textOnLightSecondary} numberOfLines={1} style={styles.addressText}>
            {restaurant.address}
          </AppText>
        </View>

        {/* Row 4: Amenity pills (if any) */}
        {restaurant.amenities && restaurant.amenities.length > 0 && (
          <View style={styles.pillsRow}>
            {restaurant.amenities.slice(0, 3).map((amenity, i) => (
              <View key={i} style={styles.pill}>
                <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                  {amenity}
                </AppText>
              </View>
            ))}
            {restaurant.amenities.length > 3 && (
              <View style={[styles.pill, styles.pillMore]}>
                <AppText variant="captionMedium" color={Colors.accent}>
                  +{restaurant.amenities.length - 3} more
                </AppText>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing['4'],
    marginVertical: Spacing['2'],
    overflow: 'hidden',
    // Soft shadow on warm cream background
    shadowColor: '#1a2e3b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  // ── Image ──────────────────────────────────────────────────────────────────
  imageContainer: {
    height: 195,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  priceBadge: {
    position: 'absolute',
    top: Spacing['3'],
    right: Spacing['3'],
    backgroundColor: `${Colors.primary}CC`,  // Navy at ~80% opacity
    paddingHorizontal: Spacing['2'] + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  priceText: {
    letterSpacing: 0.5,
  },
  favBtn: {
    position: 'absolute',
    top: Spacing['3'],
    left: Spacing['3'],
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  favBtnActive: {
    backgroundColor: '#fff0f0',
  },
  favIcon: {
    fontSize: 17,
  },

  // ── Info ───────────────────────────────────────────────────────────────────
  info: {
    paddingHorizontal: Spacing['4'],
    paddingTop: Spacing['3'] + 2,
    paddingBottom: Spacing['4'],
    backgroundColor: Colors.cardBackground,
  },
  name: {
    marginBottom: 3,
  },
  cuisine: {
    marginBottom: Spacing['2'],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },
  stars: {
    fontSize: 13,
    color: Colors.star,
    letterSpacing: 0.5,
  },
  ratingNum: {
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginBottom: Spacing['3'],
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: Spacing['2'] + 2,
  },
  addressPin: {
    fontSize: 12,
    marginTop: 1,
  },
  addressText: {
    flex: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  pill: {
    backgroundColor: 'rgba(15, 51, 70, 0.06)',  // Navy-tinted cream pill
    paddingHorizontal: Spacing['2'] + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(15, 51, 70, 0.12)',
  },
  pillMore: {
    backgroundColor: Colors.accentFaded,
    borderColor: 'rgba(122, 0, 0, 0.15)',
  },
});

export default RestaurantCard;
