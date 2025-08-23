// src/components/ProtectedScreenWithNavigation.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
    MainTabs: undefined;
    Login: undefined;
    Register: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface ProtectedScreenWithNavigationProps {
    children: React.ReactNode;
    title: string;
    description: string;
    icon: string;
}

const ProtectedScreenWithNavigation: React.FC<ProtectedScreenWithNavigationProps> = ({
                                                                                         children,
                                                                                         title,
                                                                                         description,
                                                                                         icon
                                                                                     }) => {
    const { isAuthenticated, loading } = useAuth();
    const navigation = useNavigation<NavigationProp>();

    const handleLoginPress = () => {
        navigation.navigate('Login');
    };

    const handleRegisterPress = () => {
        navigation.navigate('Register');
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.authContainer}>
                    <View style={styles.content}>
                        <Text style={styles.icon}>{icon}</Text>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description}>{description}</Text>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
                            <Text style={styles.loginButtonText}>Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.registerButton} onPress={handleRegisterPress}>
                            <Text style={styles.registerButtonText}>Create Account</Text>
                        </TouchableOpacity>

                        <Text style={styles.orText}>or</Text>

                        <View style={styles.socialButtons}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Text style={styles.socialButtonText}>📱 Continue with Apple</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Text style={styles.socialButtonText}>🔵 Continue with Google</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    content: {
        alignItems: 'center',
        marginBottom: 60,
    },
    icon: {
        fontSize: 80,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    actionButtons: {
        gap: 16,
    },
    loginButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerButton: {
        backgroundColor: 'white',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    registerButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    orText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        marginVertical: 8,
    },
    socialButtons: {
        gap: 12,
    },
    socialButton: {
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
});

export default ProtectedScreenWithNavigation;