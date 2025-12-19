// src/services/api/processingService.ts
import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../../config/api.config';
import { AvailabilitySlotsResponse } from '../../types/api.types';

class ProcessingService {
  private readonly BASE_URL = `${API_CONFIG.PROCESSING_SERVICE_URL}/mobile`;
  private readonly API_KEY = 'dineease-mobile-2024-secret';

  private getHeaders() {
    return {
      'X-API-Key': this.API_KEY,
      'X-Platform': Platform.OS === 'ios' ? 'iOS' : 'Android',
      'X-App-Version': '1.0.0',
    };
  }

  /**
   * Get available time slots for a restaurant
   * Endpoint: GET /mobile/availability/{restaurantId}?date=YYYY-MM-DD&partySize=2
   *
   * @param restaurantId - Restaurant ID
   * @param date - Date in YYYY-MM-DD format
   * @param partySize - Number of people
   */
  async getAvailableSlots(
    restaurantId: number,
    date: string,
    partySize: number
  ): Promise<AvailabilitySlotsResponse> {
    const params = new URLSearchParams({
      date: date,
      partySize: partySize.toString(),
    });

    return await apiClient.get<AvailabilitySlotsResponse>(
      `${this.BASE_URL}/availability/${restaurantId}?${params}`,
      { headers: this.getHeaders() }
    );
  }
}

export const processingService = new ProcessingService();

export { ProcessingService };