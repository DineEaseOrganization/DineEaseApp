// src/context/FavoritesContext.tsx
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { favoritesService, ApiError } from '../services/api';
import { useAuth } from './AuthContext';
import { RestaurantDetail, FavoriteRestaurant } from '../types/api.types';
import { Restaurant, mapRestaurantDetailToRestaurant } from '../types';

/**
 * FavoriteRestaurant (slim DTO) → RestaurantDetail-compatible shape
 * so we can pass it safely to mapRestaurantDetailToRestaurant.
 */
const favoriteToDetail = (fav: FavoriteRestaurant): RestaurantDetail => ({
  id: fav.restaurantId,
  name: fav.restaurantName,
  primaryCuisineType: fav.cuisineType ?? null,
  cuisineTypes: fav.cuisineType ? [fav.cuisineType] : null,
  description: null,
  address: fav.address ?? '',
  postCode: '',
  country: '',
  latitude: null,
  longitude: null,
  phoneNumber: '',
  priceRange: fav.priceRange ?? null,
  coverImageUrl: fav.coverImageUrl ?? null,
  galleryImages: null,
  averageRating: fav.averageRating ?? 0,
  totalReviews: fav.totalReviews ?? 0,
  isActive: true,
  acceptsReservations: true,
  amenities: null,
});

interface FavoritesContextType {
  favorites: Restaurant[];
  favoriteIds: Set<number>;
  isLoading: boolean;
  error: string | null;
  isFavorite: (restaurantId: number) => boolean;
  toggleFavorite: (restaurantId: number) => Promise<{ success: boolean; message: string }>;
  addToFavorites: (restaurantId: number) => Promise<{ success: boolean; message: string }>;
  removeFromFavorites: (restaurantId: number) => Promise<{ success: boolean; message: string }>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch favorites when user is authenticated
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await favoritesService.getFavorites();
      console.log('📋 Favorites API response:', JSON.stringify(response, null, 2));

      // Backend returns: { restaurants: [...], totalCount, page, totalPages, hasMore }
      // Each restaurant has 'id' field (not 'restaurantId')
      let restaurantsList: RestaurantDetail[] = [];

      if (Array.isArray(response)) {
        restaurantsList = response;
      } else if (response.restaurants && Array.isArray(response.restaurants)) {
        // Full RestaurantDetail objects — use directly
        restaurantsList = response.restaurants;
      } else if (response.favorites && Array.isArray(response.favorites)) {
        // Slim FavoriteRestaurant DTOs — normalise to RestaurantDetail shape
        restaurantsList = response.favorites.map(favoriteToDetail);
      } else if (response.content && Array.isArray(response.content)) {
        // Spring Page format — also slim DTOs
        restaurantsList = response.content.map(favoriteToDetail);
      }

      // Map to Restaurant type and extract IDs
      const mappedFavorites = restaurantsList.map(r => mapRestaurantDetailToRestaurant(r));
      const ids = new Set(restaurantsList.map(r => r.id));

      console.log('📋 Parsed favorites:', mappedFavorites.length, 'items, IDs:', Array.from(ids));

      setFavorites(mappedFavorites);
      setFavoriteIds(ids);
    } catch (err) {
      console.error('❌ Error fetching favorites:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load favorites');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch favorites on mount and when auth changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Check if a restaurant is in favorites
  const isFavorite = useCallback(
    (restaurantId: number): boolean => {
      return favoriteIds.has(restaurantId);
    },
    [favoriteIds]
  );

  // Add restaurant to favorites
  // Backend: POST /customer/favorites/{restaurantId}
  // Response: { restaurantId, isFavorite: true, message }
  const addToFavorites = useCallback(
    async (restaurantId: number): Promise<{ success: boolean; message: string }> => {
      if (!isAuthenticated) {
        return { success: false, message: 'Please sign in to add favorites' };
      }

      // Optimistic update
      setFavoriteIds(prev => new Set([...prev, restaurantId]));

      try {
        const response = await favoritesService.addFavorite(restaurantId);
        console.log('❤️ Add favorite response:', response);

        // Backend returns isFavorite: true on success
        if (response.isFavorite) {
          // Refresh full favorites list to get complete data
          fetchFavorites();
          return { success: true, message: response.message || 'Added to favorites' };
        }

        // Revert optimistic update on failure
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(restaurantId);
          return newSet;
        });
        return { success: false, message: response.message || 'Failed to add to favorites' };
      } catch (err) {
        console.error('Error adding to favorites:', err);
        // Revert optimistic update on error
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(restaurantId);
          return newSet;
        });
        if (err instanceof ApiError) {
          return { success: false, message: err.message };
        }
        return { success: false, message: 'Failed to add to favorites' };
      }
    },
    [isAuthenticated, fetchFavorites]
  );

  // Remove restaurant from favorites
  // Backend: DELETE /customer/favorites/{restaurantId}
  // Response: { restaurantId, isFavorite: false, message }
  const removeFromFavorites = useCallback(
    async (restaurantId: number): Promise<{ success: boolean; message: string }> => {
      if (!isAuthenticated) {
        return { success: false, message: 'Please sign in to manage favorites' };
      }

      // Optimistic update
      const previousIds = new Set(favoriteIds);
      const previousFavorites = [...favorites];

      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(restaurantId);
        return newSet;
      });
      setFavorites(prev => prev.filter(f => f.id !== restaurantId));

      try {
        const response = await favoritesService.removeFavorite(restaurantId);
        console.log('💔 Remove favorite response:', response);

        // Backend returns isFavorite: false on successful removal
        if (!response.isFavorite) {
          return { success: true, message: response.message || 'Removed from favorites' };
        }

        // Revert optimistic update on failure
        setFavoriteIds(previousIds);
        setFavorites(previousFavorites);
        return { success: false, message: response.message || 'Failed to remove from favorites' };
      } catch (err) {
        console.error('Error removing from favorites:', err);
        // Revert optimistic update on error
        setFavoriteIds(previousIds);
        setFavorites(previousFavorites);
        if (err instanceof ApiError) {
          return { success: false, message: err.message };
        }
        return { success: false, message: 'Failed to remove from favorites' };
      }
    },
    [isAuthenticated, favoriteIds, favorites]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (restaurantId: number): Promise<{ success: boolean; message: string }> => {
      if (isFavorite(restaurantId)) {
        return removeFromFavorites(restaurantId);
      } else {
        return addToFavorites(restaurantId);
      }
    },
    [isFavorite, addToFavorites, removeFromFavorites]
  );

  // Refresh favorites list
  const refreshFavorites = useCallback(async () => {
    await fetchFavorites();
  }, [fetchFavorites]);

  const value: FavoritesContextType = {
    favorites,
    favoriteIds,
    isLoading,
    error,
    isFavorite,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
