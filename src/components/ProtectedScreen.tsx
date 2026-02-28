// src/components/ProtectedScreen.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Colors, FontSize, LineHeight, Radius, Spacing } from '../theme';
import AppText from './ui/AppText';

interface ProtectedScreenProps {
    children: React.ReactNode;
    title: string;
    description: string;
    icon: string;
    onLoginPress: () => void;
    onRegisterPress: () => void;
}

const ProtectedScreen: React.FC<ProtectedScreenProps> = ({
    children,
    title,
    description,
    icon,
    onLoginPress,
    onRegisterPress
}) => {
    const { isAuthenticated, loading } = useAuth();
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();

    const handleSocialPress = (provider: 'Apple' | 'Google') => {
        Alert.alert('Feature coming soon', `${provider} sign-in will be available soon.`);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <AppText variant="bodyMedium" color={Colors.textOnLightSecondary} style={styles.loadingText}>
                        Loading...
                    </AppText>
                </View>
            </SafeAreaView>
        );
    }

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView
                    contentContainerStyle={[
                        styles.authContainer,
                        { paddingBottom: Spacing['6'] + insets.bottom + tabBarHeight },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        <AppText style={styles.icon}>{icon}</AppText>
                        <AppText variant="h3" color={Colors.textOnLight} style={styles.title}>
                            {title}
                        </AppText>
                        <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.description}>
                            {description}
                        </AppText>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
                            <AppText variant="button" color={Colors.white} style={styles.loginButtonText}>
                                Sign In
                            </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.registerButton} onPress={onRegisterPress}>
                            <AppText variant="button" color={Colors.textOnLight} style={styles.registerButtonText}>
                                Create Account
                            </AppText>
                        </TouchableOpacity>

                        <AppText variant="captionMedium" color={Colors.textOnLightSecondary} style={styles.orText}>
                            or
                        </AppText>

                        <View style={styles.socialButtons}>
                            <TouchableOpacity
                                style={styles.socialButtonDisabled}
                                onPress={() => handleSocialPress('Apple')}
                                activeOpacity={0.75}
                            >
                                <AppText variant="buttonSmall" color={Colors.textOnLight} style={styles.socialButtonText}>
                                    Continue with Apple
                                </AppText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.socialButtonDisabled}
                                onPress={() => handleSocialPress('Google')}
                                activeOpacity={0.75}
                            >
                                <AppText variant="buttonSmall" color={Colors.textOnLight} style={styles.socialButtonText}>
                                    Continue with Google
                                </AppText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.appBackground },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center' },
    loadingText: {
        fontSize: FontSize.base },
    authContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['6'] },
    content: {
        alignItems: 'center',
        marginBottom: Spacing['8'] },
    icon: {
        fontSize: FontSize['6xl'] + Spacing['2'],
        marginBottom: Spacing['4'] },
    title: {
        textAlign: 'center',
        marginBottom: Spacing['3'] },
    description: {
        textAlign: 'center',
        lineHeight: Math.round(FontSize.base * LineHeight.normal),
        paddingHorizontal: Spacing['4'] },
    actionButtons: {
        gap: Spacing['3'] },
    loginButton: {
        backgroundColor: Colors.accent,
        paddingVertical: Spacing['4'],
        borderRadius: Radius.lg,
        alignItems: 'center' },
    loginButtonText: {
        letterSpacing: 0.3 },
    registerButton: {
        backgroundColor: Colors.white,
        paddingVertical: Spacing['4'],
        borderRadius: Radius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.cardBorder },
    registerButtonText: {
        letterSpacing: 0.3 },
    orText: {
        textAlign: 'center',
        marginVertical: Spacing['2'] },
    socialButtons: {
        gap: Spacing['3'] },
    socialButton: {
        backgroundColor: Colors.white,
        paddingVertical: Spacing['3'],
        borderRadius: Radius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.cardBorder },
    socialButtonDisabled: {
        backgroundColor: '#f2f3f5',
        paddingVertical: Spacing['3'],
        borderRadius: Radius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        opacity: 0.7 },
    socialButtonText: {
        letterSpacing: 0.2 } });

export default ProtectedScreen;




