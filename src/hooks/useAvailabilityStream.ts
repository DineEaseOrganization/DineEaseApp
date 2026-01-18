// src/hooks/useAvailabilityStream.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { processingService } from '../services/api';
import { availabilityStreamService, AvailabilitySubscription } from '../services/api/availabilityStreamService';
import { AvailabilitySlotsResponse, AvailableSlot } from '../types/api.types';

export interface UseAvailabilityStreamOptions {
  restaurantId: number;
  date: string; // YYYY-MM-DD format
  partySize: number;
  enabled?: boolean; // Whether to enable the hook (default: true)
  isAuthenticated?: boolean; // Whether user is authenticated (enables SSE/polling, default: false)
  pollingIntervalMs?: number; // Fallback polling interval in ms (default: 30000)
  maxRetries?: number; // Maximum number of SSE reconnection attempts (default: 5)
  retryDelayMs?: number; // Base delay between retries in ms (default: 3000)
  enableSSE?: boolean; // Enable SSE streaming (default: true if authenticated)
  enablePolling?: boolean; // Enable fallback polling (default: true if authenticated)
}

export interface UseAvailabilityStreamResult {
  slots: AvailableSlot[];
  allSlots: AvailableSlot[];
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  isStreaming: boolean; // True when SSE is active
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching availability with real-time SSE streaming.
 *
 * Strategy:
 * 1. Immediately fetch initial data via REST API (fast and reliable)
 * 2. Establish SSE connection for real-time updates
 * 3. If SSE fails, fall back to polling at the specified interval
 *
 * When restaurantId, date, or partySize changes:
 * - Old SSE subscription is automatically closed
 * - New subscription is established for the new parameters
 */
export function useAvailabilityStream(
  options: UseAvailabilityStreamOptions,
): UseAvailabilityStreamResult {
  const {
    restaurantId,
    date,
    partySize,
    enabled = true,
    isAuthenticated = false,
    pollingIntervalMs = 30000,
    maxRetries = 5,
    retryDelayMs = 3000,
    enableSSE = isAuthenticated, // Default: only enable SSE if authenticated
    enablePolling = isAuthenticated, // Default: only enable polling if authenticated
  } = options;

  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [allSlots, setAllSlots] = useState<AvailableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const subscriptionRef = useRef<AvailabilitySubscription | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const hasInitialDataRef = useRef(false);
  const sseFailedRef = useRef(false);

  // Cleanup function - disconnects SSE and stops polling
  const cleanup = useCallback(() => {
    // Disconnect SSE
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Handle availability data updates
  const handleAvailabilityData = useCallback((data: AvailabilitySlotsResponse) => {
    if (!isMountedRef.current) return;

    setSlots(data.slots || []);
    setAllSlots(data.allSlots || data.slots || []);
    setLastUpdated(new Date());
    setIsLoading(false);
    setError(null);
    hasInitialDataRef.current = true;
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    if (!restaurantId || !date || partySize <= 0) return;

    try {
      const response = await processingService.getAvailableSlots(
        restaurantId,
        date,
        partySize,
      );
      handleAvailabilityData(response);
    } catch (err: any) {
      console.error('[useAvailabilityStream] Refresh error:', err);
    }
  }, [restaurantId, date, partySize, handleAvailabilityData]);

  // Effect: Initial data fetch and SSE connection
  // This effect runs when restaurantId, date, or partySize changes
  useEffect(() => {
    // Reset state for new subscription
    isMountedRef.current = true;
    hasInitialDataRef.current = false;
    sseFailedRef.current = false;

    // Reset UI state
    setSlots([]);
    setAllSlots([]);
    setIsLoading(true);
    setError(null);
    setIsConnected(false);
    setIsStreaming(false);

    if (!enabled || !restaurantId || !date || partySize <= 0) {
      setIsLoading(false);
      return;
    }

    // Start fallback polling
    const startPolling = () => {
      if (!enablePolling) {
        console.log('[useAvailabilityStream] Polling disabled by configuration');
        return;
      }

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      pollingIntervalRef.current = setInterval(async () => {
        if (!isMountedRef.current) return;
        try {
          const response = await processingService.getAvailableSlots(
            restaurantId,
            date,
            partySize,
          );
          if (isMountedRef.current) {
            handleAvailabilityData(response);
          }
        } catch (err) {
          console.error('[useAvailabilityStream] Polling error:', err);
        }
      }, pollingIntervalMs);
    };

    // Fetch initial data via REST immediately (faster than waiting for SSE)
    const initializeData = async () => {
      try {
        const response = await processingService.getAvailableSlots(
          restaurantId,
          date,
          partySize,
        );
        if (isMountedRef.current) {
          handleAvailabilityData(response);
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        console.error('[useAvailabilityStream] REST fetch error:', err);
        setError(err);
        setIsLoading(false);
      }

      // Then establish SSE connection for real-time updates (only if authenticated)
      if (isMountedRef.current && !sseFailedRef.current && enableSSE) {
        console.log('[useAvailabilityStream] Establishing SSE connection (authenticated)');
        availabilityStreamService.subscribe(
          restaurantId,
          date,
          partySize,
          {
            onInitialData: (data) => {
              if (!isMountedRef.current) return;
              handleAvailabilityData(data);
            },
            onUpdate: (data) => {
              if (!isMountedRef.current) return;
              handleAvailabilityData(data);
            },
            onConnected: () => {
              if (!isMountedRef.current) return;
              setIsConnected(true);
              setIsStreaming(true);
              setError(null);
              // Stop polling if it was running as fallback
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            },
            onDisconnected: () => {
              if (!isMountedRef.current) return;
              setIsConnected(false);
              setIsStreaming(false);
            },
            onError: (err) => {
              if (!isMountedRef.current) return;
              console.error('[useAvailabilityStream] SSE error:', err);
              // Don't set error state if we have data - just fall back to polling
              if (!hasInitialDataRef.current) {
                setError(err);
              }
              // Mark SSE as failed and start polling
              sseFailedRef.current = true;
              setIsStreaming(false);
              startPolling();
            },
          },
          {
            maxReconnectAttempts: maxRetries,
            reconnectDelayMs: retryDelayMs,
          }
        ).then(subscription => {
          if (isMountedRef.current) {
            subscriptionRef.current = subscription;
          } else {
            // Component unmounted before subscription completed
            subscription.unsubscribe();
          }
        }).catch(err => {
          console.error('[useAvailabilityStream] Failed to establish SSE connection:', err);
          if (isMountedRef.current && enablePolling) {
            startPolling();
          }
        });
      } else if (!enableSSE && enablePolling) {
        // If SSE is disabled but polling is enabled, start polling immediately
        console.log('[useAvailabilityStream] SSE disabled, starting polling');
        startPolling();
      } else if (!isAuthenticated) {
        console.log('[useAvailabilityStream] User not authenticated - only initial fetch performed');
      }
    };

    initializeData();

    // Cleanup function - runs when dependencies change or component unmounts
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [enabled, restaurantId, date, partySize, pollingIntervalMs, handleAvailabilityData]);

  return {
    slots,
    allSlots,
    isLoading,
    error,
    isConnected,
    isStreaming,
    lastUpdated,
    refresh,
  };
}

export default useAvailabilityStream;
