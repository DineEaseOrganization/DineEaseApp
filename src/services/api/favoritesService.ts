// src/services/api/favoritesService.ts
import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../../config/api.config';
import {
  FavoritesListResponse,
  AddFavoriteResponse,
  RemoveFavoriteResponse,
  CheckFavoriteResponse,
} from '../../types/api.types';

class FavoritesService {
  // Favorites are managed by the Restaurant Service (domain: restaurant-customer relationships)
  private readonly BASE_URL = API_CONFIG.RESTAURANT_SERVICE_URL;
  private readonly API_KEY = 'dineease-mobile-2024-secret';

  private getHeaders() {
    return {
      'X-API-Key': this.API_KEY,
      'X-Platform': Platform.OS === 'ios' ? 'iOS' : 'Android',
      'X-App-Version': '1.0.0',
    };
  }

  /**
   * Get all favorites for the authenticated user
   */
  async getFavorites(): Promise<FavoritesListResponse> {
    return await apiClient.get<FavoritesListResponse>(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Add a restaurant to favorites
   * POST /customer/favorites/{restaurantId}
   */
  async addFavorite(restaurantId: number): Promise<AddFavoriteResponse> {
    return await apiClient.post<AddFavoriteResponse>(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}/${restaurantId}`,
      undefined, // No request body - restaurantId is in path
      { headers: this.getHeaders() }
    );
  }

  /**
   * Remove a restaurant from favorites
   */
  async removeFavorite(restaurantId: number): Promise<RemoveFavoriteResponse> {
    return await apiClient.delete<RemoveFavoriteResponse>(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITE_BY_ID}/${restaurantId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Check if a restaurant is in favorites
   */
  async checkFavorite(restaurantId: number): Promise<CheckFavoriteResponse> {
    return await apiClient.get<CheckFavoriteResponse>(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.CHECK_FAVORITE}/${restaurantId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Batch check if multiple restaurants are in favorites
   * Returns a map of restaurantId -> isFavorite
   */
  async checkFavoritesBatch(restaurantIds: number[]): Promise<Map<number, boolean>> {
    const results = new Map<number, boolean>();

    // For now, check individually (can be optimized with a batch endpoint later)
    await Promise.all(
      restaurantIds.map(async (id) => {
        try {
          const response = await this.checkFavorite(id);
          results.set(id, response.isFavorite);
        } catch {
          results.set(id, false);
        }
      })
    );

    return results;
  }
}

export const favoritesService = new FavoritesService();
export { FavoritesService };
