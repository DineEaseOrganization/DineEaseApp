// src/services/api/apiClient.ts
import axios, {AxiosError, AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_CONFIG, STORAGE_KEYS} from '../../config/api.config';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - adds auth token to requests
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get access token from storage
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    // Add authorization header if token exists
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Log request in development
    if (__DEV__) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response in development
    if (__DEV__) {
      console.log('📥 API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    // Log error in development
    if (__DEV__) {
      console.log('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle specific error cases
    if (error.response) {
      const {status, data} = error.response;
      const errorData = data as any;

      // Extract the actual error message from Spring Boot's response structure
      const detail = errorData?.body?.detail || errorData?.detail;
      const message = detail || 'An error occurred.';

      const apiError = new ApiError(
        message,
        status,
        errorData?.errors
      );

      (apiError as any).response = error.response;

      if (status === 400) {
        apiError.message = detail || 'Bad request. Please check your input.';
      }

      // 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER_DATA,
        ]);

        apiError.message = detail || errorData?.message || 'Your session has expired. Please login again.';
      }

      // 403 Forbidden
      if (status === 403) {
        apiError.message = detail || 'Access denied.';
      }

      // 409 Conflict
      if (status === 409) {
        apiError.message = detail || 'This resource already exists.';
      }

      // 422 Validation Error
      if (status === 422) {
        apiError.message = detail || 'Validation failed.';
      }

      // 429 Too Many Requests
      if (status === 429) {
        apiError.message = detail || 'Too many requests. Please try again later.';
      }

      // 500+ Server errors
      if (status >= 500) {
        apiError.message = detail || 'Server error. Please try again later.';
      }

      throw apiError;
    }
  }
);

// API client class with typed methods
class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(instance: AxiosInstance) {
    this.axiosInstance = instance;
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export singleton instance
export const apiClient = new ApiClient(axiosInstance);

// Export axios instance for direct access if needed
export {axiosInstance};