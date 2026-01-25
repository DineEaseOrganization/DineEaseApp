// src/hooks/useReservations.ts
import { useState, useEffect, useCallback } from 'react';
import { processingService } from '../services/api/processingService';
import { ReservationDto } from '../types/api.types';

export interface UseReservationsResult {
  reservations: ReservationDto[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  cancelReservation: (reservationId: number) => Promise<void>;
  // Pagination support
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
  isFirstPage?: boolean;
  isLastPage?: boolean;
  loadMore?: () => Promise<void>;
  hasMore?: boolean;
}

/**
 * Hook to fetch and manage customer reservations.
 *
 * Features:
 * - Automatically fetches reservations on mount
 * - Provides loading and error states
 * - Allows manual refetch
 * - Provides cancel reservation functionality
 * - Optional pagination support
 * - Filter by all/upcoming/past
 *
 * @param options.enabled - Whether to fetch reservations (default: true)
 * @param options.refetchOnMount - Whether to refetch when component remounts (default: true)
 * @param options.usePagination - Whether to use paginated API (default: false)
 * @param options.filter - Filter type: "all", "upcoming", or "past" (default: "all")
 * @param options.pageSize - Page size for pagination (default: 20)
 */
export function useReservations(options?: {
  enabled?: boolean;
  refetchOnMount?: boolean;
  usePagination?: boolean;
  filter?: 'all' | 'upcoming' | 'past';
  pageSize?: number;
}): UseReservationsResult {
  const {
    enabled = true,
    refetchOnMount = true,
    usePagination = false,
    filter = 'all',
    pageSize = 20
  } = options || {};

  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState<number | undefined>(undefined);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const [isFirstPage, setIsFirstPage] = useState<boolean | undefined>(undefined);
  const [isLastPage, setIsLastPage] = useState<boolean | undefined>(undefined);

  const fetchReservations = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (usePagination) {
        const response = await processingService.getCustomerReservationsPaginated(
          filter,
          page,
          pageSize,
          'reservationDate,desc'
        );

        if (append) {
          setReservations(prev => [...prev, ...response.content]);
        } else {
          setReservations(response.content);
        }

        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
        setCurrentPage(response.number);
        setIsFirstPage(response.first);
        setIsLastPage(response.last);
      } else {
        const data = await processingService.getCustomerReservations();
        setReservations(data);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('[useReservations] Error fetching reservations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, usePagination, filter, pageSize]);

  const loadMore = useCallback(async () => {
    if (!usePagination || isLastPage || isLoading) {
      return;
    }
    await fetchReservations(currentPage + 1, true);
  }, [usePagination, isLastPage, isLoading, currentPage, fetchReservations]);

  const cancelReservation = useCallback(async (reservationId: number) => {
    try {
      await processingService.cancelReservation(reservationId);
      // Refetch reservations after successful cancellation
      await fetchReservations(0, false);
    } catch (err) {
      const error = err as Error;
      console.error('[useReservations] Error canceling reservation:', error);
      throw error; // Re-throw so the calling component can handle it
    }
  }, [fetchReservations]);

  useEffect(() => {
    if (refetchOnMount) {
      fetchReservations(0, false);
    }
  }, [refetchOnMount, fetchReservations]);

  return {
    reservations,
    isLoading,
    error,
    refetch: () => fetchReservations(0, false),
    cancelReservation,
    // Pagination fields (only populated when usePagination is true)
    totalElements,
    totalPages,
    currentPage,
    isFirstPage,
    isLastPage,
    loadMore,
    hasMore: usePagination ? !isLastPage : false,
  };
}
