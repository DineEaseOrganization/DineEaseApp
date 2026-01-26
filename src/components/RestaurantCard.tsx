import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Restaurant } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

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
    if (isToggling) return;

    if (!isAuthenticated) {
      // Could trigger login modal here
      return;
    }

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
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar && stars.length < 5) {
      stars.push('☆');
    }

    return stars.join('');
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(restaurant)}
      activeOpacity={0.95}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: restaurant.coverImageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Gradient overlay for better text visibility */}
        <View style={styles.imageGradient} />

        {/* Price range badge */}
        <View style={styles.priceRangeBadge}>
          <Text style={styles.priceRangeText}>{restaurant.priceRange}</Text>
        </View>

        {/* Favorite button */}
        {showFavoriteButton && isAuthenticated && (
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              favorite && styles.favoriteButtonActive,
            ]}
            onPress={handleFavoritePress}
            disabled={isToggling}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color={favorite ? '#fff' : '#e74c3c'} />
            ) : (
              <Text style={styles.favoriteIcon}>
                {favorite ? '❤️' : '🤍'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* Restaurant name */}
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>

        {/* Cuisine type */}
        <Text style={styles.cuisine}>{restaurant.cuisineType}</Text>

        {/* Rating section */}
        <View style={styles.ratingContainer}>
          <View style={styles.starsContainer}>
            <Text style={styles.stars}>{renderStars(restaurant.averageRating)}</Text>
          </View>
          <Text style={styles.ratingText}>
            {restaurant.averageRating.toFixed(1)}
          </Text>
          <Text style={styles.reviewCount}>
            ({restaurant.totalReviews} {restaurant.totalReviews === 1 ? 'review' : 'reviews'})
          </Text>
        </View>

        {/* Address */}
        <Text style={styles.address} numberOfLines={1}>
          {restaurant.address}
        </Text>

        {/* Amenities */}
        {restaurant.amenities && restaurant.amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            {restaurant.amenities.slice(0, 3).map((amenity, index) => (
              <View key={index} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
            {restaurant.amenities.length > 3 && (
              <View style={styles.amenityTagMore}>
                <Text style={styles.amenityTextMore}>
                  +{restaurant.amenities.length - 3}
                </Text>
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  priceRangeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  priceRangeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButtonActive: {
    backgroundColor: '#ffe5e5',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cuisine: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  starsContainer: {
    marginRight: 6,
  },
  stars: {
    fontSize: 14,
    color: '#FFB800',
    letterSpacing: 1,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 13,
    color: '#888',
  },
  address: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  amenityTag: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 11,
    color: '#4a5568',
    fontWeight: '500',
  },
  amenityTagMore: {
    backgroundColor: '#e8eef4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 4,
  },
  amenityTextMore: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
  },
});

export default RestaurantCard;
