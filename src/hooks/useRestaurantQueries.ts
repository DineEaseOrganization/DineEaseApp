// src/hooks/useRestaurantQueries.ts
import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '../services/api';
import { TopCategory, TimeRange } from '../types/api.types';
import { LocationData } from './useLocation';
import { CACHE_CONFIG } from '../config/cache.config';

/**
 * Query key factories — ensures consistent, composable cache keys.
 * Changing any parameter changes the key → triggers a new query.
 */
export const restaurantKeys = {
  nearby: (lat: number, lng: number, radius: number, page: number) =>
    ['restaurants', 'nearby', lat, lng, radius, page] as const,
  featured: (lat: number, lng: number, radius: number) =>
    ['restaurants', 'featured', lat, lng, radius] as const,
  top: (category: string, lat: number, lng: number, radius: number) =>
    ['restaurants', 'top', category, lat, lng, radius] as const,
  cuisines: (lat: number, lng: number, radius: number) =>
    ['restaurants', 'cuisines', lat, lng, radius] as const,
  detail: (id: number) =>
    ['restaurants', 'detail', id] as const,
};

/**
 * Nearby restaurants — stale time from CACHE_CONFIG.NEARBY_RESTAURANTS.
 * Refetches automatically when location or radius changes.
 */
export function useNearbyRestaurants(location: LocationData | null, radius: number) {
  return useQuery({
    queryKey: restaurantKeys.nearby(
      location?.latitude ?? 0,
      location?.longitude ?? 0,
      radius,
      0,
    ),
    queryFn: () =>
      restaurantService.getNearbyRestaurants(
        location!.latitude,
        location!.longitude,
        radius,
        0,
        20,
      ),
    enabled: !!location,
    staleTime: CACHE_CONFIG.NEARBY_RESTAURANTS,
  });
}

/**
 * Featured restaurants — stale time from CACHE_CONFIG.FEATURED_RESTAURANTS.
 */
export function useFeaturedRestaurants(location: LocationData | null, radius: number) {
  return useQuery({
    queryKey: restaurantKeys.featured(
      location?.latitude ?? 0,
      location?.longitude ?? 0,
      radius,
    ),
    queryFn: () =>
      restaurantService.getFeaturedRestaurants(
        10,
        location!.latitude,
        location!.longitude,
        radius,
      ),
    enabled: !!location,
    staleTime: CACHE_CONFIG.FEATURED_RESTAURANTS,
  });
}

/**
 * Top restaurants by category — stale time from CACHE_CONFIG.TOP_RESTAURANTS.
 * Falls back from THIS_WEEK to ALL_TIME automatically if no results.
 */
export function useTopRestaurants(
  category: TopCategory,
  location: LocationData | null,
  radius: number,
) {
  return useQuery({
    queryKey: restaurantKeys.top(
      category,
      location?.latitude ?? 0,
      location?.longitude ?? 0,
      radius,
    ),
    queryFn: async () => {
      let data = await restaurantService.getTopRestaurants(
        category,
        TimeRange.THIS_WEEK,
        location!.latitude,
        location!.longitude,
        radius,
        10,
      );
      if (data.restaurants.length === 0) {
        data = await restaurantService.getTopRestaurants(
          category,
          TimeRange.ALL_TIME,
          location!.latitude,
          location!.longitude,
          radius,
          10,
        );
      }
      return data;
    },
    enabled: !!location,
    staleTime: CACHE_CONFIG.TOP_RESTAURANTS,
  });
}

/**
 * Available cuisine types — stale time from CACHE_CONFIG.CUISINES.
 */
export function useAvailableCuisines(location: LocationData | null, radius: number) {
  return useQuery({
    queryKey: restaurantKeys.cuisines(
      location?.latitude ?? 0,
      location?.longitude ?? 0,
      radius,
    ),
    queryFn: () =>
      restaurantService.getAvailableCuisines(
        location!.latitude,
        location!.longitude,
        radius,
      ),
    enabled: !!location,
    staleTime: CACHE_CONFIG.CUISINES,
  });
}

/**
 * Full restaurant detail — stale time from CACHE_CONFIG.RESTAURANT_DETAIL.
 * Back-navigation to the same restaurant will be instant within the stale window.
 */
export function useRestaurantDetail(restaurantId: number) {
  return useQuery({
    queryKey: restaurantKeys.detail(restaurantId),
    queryFn: () => restaurantService.getRestaurantById(restaurantId),
    staleTime: CACHE_CONFIG.RESTAURANT_DETAIL,
  });
}
