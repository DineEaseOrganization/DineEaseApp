// src/services/api/updatesService.ts
import { apiClient } from './apiClient';
import { API_CONFIG } from '../../config/api.config';
import axios from 'axios';

// Types matching backend DTOs
export interface MobileUpdate {
    updateId: number | null;
    mobileCustomerId: number; // BIGINT (mobile_customer_id)
    restaurantId: number | null;
    reservationId: number | null;
    updateCategory: 'RESERVATION' | 'REVIEW' | 'RESTAURANT_NEWS' | 'APP_UPDATE' | 'SYSTEM';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    restaurantName: string | null;
    restaurantImageUrl: string | null;
    icon: string | null;
    actionButton: ActionButton | null;
    isRead: boolean;
    createdAt: string; // ISO 8601 datetime string
    readAt: string | null; // ISO 8601 datetime string
}

export interface ActionButton {
    label: string;
    data: Record<string, any> | null;
}

export interface UpdatesPage {
    content: MobileUpdate[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    unreadCount: number;
}

export interface CreateUpdate {
    mobileCustomerId: number; // BIGINT (mobile_customer_id)
    restaurantId?: number;
    reservationId?: number;
    updateCategory: string;
    title: string;
    message: string;
    priority?: string;
    restaurantName?: string;
    restaurantImageUrl?: string;
    icon?: string;
    actionButtonLabel?: string;
    actionButtonData?: Record<string, any>;
}

class UpdatesService {
    private baseUrl = API_CONFIG.PROCESSING_SERVICE_URL;

    /**
     * Get paginated updates for a customer
     * mobileCustomerId is extracted from JWT token on the backend
     */
    async getUpdates(
        category?: string,
        page: number = 0,
        size: number = 20
    ): Promise<UpdatesPage> {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });

        if (category && category !== 'all') {
            params.append('category', category.toUpperCase());
        }

        const url = `${this.baseUrl}/mobile/updates?${params.toString()}`;
        return await apiClient.get<UpdatesPage>(url);
    }

    /**
     * Get count of unread updates
     * mobileCustomerId is extracted from JWT token on the backend
     */
    async getUnreadCount(): Promise<number> {
        const url = `${this.baseUrl}/mobile/updates/unread-count`;
        const response = await apiClient.get<{ unreadCount: number }>(url);
        return response.unreadCount;
    }

    /**
     * Mark a single update as read
     * mobileCustomerId is extracted from JWT token on the backend
     */
    async markAsRead(updateId: number): Promise<MobileUpdate> {
        const url = `${this.baseUrl}/mobile/updates/${updateId}/read`;
        return await apiClient.put<MobileUpdate>(url);
    }

    /**
     * Mark all updates as read for a customer
     * mobileCustomerId is extracted from JWT token on the backend
     */
    async markAllAsRead(): Promise<number> {
        const url = `${this.baseUrl}/mobile/updates/read-all`;
        const response = await apiClient.put<{ updatedCount: number }>(url);
        return response.updatedCount;
    }

    /**
     * Delete a single update
     * mobileCustomerId is extracted from JWT token on the backend
     */
    async deleteUpdate(updateId: number): Promise<void> {
        const url = `${this.baseUrl}/mobile/updates/${updateId}`;
        await apiClient.delete<void>(url);
    }

    /**
     * Create a new update (typically used internally by backend)
     */
    async createUpdate(createDto: CreateUpdate): Promise<MobileUpdate> {
        const url = `${this.baseUrl}/mobile/updates`;
        return await apiClient.post<MobileUpdate>(url, createDto);
    }
}

export const updatesService = new UpdatesService();
