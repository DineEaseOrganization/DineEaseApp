// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface LoginScreenProps {
    navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing Information', 'Please fill in all fields.');
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        setIsLoading(true);

        try {
            const success = await login(email, password);

            if (success) {
                Alert.alert('Success', 'Login successful!', [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navigation will be handled automatically by auth state change
                            navigation.goBack();
                        }
                    }
                ]);
            } else {
                Alert.alert('Login Failed', 'Invalid email or password.');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleForgotPassword = () => {
        Alert.alert('Forgot Password', 'Password reset functionality coming soon!');
    };

    const handleSignUp = () => {
        navigation.navigate('Register');
    };

    const handleGoBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                                <Text style={styles.backButtonText}>← Back</Text>
                            </TouchableOpacity>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Sign in to your account</Text>
                        </View>

                        {/* Demo credentials info */}
                        <View style={styles.demoInfo}>
                            <Text style={styles.demoTitle}>Demo Credentials:</Text>
                            <Text style={styles.demoText}>Email: maria@example.com</Text>
                            <Text style={styles.demoText}>Password: password123</Text>
                        </View>

                        {/* Login Form */}
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter your password"
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.forgotPasswordButton}
                                onPress={handleForgotPassword}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.loginButton,
                                    isLoading && styles.loginButtonDisabled
                                ]}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                <Text style={styles.loginButtonText}>
                                    {isLoading ? 'Signing In...' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Social Login */}
                        <View style={styles.socialContainer}>
                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>Or continue with</Text>
                                <View style={styles.divider} />
                            </View>

                            <View style={styles.socialButtons}>
                                <TouchableOpacity style={styles.socialButton}>
                                    <Text style={styles.socialButtonText}>📱 Apple</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialButton}>
                                    <Text style={styles.socialButtonText}>🔵 Google</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Sign Up Link */}
                        <View style={styles.signUpContainer}>
                            <Text style={styles.signUpText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={handleSignUp}>
                                <Text style={styles.signUpLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 20,
        paddingVertical: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    demoInfo: {
        backgroundColor: '#e3f2fd',
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#bbdefb',
    },
    demoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1976d2',
        marginBottom: 8,
    },
    demoText: {
        fontSize: 14,
        color: '#1976d2',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    form: {
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        backgroundColor: 'white',
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    loginButtonDisabled: {
        backgroundColor: '#ccc',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    socialContainer: {
        marginBottom: 32,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: '#666',
    },
    socialButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        flex: 1,
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
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signUpText: {
        fontSize: 14,
        color: '#666',
    },
    signUpLink: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
});

export default LoginScreen;