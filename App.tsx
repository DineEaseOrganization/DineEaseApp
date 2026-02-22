// App.tsx
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { CACHE_CONFIG } from './src/config/cache.config';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: CACHE_CONFIG.DEFAULT_STALE_TIME,
            gcTime:    CACHE_CONFIG.DEFAULT_GC_TIME,
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

const App = () => {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
                <ActivityIndicator size="large" color={Colors.white} />
            </View>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
                <AuthProvider>
                    <FavoritesProvider>
                        <AppNavigator />
                    </FavoritesProvider>
                </AuthProvider>
            </ErrorBoundary>
        </QueryClientProvider>
    );
};

export default App;
