// src/services/api/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {apiClient} from './apiClient';
import {API_CONFIG, STORAGE_KEYS} from '../../config/api.config';
import {
  CheckVerificationStatusResponse,
  DeviceInfo,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  TokenPair,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '../../types/api.types';
import uuid from 'react-native-uuid';

class AuthService {
  async getUserData(): Promise<any | null> {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    return !!accessToken;
  }

  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      API_CONFIG.ENDPOINTS.REGISTER,
      request
    );

    if (response.success && response.data) {
      await this.storeAuthData(response.data);
    }

    return response;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const deviceInfo = await this.getDeviceInfo();

    const request: LoginRequest = {
      email,
      password,
      deviceInfo,
    };

    const response = await apiClient.post<LoginResponse>(
      API_CONFIG.ENDPOINTS.LOGIN,
      request
    );

    if (response.success && response.data) {
      await this.storeAuthData(response.data);
    }

    return response;
  }

  /**
   * Logout from current device
   */
  async logout(): Promise<LogoutResponse> {
    const refreshToken = await this.getRefreshToken();

    if (!refreshToken) {
      await this.clearAuthData();
      return {
        success: true,
        message: 'Logged out locally',
      };
    }

    try {
      const request: LogoutRequest = {
        refreshToken,
      };

      return await apiClient.post<LogoutResponse>(
        API_CONFIG.ENDPOINTS.LOGOUT,
        request
      );
    } finally {
      await this.clearAuthData();
    }
  }

  // ============ AUTHENTICATION ENDPOINTS ============

  /**
   * Logout from all devices
   */
  async logoutAllDevices(): Promise<LogoutResponse> {
    try {
      return await apiClient.post<LogoutResponse>(
        API_CONFIG.ENDPOINTS.LOGOUT_ALL
      );
    } finally {
      await this.clearAuthData();
    }
  }

  /**
   * Logout specific device
   */
  async logoutDevice(deviceId: string): Promise<LogoutResponse> {
    return await apiClient.post<LogoutResponse>(
      API_CONFIG.ENDPOINTS.LOGOUT_DEVICE,
      {deviceId}
    );
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenPair> {
    const refreshToken = await this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const request: RefreshTokenRequest = {
      refreshToken,
    };

    const response = await apiClient.post<TokenPair>(
      API_CONFIG.ENDPOINTS.REFRESH_TOKEN,
      request
    );

    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);

    return response;
  }

  /**
   * Verify email with code
   */
  async verifyEmail(verificationCode: string): Promise<VerifyEmailResponse> {
    const request: VerifyEmailRequest = {
      verificationCode,
    };

    const response = await apiClient.post<VerifyEmailResponse>(
      API_CONFIG.ENDPOINTS.VERIFY_EMAIL,
      request
    );

    if (response.success && response.emailVerified) {
      const userData = await this.getUserData();
      if (userData) {
        userData.emailVerified = true;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      }
    }

    return response;
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<ResendVerificationResponse> {
    const request: ResendVerificationRequest = {
      email,
    };

    return await apiClient.post<ResendVerificationResponse>(
      API_CONFIG.ENDPOINTS.RESEND_VERIFICATION,
      request
    );
  }

  /**
   * Check email verification status
   */
  async checkVerificationStatus(): Promise<CheckVerificationStatusResponse> {
    return await apiClient.get<CheckVerificationStatusResponse>(
      API_CONFIG.ENDPOINTS.VERIFICATION_STATUS
    );
  }

  // ============ EMAIL VERIFICATION ENDPOINTS ============

  // ============ DEVICE INFO ============
  private async getDeviceInfo(): Promise<DeviceInfo> {
    // Try to get existing device UUID from AsyncStorage
    let deviceUuid = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);

    if (!deviceUuid) {
      // First time - generate new UUID and save it
      deviceUuid = uuid.v4() as string;
      console.log(deviceUuid)
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceUuid);
      console.log('🆕 Generated new device UUID:', deviceUuid);
    } else {
      console.log('♻️ Using existing device UUID:', deviceUuid);
    }

    // Map platform names to match backend validation
    let platform: 'iOS' | 'Android' | 'Web' | 'Desktop';
    const osName = Device.osName?.toLowerCase() || '';

    if (osName.includes('ios')) {
      platform = 'iOS';
    } else if (osName.includes('android')) {
      platform = 'Android';
    } else {
      platform = 'Web';
    }

    return {
      deviceUuid, // Persisted across app restarts
      deviceName: Device.deviceName || undefined,
      platform,
      platformVersion: Device.osVersion || undefined,
      deviceModel: Device.modelName || undefined,
      appVersion: Constants.expoConfig?.version || '1.0.0',
      fcmToken: undefined,
    };
  }

  // ============ STORAGE HELPERS ============
  private async storeAuthData(data: any): Promise<void> {
    try {
      // Extract tokens from nested structure
      const accessToken = data.tokens?.accessToken || data.accessToken;
      const refreshToken = data.tokens?.refreshToken || data.refreshToken;

      if (!accessToken || !refreshToken) {
        console.error('Missing tokens:', {accessToken, refreshToken});
        throw new Error('Missing authentication tokens');
      }

      const userData = {
        customerId: data.customerId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        emailVerified: data.emailVerified,
        ...(data.profileImage && {profileImage: data.profileImage}),
      };

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
      ]);

      console.log('✅ Auth data stored successfully');
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
      throw error;
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      console.log('✅ Auth data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export class for testing or advanced usage
export {AuthService};