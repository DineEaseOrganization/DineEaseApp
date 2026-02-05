// src/services/api/processingService.ts
import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import { API_CONFIG } from '../../config/api.config';
import { AvailabilitySlotsResponse, ReservationDto } from '../../types/api.types';
import { Review } from '../../types';

export interface SubmitReviewRequest {
  reservationId: number;
  restaurantId: number;
  overallRating: number;
  reviewText?: string;
  categoryRatings: { categoryId: number; score: number }[];
}

export interface ReviewResponse {
  reviewId: number;
  reservationId: number;
  restaurantId: number;
  restaurantName: string | null;
  customerName: string;
  overallRating: number;
  reviewText: string | null;
  categoryRatings: { categoryId: number; categoryName: string; score: number }[];
  createdAt: string;
  isVerified: boolean;
}

export interface RatingCategory {
  categoryId: number;
  name: string;
  displayOrder: number;
}

class ProcessingService {
  private readonly BASE_URL = `${API_CONFIG.PROCESSING_SERVICE_URL}/mobile`;
  private readonly API_KEY = 'dineease-mobile-2024-secret';

  private getHeaders() {
    return {
      'X-API-Key': this.API_KEY,
      'X-Mobile-App': 'true', // Tells backend to use modern JWT parser
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

  /**
   * Create a new reservation
   * Endpoint: POST /mobile/reservations/book
   * Note: This endpoint requires JWT authentication (handled automatically by apiClient)
   *
   * @param reservation - Reservation details
   */
  async createReservation(reservation: {
    reservationDate: string; // YYYY-MM-DD
    reservationStartTime: string; // HH:mm
    reservationDuration: number; // minutes
    partySize: number;
    noOfAdults?: number;
    noOfKids?: number;
    isSmoking: boolean;
    customer: {
      name: string;
      phoneNumber: string;
      email?: string;
    };
    restaurantId: number;
    area?: string;
    tableNumbers?: string[];
    state: string; // e.g., "CONFIRMED"
    comments?: string;
    reservationTypeId?: number;
  }): Promise<any> {
    // Don't pass custom headers - let apiClient handle JWT authentication
    return await apiClient.post<any>(
      `${this.BASE_URL}/reservations/book`,
      reservation
    );
  }

  /**
   * Get all reservations for the authenticated customer
   * Endpoint: GET /mobile/reservations/customer
   * Note: This endpoint requires JWT authentication. Customer ID is extracted from JWT token.
   *
   * @returns List of reservations for the authenticated customer
   */
  async getCustomerReservations(): Promise<ReservationDto[]> {
    return await apiClient.get<ReservationDto[]>(
      `${this.BASE_URL}/reservations/customer`
    );
  }

  /**
   * Get the total reservation count for the authenticated customer.
   * Lightweight alternative to getCustomerReservations() for profile stats.
   * Endpoint: GET /mobile/reservations/customer/count
   */
  async getCustomerReservationCount(): Promise<{ count: number }> {
    return await apiClient.get<{ count: number }>(
      `${this.BASE_URL}/reservations/customer/count`
    );
  }

  /**
   * Get paginated reservations for the authenticated customer with filtering
   * Endpoint: GET /mobile/reservations/customer/paginated
   * Note: This endpoint requires JWT authentication. Customer ID is extracted from JWT token.
   *
   * @param filter - Filter type: "all", "upcoming", or "past"
   * @param page - Page number (0-indexed)
   * @param size - Page size
   * @param sort - Sort field and direction (e.g., "reservationDate,desc")
   * @returns Paginated response with reservations
   */
  async getCustomerReservationsPaginated(
    filter: 'all' | 'upcoming' | 'past' = 'all',
    page: number = 0,
    size: number = 20,
    sort: string = 'reservationDate,desc'
  ): Promise<{
    content: ReservationDto[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
  }> {
    const params = new URLSearchParams({
      filter,
      page: page.toString(),
      size: size.toString(),
      sort,
    });

    return await apiClient.get(
      `${this.BASE_URL}/reservations/customer/paginated?${params}`
    );
  }

  /**
   * Cancel a reservation
   * Endpoint: DELETE /mobile/reservations/{reservationId}
   * Note: This endpoint requires JWT authentication.
   *
   * @param reservationId - The ID of the reservation to cancel
   * @returns Success response with message
   */
  async cancelReservation(reservationId: number): Promise<{ success: boolean; message: string }> {
    return await apiClient.delete<{ success: boolean; message: string }>(
      `${this.BASE_URL}/reservations/${reservationId}`
    );
  }

  // ============ REVIEW ENDPOINTS ============

  async submitReview(request: SubmitReviewRequest): Promise<ReviewResponse> {
    return await apiClient.post<ReviewResponse>(
      `${this.BASE_URL}/reviews`,
      request
    );
  }

  async getCustomerReviews(): Promise<ReviewResponse[]> {
    return await apiClient.get<ReviewResponse[]>(
      `${this.BASE_URL}/reviews/customer`
    );
  }

  async getCustomerReviewCount(): Promise<{ count: number }> {
    return await apiClient.get<{ count: number }>(
      `${this.BASE_URL}/reviews/customer/count`
    );
  }

  async getRestaurantReviews(restaurantId: number): Promise<ReviewResponse[]> {
    return await apiClient.get<ReviewResponse[]>(
      `${this.BASE_URL}/reviews/restaurant/${restaurantId}`
    );
  }

  async deleteReview(reviewId: number): Promise<{ success: boolean; message: string }> {
    return await apiClient.delete<{ success: boolean; message: string }>(
      `${this.BASE_URL}/reviews/${reviewId}`
    );
  }

  // ============ RATING CATEGORY ENDPOINTS ============

  async getRatingCategories(restaurantId: number): Promise<RatingCategory[]> {
    return await apiClient.get<RatingCategory[]>(
      `${API_CONFIG.RESTAURANT_SERVICE_URL}/customer/restaurants/${restaurantId}/rating-categories`,
      { headers: this.getHeaders() }
    );
  }
}

export const processingService = new ProcessingService();

export { ProcessingService };