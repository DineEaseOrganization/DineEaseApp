// src/screens/favorites/FavoritesScreen.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFavorites } from '../../context/FavoritesContext';
import { Restaurant } from '../../types';
import { FavoritesScreenProps } from '../../navigation/AppNavigator';
import { useNavigation, CommonActions } from '@react-navigation/native';

// Compact horizontal card for favorites list
const FavoriteCard: React.FC<{
  restaurant: Restaurant;
  onPress: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}> = ({ restaurant, onPress, onRemove, isRemoving }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: restaurant.coverImageUrl || 'https://via.placeholder.com/100x100?text=No+Image' }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            disabled={isRemoving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color="#e74c3c" />
            ) : (
              <Text style={styles.removeIcon}>❤️</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.cardCuisine}>{restaurant.cuisineType}</Text>

        <View style={styles.cardMeta}>
          <View style={styles.ratingContainer}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.rating}>{restaurant.averageRating.toFixed(1)}</Text>
            <Text style={styles.reviews}>({restaurant.totalReviews})</Text>
          </View>
          {restaurant.priceRange && (
            <Text style={styles.price}>{restaurant.priceRange}</Text>
          )}
        </View>

        <Text style={styles.cardAddress} numberOfLines={1}>
          {restaurant.address}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Empty state component
const EmptyState: React.FC<{ onExplore: () => void }> = ({ onExplore }) => {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>💝</Text>
      </View>

      <Text style={styles.emptyTitle}>Your favorites await</Text>

      <Text style={styles.emptySubtitle}>
        Discover amazing restaurants and save them here for quick access
      </Text>

      <TouchableOpacity style={styles.exploreButton} onPress={onExplore}>
        <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
      </TouchableOpacity>

      <View style={styles.tipContainer}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          Tap the heart icon on any restaurant to add it to your favorites
        </Text>
      </View>
    </View>
  );
};

// Loading skeleton with horizontal layout
const LoadingSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
            <View style={styles.skeletonMeta} />
          </View>
        </View>
      ))}
    </View>
  );
};

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ navigation }) => {
  const rootNavigation = useNavigation();
  const {
    favorites,
    isLoading,
    error,
    removeFromFavorites,
    refreshFavorites,
  } = useFavorites();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshFavorites();
    setIsRefreshing(false);
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    rootNavigation.dispatch(
      CommonActions.navigate({
        name: 'Discover',
        params: {
          screen: 'RestaurantDetail',
          params: { restaurant },
        },
      })
    );
  };

  const handleRemoveFavorite = async (restaurantId: number) => {
    setRemovingIds(prev => new Set([...prev, restaurantId]));
    try {
      await removeFromFavorites(restaurantId);
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(restaurantId);
        return newSet;
      });
    }
  };

  const handleExplore = () => {
    rootNavigation.dispatch(
      CommonActions.navigate({
        name: 'Discover',
        params: {
          screen: 'RestaurantList',
        },
      })
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Favorites</Text>

        <View style={styles.headerSpacer} />
      </View>
      {favorites.length > 0 && (
        <Text style={styles.headerCount}>
          {favorites.length} saved {favorites.length === 1 ? 'restaurant' : 'restaurants'}
        </Text>
      )}
    </View>
  );

  const renderItem = ({ item }: { item: Restaurant }) => (
    <FavoriteCard
      restaurant={item}
      onPress={() => handleRestaurantPress(item)}
      onRemove={() => handleRemoveFavorite(item.id)}
      isRemoving={removingIds.has(item.id)}
    />
  );

  if (isLoading && favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        {renderHeader()}
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  if (error && favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      {renderHeader()}

      {favorites.length === 0 ? (
        <EmptyState onExplore={handleExplore} />
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
              colors={['#007AFF']}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f6',
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  headerSpacer: {
    width: 36,
  },
  headerCount: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 10,
  },

  // Compact horizontal card styles
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: 100,
    height: 100,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginRight: 8,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 14,
  },
  cardCuisine: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 12,
    color: '#FFB800',
    marginRight: 3,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  reviews: {
    fontSize: 12,
    color: '#888',
    marginLeft: 2,
  },
  price: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
    fontWeight: '500',
  },
  cardAddress: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 32,
  },
  tipIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 16,
  },

  // Loading skeleton styles (horizontal)
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  skeletonImage: {
    width: 100,
    height: 100,
    backgroundColor: '#e8eef4',
  },
  skeletonContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  skeletonTitle: {
    width: '70%',
    height: 16,
    backgroundColor: '#e8eef4',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: '50%',
    height: 12,
    backgroundColor: '#e8eef4',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonMeta: {
    width: '40%',
    height: 12,
    backgroundColor: '#e8eef4',
    borderRadius: 4,
  },

  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FavoritesScreen;
