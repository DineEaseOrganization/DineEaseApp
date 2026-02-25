// App.tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Dimensions } from 'react-native';
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
import { UpdatesProvider } from './src/context/UpdatesContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors, Spacing, Radius, FontSize } from './src/theme';
import { scale, fontScale, r } from './src/theme/responsive';

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

    const { width, height } = Dimensions.get('window');

    return (
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
                <AuthProvider>
                    <UpdatesProvider>
                        <FavoritesProvider>
                            <View style={styles.appRoot}>
                                <AppNavigator />
                                {__DEV__ && (
                                    <View style={styles.debugBadge}>
                                        <Text style={styles.debugText}>
                                            {`w:${Math.round(width)} h:${Math.round(height)} s:${scale.toFixed(2)} fs:${fontScale.toFixed(2)}`}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </FavoritesProvider>
                    </UpdatesProvider>
                </AuthProvider>
            </ErrorBoundary>
        </QueryClientProvider>
    );
};

export default App;

const styles = StyleSheet.create({
    appRoot: {
        flex: 1,
    },
    debugBadge: {
        position: 'absolute',
        right: Spacing['2'],
        bottom: Spacing['2'],
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: r(6),
        paddingVertical: Spacing['1'],
        borderRadius: Radius.sm,
    },
    debugText: {
        color: '#fff',
        fontSize: FontSize.xs,
    },
});
