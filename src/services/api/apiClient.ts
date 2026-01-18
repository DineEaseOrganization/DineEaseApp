// src/services/api/apiClient.ts
import axios, {AxiosError, AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_CONFIG, STORAGE_KEYS} from '../../config/api.config';
import {navigateToLogin} from '../../utils/navigationHelper';

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

// Auth event listener type
type AuthEventListener = () => void;

// Global auth event emitter
class AuthEventEmitter {
    private listeners: AuthEventListener[] = [];

    subscribe(listener: AuthEventListener): () => void {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    emit(): void {
        this.listeners.forEach(listener => listener());
    }
}

// Create singleton instance
export const authEventEmitter = new AuthEventEmitter();

// Centralized logout handler
async function handleLogout() {
    console.log('🚨 Handling logout - clearing auth data');

    // Clear all auth data
    await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
    ]);

    // Emit auth event to notify AuthContext
    authEventEmitter.emit();

    // Navigate to login screen
    navigateToLogin();
}

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Mobile-App': 'true', // Tells backend to use modern JWT parser
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
            if (__DEV__) {
                console.log('🔐 Auth token added to request');
            }
        } else if (__DEV__) {
            console.warn('⚠️ No auth token found in storage for request to:', config.url);
        }

        // Log request in development
        if (__DEV__) {
            console.log('📤 API Request:', {
                method: config.method?.toUpperCase(),
                url: config.url,
                data: config.data,
                hasAuthHeader: !!config.headers?.Authorization,
            });
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Track if we're currently refreshing to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

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
        const originalRequest: any = error.config;

        // Log error in development
        if (__DEV__) {
            console.log('❌ API Error:', {
                status: error.response?.status,
                url: originalRequest?.url,
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
            const message = detail || errorData?.message || 'An error occurred.';

            const apiError = new ApiError(
                message,
                status,
                errorData?.errors
            );

            (apiError as any).response = error.response;

            if (status === 400) {
                apiError.message = detail || 'Bad request. Please check your input.';
            }

            // 401 Unauthorized - Try to refresh token first
            if (status === 401 && !originalRequest._retry) {
                // Don't try to refresh the refresh token endpoint itself
                if (originalRequest.url === API_CONFIG.ENDPOINTS.REFRESH_TOKEN) {
                    console.log('🚨 Refresh token failed - logging out');
                    await handleLogout();
                    throw apiError;
                }

                if (isRefreshing) {
                    // Wait for the refresh to complete
                    return new Promise((resolve, reject) => {
                        failedQueue.push({resolve, reject});
                    })
                        .then(token => {
                            originalRequest.headers['Authorization'] = 'Bearer ' + token;
                            return axiosInstance(originalRequest);
                        })
                        .catch(err => {
                            return Promise.reject(err);
                        });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

                if (!refreshToken) {
                    console.log('🚨 No refresh token available - logging out');
                    isRefreshing = false;
                    await handleLogout();
                    throw apiError;
                }

                try {
                    console.log('🔄 Attempting to refresh token...');
                    const response = await axios.post(
                        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`,
                        {refreshToken},
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Mobile-App': 'true',
                            },
                        }
                    );

                    const {accessToken, refreshToken: newRefreshToken} = response.data;

                    // Store new tokens
                    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

                    console.log('✅ Token refreshed successfully');

                    // Update the failed request with new token
                    originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;

                    // Process queued requests
                    processQueue(null, accessToken);

                    isRefreshing = false;

                    // Retry the original request
                    return axiosInstance(originalRequest);
                } catch (refreshError: any) {
                    console.error('❌ Token refresh failed:', refreshError);
                    processQueue(refreshError, null);
                    isRefreshing = false;
                    await handleLogout();
                    throw apiError;
                }
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

        // Network errors or other errors
        throw new ApiError(
            'Network error. Please check your connection.',
            undefined,
            undefined
        );
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