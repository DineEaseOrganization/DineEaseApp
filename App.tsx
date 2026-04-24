// App.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { CACHE_CONFIG } from './src/config/cache.config';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { UpdatesProvider } from './src/context/UpdatesContext';
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
        <SafeAreaProvider>
        <StripeProvider
            publishableKey={Constants.expoConfig?.extra?.stripePublishableKey ?? ''}
            merchantIdentifier="merchant.com.dineease"
        >
            <QueryClientProvider client={queryClient}>
                <ErrorBoundary>
                    <AuthProvider>
                        <UpdatesProvider>
                            <FavoritesProvider>
                                <View style={styles.appRoot}>
                                    <AppNavigator />
                                </View>
                            </FavoritesProvider>
                        </UpdatesProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </QueryClientProvider>
        </StripeProvider>
        </SafeAreaProvider>
    );
};

export default App;

const styles = StyleSheet.create({
    appRoot: {
        flex: 1,
    },
});
