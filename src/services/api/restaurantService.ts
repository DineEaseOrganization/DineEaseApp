// src/services/api/restaurantService.ts
import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../../config/api.config';
import {
    RestaurantDetail,
    CuisineStat,
    RestaurantListResponse,
    NearbyRestaurantsResponse,
    RestaurantSearchResponse,
    TopRestaurantsResponse,
    SortOption,
    TopCategory,
    TimeRange,
} from '../../types/api.types';

class RestaurantService {
    private readonly BASE_URL = `${API_CONFIG.RESTAURANT_SERVICE_URL}/customer/restaurants`;
    private readonly API_KEY = 'dineease-mobile-2024-secret';

    private getHeaders() {
        return {
            'X-API-Key': this.API_KEY,
            'X-Platform': Platform.OS === 'ios' ? 'iOS' : 'Android',
            'X-App-Version': '1.0.0'
        };
    }

    async getRestaurantDetail(restaurantId: number): Promise<RestaurantDetail> {
        return await apiClient.get<RestaurantDetail>(
            `${this.BASE_URL}/${restaurantId}`,
            { headers: this.getHeaders() }
        );
    }

    async getAvailableCuisines(
        latitude: number,
        longitude: number,
        radius: number = 10
    ): Promise<CuisineStat[]> {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            radius: radius.toString()
        });

        return await apiClient.get<CuisineStat[]>(
            `${this.BASE_URL}/cuisines?${params}`,
            { headers: this.getHeaders() }
        );
    }

    async getRestaurantsByCuisine(
        cuisineType: string,
        latitude: number,
        longitude: number,
        radius: number = 10,
        page: number = 0,
        size: number = 20
    ): Promise<RestaurantListResponse> {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            radius: radius.toString(),
            page: page.toString(),
            size: size.toString()
        });

        return await apiClient.get<RestaurantListResponse>(
            `${this.BASE_URL}/cuisines/${encodeURIComponent(cuisineType)}/restaurants?${params}`,
            { headers: this.getHeaders() }
        );
    }

    async getFeaturedRestaurants(
        limit: number = 10,
        latitude?: number,
        longitude?: number,
        radius: number = 10
    ): Promise<RestaurantDetail[]> {
        const params = new URLSearchParams({ limit: limit.toString() });

        if (latitude !== undefined && longitude !== undefined) {
            params.append('latitude', latitude.toString());
            params.append('longitude', longitude.toString());
            params.append('radius', radius.toString());
        }

        return await apiClient.get<RestaurantDetail[]>(
            `${this.BASE_URL}/featured?${params}`,
            { headers: this.getHeaders() }
        );
    }

    async getNearbyRestaurants(
        latitude: number,
        longitude: number,
        radius: number = 5,
        page: number = 0,
        size: number = 20
    ): Promise<NearbyRestaurantsResponse> {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            radius: radius.toString(),
            page: page.toString(),
            size: size.toString()
        });

        return await apiClient.get<NearbyRestaurantsResponse>(
            `${this.BASE_URL}/nearby?${params}`,
            { headers: this.getHeaders() }
        );
    }

    async searchRestaurants(params: {
        latitude?: number;
        longitude?: number;
        radius?: number;
        searchQuery?: string;
        cuisineTypes?: string[];
        priceRange?: string;
        minRating?: number;
        openNow?: boolean;
        amenities?: string[];
        sortBy?: SortOption;
        page?: number;
        size?: number;
    }): Promise<RestaurantSearchResponse> {
        const searchParams = new URLSearchParams();

        if (params.latitude !== undefined) searchParams.append('latitude', params.latitude.toString());
        if (params.longitude !== undefined) searchParams.append('longitude', params.longitude.toString());
        if (params.radius !== undefined) searchParams.append('radius', params.radius.toString());
        if (params.searchQuery) searchParams.append('searchQuery', params.searchQuery);
        if (params.priceRange) searchParams.append('priceRange', params.priceRange);
        if (params.minRating !== undefined) searchParams.append('minRating', params.minRating.toString());
        if (params.openNow !== undefined) searchParams.append('openNow', params.openNow.toString());
        if (params.sortBy) searchParams.append('sortBy', params.sortBy);
        searchParams.append('page', (params.page || 0).toString());
        searchParams.append('size', (params.size || 20).toString());

        if (params.cuisineTypes) {
            params.cuisineTypes.forEach(cuisine => searchParams.append('cuisineTypes', cuisine));
        }
        if (params.amenities) {
            params.amenities.forEach(amenity => searchParams.append('amenities', amenity));
        }

        return await apiClient.get<RestaurantSearchResponse>(
            `${this.BASE_URL}/search?${searchParams}`,
            { headers: this.getHeaders() }
        );
    }

    async getTopRestaurants(
        category: TopCategory,
        timeRange: TimeRange = TimeRange.ALL_TIME,
        latitude?: number,
        longitude?: number,
        radius?: number,
        limit: number = 10
    ): Promise<TopRestaurantsResponse> {
        const params = new URLSearchParams({
            timeRange: timeRange,
            limit: limit.toString()
        });

        if (latitude !== undefined) params.append('latitude', latitude.toString());
        if (longitude !== undefined) params.append('longitude', longitude.toString());
        if (radius !== undefined) params.append('radius', radius.toString());

        return await apiClient.get<TopRestaurantsResponse>(
            `${this.BASE_URL}/top/${category}?${params}`,
            { headers: this.getHeaders() }
        );
    }
}

export const restaurantService = new RestaurantService();

export {RestaurantService};