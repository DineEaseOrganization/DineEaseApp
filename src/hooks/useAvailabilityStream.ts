// src/hooks/useAvailabilityStream.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { processingService } from '../services/api';
import { AvailabilitySlotsResponse, AvailableSlot } from '../types/api.types';

export interface UseAvailabilityStreamOptions {
  restaurantId: number;
  date: string; // YYYY-MM-DD format
  partySize: number;
  sectionName?: string; // Optional. When provided, restricts slots to tables in that section
  tableType?: string; // Optional. When provided (with sectionName), restricts slots to that table shape
  enabled?: boolean; // Whether to enable the hook (default: true)
  isFocused?: boolean; // Whether the screen is focused - pauses polling when false (default: true)
  pollingIntervalMs?: number; // Polling interval in ms (default: 30000)
}

export interface UseAvailabilityStreamResult {
  slots: AvailableSlot[];
  allSlots: AvailableSlot[];
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  isStreaming: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching availability with periodic polling.
 *
 * Strategy:
 * 1. Immediately fetch initial data via REST API
 * 2. Poll at the specified interval for updates
 * 3. Pause polling when screen loses focus, resume on refocus
 */
export function useAvailabilityStream(
  options: UseAvailabilityStreamOptions,
): UseAvailabilityStreamResult {
  const {
    restaurantId,
    date,
    partySize,
    sectionName,
    tableType,
    enabled = true,
    isFocused = true,
    pollingIntervalMs = 30000,
  } = options;

  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [allSlots, setAllSlots] = useState<AvailableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Handle availability data updates
  const handleAvailabilityData = useCallback((data: AvailabilitySlotsResponse) => {
    if (!isMountedRef.current) return;

    setSlots(data.slots || []);
    setAllSlots(data.allSlots || data.slots || []);
    setLastUpdated(new Date());
    setIsLoading(false);
    setError(null);
  }, []);

  // Fetch availability data
  const fetchAvailability = useCallback(async () => {
    if (!restaurantId || !date || partySize <= 0) return;

    try {
      const response = await processingService.getAvailableSlots(
        restaurantId,
        date,
        partySize,
        sectionName,
        tableType,
      );
      if (isMountedRef.current) {
        handleAvailabilityData(response);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('[useAvailabilityStream] Fetch error:', err);
      setError(err);
      setIsLoading(false);
    }
  }, [restaurantId, date, partySize, sectionName, tableType, handleAvailabilityData]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchAvailability();
  }, [fetchAvailability]);

  // Effect: Initial fetch + polling
  useEffect(() => {
    isMountedRef.current = true;

    if (!isFocused) {
      // Screen lost focus — stop polling but preserve existing slot data
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Reset UI state for new params
    setSlots([]);
    setAllSlots([]);
    setIsLoading(true);
    setError(null);

    if (!enabled || !restaurantId || !date || partySize <= 0) {
      setIsLoading(false);
      return;
    }

    // Fetch immediately
    fetchAvailability();

    // Start polling
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchAvailability();
      }
    }, pollingIntervalMs);

    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, isFocused, restaurantId, date, partySize, sectionName, tableType, pollingIntervalMs, fetchAvailability]);

  return {
    slots,
    allSlots,
    isLoading,
    error,
    isConnected: false, // No SSE — always false
    isStreaming: false, // No SSE — always false
    lastUpdated,
    refresh,
  };
}

export default useAvailabilityStream;
