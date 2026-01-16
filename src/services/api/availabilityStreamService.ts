import { Platform } from 'react-native';
import { API_CONFIG } from '../../config/api.config';
import { AvailabilitySlotsResponse } from '../../types/api.types';

export interface AvailabilityStreamCallbacks {
  onInitialData: (data: AvailabilitySlotsResponse) => void;
  onUpdate: (data: AvailabilitySlotsResponse) => void;
  onError: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export interface AvailabilitySubscription {
  unsubscribe: () => void;
  isConnected: () => boolean;
}

/**
 * SSE-based availability stream service.
 *
 * Note: React Native's fetch API doesn't support ReadableStream/getReader().
 * This implementation uses XMLHttpRequest with streaming response handling,
 * which works better in React Native for SSE connections.
 */
class AvailabilityStreamService {
  private readonly BASE_URL = `${API_CONFIG.PROCESSING_SERVICE_URL}/mobile/availability-stream`;
  private readonly API_KEY = 'dineease-mobile-2024-secret';
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private activeXHRs: Map<string, XMLHttpRequest> = new Map();
  private intentionalClosures: Set<string> = new Set();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY_MS = 3000;

  private getSubscriptionKey(restaurantId: number, date: string, partySize: number): string {
    return `${restaurantId}-${date}-${partySize}`;
  }

  /**
   * Subscribe to real-time availability updates using XMLHttpRequest.
   * This approach works better in React Native than fetch for SSE.
   */
  subscribe(
    restaurantId: number,
    date: string,
    partySize: number,
    callbacks: AvailabilityStreamCallbacks
  ): AvailabilitySubscription {
    const subscriptionKey = this.getSubscriptionKey(restaurantId, date, partySize);

    // Close existing connection if any
    this.closeConnection(subscriptionKey);

    // Remove intentional closure marker since we're creating a new subscription
    this.intentionalClosures.delete(subscriptionKey);

    const params = new URLSearchParams({
      date: date,
      partySize: partySize.toString(),
    });

    const url = `${this.BASE_URL}/subscribe/${restaurantId}?${params}`;

    let isConnected = false;
    let buffer = '';

    const xhr = new XMLHttpRequest();
    this.activeXHRs.set(subscriptionKey, xhr);

    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.setRequestHeader('X-API-Key', this.API_KEY);
    xhr.setRequestHeader('X-Mobile-App', 'true'); // Tells backend to use modern JWT parser
    xhr.setRequestHeader('X-Platform', Platform.OS === 'ios' ? 'iOS' : 'Android');
    xhr.setRequestHeader('X-App-Version', '1.0.0');

    // Track response progress for streaming
    let lastIndex = 0;

    xhr.onreadystatechange = () => {
      // State 3 = LOADING (receiving data)
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        if (xhr.status === 200) {
          if (!isConnected) {
            isConnected = true;
            this.reconnectAttempts.set(subscriptionKey, 0);
            callbacks.onConnected?.();
          }

          // Get new data since last check
          const newData = xhr.responseText.substring(lastIndex);
          lastIndex = xhr.responseText.length;

          if (newData) {
            buffer += newData;
            this.processBuffer(buffer, callbacks, (remaining) => {
              buffer = remaining;
            });
          }
        }
      }

      // State 4 = DONE (connection closed)
      if (xhr.readyState === 4) {
        isConnected = false;
        callbacks.onDisconnected?.();

        if (xhr.status !== 200 && xhr.status !== 0) {
          console.error('[AvailabilityStream] Connection error, status:', xhr.status);
          callbacks.onError(new Error(`SSE connection failed: ${xhr.status}`));
        }

        // Only attempt reconnect if this wasn't an intentional closure
        if (!this.intentionalClosures.has(subscriptionKey)) {
          this.scheduleReconnect(subscriptionKey, restaurantId, date, partySize, callbacks);
        }
      }
    };

    xhr.onerror = () => {
      console.error('[AvailabilityStream] XHR error');
      isConnected = false;
      callbacks.onError(new Error('Network request failed'));
      callbacks.onDisconnected?.();

      // Only attempt reconnect if this wasn't an intentional closure
      if (!this.intentionalClosures.has(subscriptionKey)) {
        this.scheduleReconnect(subscriptionKey, restaurantId, date, partySize, callbacks);
      }
    };

    xhr.ontimeout = () => {
      console.warn('[AvailabilityStream] Connection timeout');
      isConnected = false;
      callbacks.onDisconnected?.();

      // Only attempt reconnect if this wasn't an intentional closure
      if (!this.intentionalClosures.has(subscriptionKey)) {
        this.scheduleReconnect(subscriptionKey, restaurantId, date, partySize, callbacks);
      }
    };

    // Set a long timeout for SSE connections
    xhr.timeout = 3600000; // 1 hour

    xhr.send();

    return {
      unsubscribe: () => {
        this.closeConnection(subscriptionKey);
      },
      isConnected: () => isConnected,
    };
  }

  /**
   * Process the SSE buffer and extract complete events
   */
  private processBuffer(
    buffer: string,
    callbacks: AvailabilityStreamCallbacks,
    setRemaining: (remaining: string) => void
  ): void {
    const lines = buffer.split('\n');
    let eventType = '';
    let eventData = '';
    let processedUpTo = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        eventData = line.slice(5).trim();
      } else if (line === '' && eventData) {
        // End of event - process it
        this.processEvent(eventType, eventData, callbacks);
        eventType = '';
        eventData = '';
        processedUpTo = i + 1;
      }
    }

    // Keep unprocessed data in buffer
    const remaining = lines.slice(processedUpTo).join('\n');
    setRemaining(remaining);
  }

  private processEvent(
    eventType: string,
    eventData: string,
    callbacks: AvailabilityStreamCallbacks
  ): void {
    try {
      // Handle heartbeat separately - no JSON parsing needed
      if (eventType === 'heartbeat') {
        return;
      }

      const data = JSON.parse(eventData) as AvailabilitySlotsResponse;

      switch (eventType) {
        case 'availability':
          // Initial availability data from backend
          callbacks.onInitialData(data);
          break;
        case 'availability-update':
          // Real-time update when availability changes
          callbacks.onUpdate(data);
          break;
        default:
          // Handle unknown event types - treat as update
          if (eventType) {
            callbacks.onUpdate(data);
          } else {
            // No event type specified, treat as initial
            callbacks.onInitialData(data);
          }
      }
    } catch (error) {
      console.error('[AvailabilityStream] Failed to parse event data:', error, 'Raw data:', eventData);
    }
  }

  private scheduleReconnect(
    subscriptionKey: string,
    restaurantId: number,
    date: string,
    partySize: number,
    callbacks: AvailabilityStreamCallbacks
  ): void {
    const attempts = this.reconnectAttempts.get(subscriptionKey) || 0;

    if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.warn('[AvailabilityStream] Max reconnect attempts reached for', subscriptionKey);
      callbacks.onError(new Error('Max reconnection attempts reached'));
      return;
    }

    // Clear any existing reconnect timeout
    const existingTimeout = this.reconnectTimeouts.get(subscriptionKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Exponential backoff
    const delay = this.RECONNECT_DELAY_MS * Math.pow(2, attempts);

    const timeout = setTimeout(() => {
      this.reconnectAttempts.set(subscriptionKey, attempts + 1);
      this.subscribe(restaurantId, date, partySize, callbacks);
    }, delay);

    this.reconnectTimeouts.set(subscriptionKey, timeout);
  }

  private async closeConnection(subscriptionKey: string): Promise<void> {
    // Mark this closure as intentional to prevent reconnection
    this.intentionalClosures.add(subscriptionKey);

    // Clear reconnect timeout first
    const timeout = this.reconnectTimeouts.get(subscriptionKey);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(subscriptionKey);
    }

    // Parse subscription key to get parameters for unsubscribe call
    const parts = subscriptionKey.split('-');
    if (parts.length >= 3) {
      const restaurantId = parts[0];
      // Date is parts[1]-parts[2]-parts[3] (YYYY-MM-DD)
      const date = `${parts[1]}-${parts[2]}-${parts[3]}`;
      const partySize = parts[4];

      // Call backend unsubscribe endpoint to force cleanup
      // Use fetch with async/await since React Native doesn't support synchronous XHR
      const unsubscribeUrl = `${this.BASE_URL}/unsubscribe/${restaurantId}?date=${date}&partySize=${partySize}`;

      // Fire-and-forget async unsubscribe request
      fetch(unsubscribeUrl, {
        method: 'DELETE',
        headers: {
          'X-API-Key': this.API_KEY,
        },
      })
        .then((response) => {
          if (!response.ok) {
            console.warn('[AvailabilityStream] Backend unsubscribe failed:', response.status);
          }
        })
        .catch((error) => {
          console.error('[AvailabilityStream] Error calling backend unsubscribe:', error);
        });
    }

    // Abort active XHR
    const xhr = this.activeXHRs.get(subscriptionKey);
    if (xhr) {
      // Remove from active map before aborting to prevent race conditions
      this.activeXHRs.delete(subscriptionKey);

      // Abort the connection - this will trigger onreadystatechange
      xhr.abort();
    }

    // Reset reconnect attempts
    this.reconnectAttempts.delete(subscriptionKey);

    // Clean up intentional closure marker after a delay
    // This ensures the abort() has completed and all handlers have run
    setTimeout(() => {
      this.intentionalClosures.delete(subscriptionKey);
    }, 500);
  }

  /**
   * Close all active connections
   */
  closeAll(): void {
    for (const key of this.activeXHRs.keys()) {
      this.closeConnection(key);
    }
  }
}

export const availabilityStreamService = new AvailabilityStreamService();
export { AvailabilityStreamService };
