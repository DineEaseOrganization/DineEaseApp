// src/services/api/passwordService.ts
import {apiClient} from './apiClient';
import {API_CONFIG} from '../../config/api.config';
import {
  ChangePasswordRequest,
  ChangePasswordResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  PasswordStrengthResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../../types/api.types';

class PasswordService {
  /**
   * Initiate password reset (forgot password)
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const request: ForgotPasswordRequest = {
      email,
    };

    return await apiClient.post<ForgotPasswordResponse>(
      API_CONFIG.ENDPOINTS.FORGOT_PASSWORD,
      request
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    email: string,
    resetToken: string,
    newPassword: string
  ): Promise<ResetPasswordResponse> {
    const request: ResetPasswordRequest = {
      email,
      resetToken,
      newPassword,
    };

    return await apiClient.post<ResetPasswordResponse>(
      API_CONFIG.ENDPOINTS.RESET_PASSWORD,
      request
    );
  }

  /**
   * Change password (requires authentication)
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResponse> {
    const request: ChangePasswordRequest = {
      currentPassword,
      newPassword,
    };

    return await apiClient.put<ChangePasswordResponse>(
      API_CONFIG.ENDPOINTS.CHANGE_PASSWORD,
      request
    );
  }

  /**
   * Check password strength
   */
  async checkPasswordStrength(password: string): Promise<PasswordStrengthResponse> {
    return await apiClient.get<PasswordStrengthResponse>(
      `${API_CONFIG.ENDPOINTS.CHANGE_PASSWORD}/strength?password=${encodeURIComponent(password)}`
    );
  }
}

// Export singleton instance
export const passwordService = new PasswordService();

// Export class for testing or advanced usage
export {PasswordService};