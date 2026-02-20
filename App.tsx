// App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CACHE_CONFIG } from './src/config/cache.config';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import AppNavigator from './src/navigation/AppNavigator';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: CACHE_CONFIG.DEFAULT_STALE_TIME,
            gcTime:    CACHE_CONFIG.DEFAULT_GC_TIME,
            retry: 2,
            refetchOnWindowFocus: false,  // Not applicable in React Native
        },
    },
});

const App = () => {
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
