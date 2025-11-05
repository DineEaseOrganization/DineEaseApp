import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {ApiError, authService} from '../services/api';

interface User {
  customerId: string; // Changed from number to string (UUID)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode?: string;
  phoneVerified?: boolean;
  emailVerified: boolean;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (code: string) => Promise<{ success: boolean; message: string }>;
  resendVerificationCode: (email: string) => Promise<{ success: boolean; message: string; cooldownSeconds?: number }>;
  checkVerificationStatus: () => Promise<VerificationStatus>;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  password: string;
}

interface VerificationStatus {
  emailVerified: boolean;
  email: string;
  needsVerification: boolean;
  canResendCode: boolean;
  cooldownSeconds?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user data on app launch
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const userData = await authService.getUserData();
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
      // Clear invalid auth data
      await authService.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authService.login(email, password);

      if (response.success && response.data) {
        const userData: User = {
          customerId: response.data.customerId,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          phone: response.data.phone,
          phoneCountryCode: response.data.phoneCountryCode,
          emailVerified: response.data.emailVerified,
          profileImage: response.data.profileImage,
        };

        setUser(userData);

        return {
          success: true,
          message: response.message,
        };
      }

      return {
        success: false,
        message: response.message || 'Login failed',
      };
    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: 'An error occurred during login. Please try again.',
      };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📤 Registering user:', userData.email);

      const response = await authService.register({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        phoneCountryCode: userData.phoneCountryCode,
      });

      console.log('📥 Registration response:', response);

      if (response.success && response.data) {
        const newUser: User = {
          customerId: response.data.customerId,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          phone: response.data.phone,
          phoneCountryCode: response.data.phoneCountryCode,
          emailVerified: response.data.emailVerified,
          profileImage: response.data.profileImage,
        };

        setUser(newUser);

        return {
          success: true,
          message: response.message,
        };
      }

      return {
        success: false,
        message: response.message || 'Registration failed',
      };
    } catch (error) {
      console.error('❌ Registration error:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: 'An error occurred during registration. Please try again.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const verifyEmail = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authService.verifyEmail(code);

      if (response.success && response.emailVerified) {
        // Update user state
        if (user) {
          setUser({
            ...user,
            emailVerified: true,
          });
        }
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error('Email verification error:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: 'Failed to verify email. Please try again.',
      };
    }
  };

  const resendVerificationCode = async (email: string): Promise<{
    success: boolean;
    message: string;
    cooldownSeconds?: number
  }> => {
    try {
      const response = await authService.resendVerificationCode(email);

      return {
        success: response.success,
        message: response.message,
        cooldownSeconds: response.cooldownSeconds,
      };
    } catch (error) {
      console.error('Resend verification error:', error);

      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: 'Failed to resend verification code. Please try again.',
      };
    }
  };

  const checkVerificationStatus = async (): Promise<VerificationStatus> => {
    try {
      return await authService.checkVerificationStatus();
    } catch (error) {
      console.error('Check verification status error:', error);
      throw error;
    }
  };

  const refreshUserData = async (): Promise<void> => {
    try {
      const userData = await authService.getUserData();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user data error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    verifyEmail,
    resendVerificationCode,
    checkVerificationStatus,
    loading,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};