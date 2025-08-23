// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImage?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    register: (userData: RegisterData) => Promise<boolean>;
    loading: boolean;
}

interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@dineease_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check for stored user data on app launch
    useEffect(() => {
        checkStoredAuth();
    }, []);

    const checkStoredAuth = async () => {
        try {
            const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error checking stored auth:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            // Mock authentication - replace with actual API call
            if (email === 'maria@example.com' && password === 'password123') {
                const userData: User = {
                    id: 1,
                    firstName: 'Maria',
                    lastName: 'Christou',
                    email: 'maria@example.com',
                    phone: '+357 99 789012',
                    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150'
                };

                setUser(userData);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const register = async (userData: RegisterData): Promise<boolean> => {
        try {
            // Mock registration - replace with actual API call
            const newUser: User = {
                id: Date.now(), // Mock ID
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone,
                profileImage: undefined
            };

            setUser(newUser);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            setUser(null);
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        loading
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