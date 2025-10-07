// src/services/api/profileService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {apiClient} from './apiClient';
import {API_CONFIG, STORAGE_KEYS} from '../../config/api.config';
import {
  DeleteAccountRequest,
  DeleteAccountResponse,
  ProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '../../types/api.types';

class ProfileService {
  /**
   * Get user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await apiClient.get<ProfileResponse>(
      API_CONFIG.ENDPOINTS.GET_PROFILE
    );

    // Update local user data cache
    if (response) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response));
    }

    return response;
  }

  /**
   * Update user profile
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const response = await apiClient.put<UpdateProfileResponse>(
      API_CONFIG.ENDPOINTS.UPDATE_PROFILE,
      request
    );

    // Update local user data cache
    if (response.success && response.profile) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.profile));
    }

    return response;
  }

  /**
   * Delete or deactivate account
   */
  async deleteAccount(request: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    const response = await apiClient.delete<DeleteAccountResponse>(
      API_CONFIG.ENDPOINTS.DELETE_ACCOUNT,
      {data: request}
    );

    // If account deleted, clear all local data
    if (response.success) {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.DEVICE_ID,
      ]);
    }

    return response;
  }
}

// Export singleton instance
export const profileService = new ProfileService();

// Export class for testing or advanced usage
export {ProfileService};