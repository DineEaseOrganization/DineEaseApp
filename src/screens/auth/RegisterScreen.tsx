// src/screens/auth/RegisterScreen.tsx
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

interface RegisterScreenProps {
    navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
            Alert.alert('Missing Information', 'Please fill in all fields.');
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        if (!isValidPhone(phone)) {
            Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.');
            return;
        }

        if (!agreeToTerms) {
            Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy.');
            return;
        }

        setIsLoading(true);

        try {
            const success = await register({
                firstName,
                lastName,
                email,
                phone,
                password
            });

            if (success) {
                Alert.alert(
                    'Registration Successful',
                    'Welcome to DineEase! Your account has been created.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                navigation.goBack();
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Registration Failed', 'Unable to create account. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred during registration. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPhone = (phone: string) => {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        return phoneRegex.test(phone);
    };

    const handleSignIn = () => {
        navigation.navigate('Login');
    };

    const handleTermsPress = () => {
        Alert.alert('Terms of Service', 'Terms of Service content would be displayed here.');
    };

    const handlePrivacyPress = () => {
        Alert.alert('Privacy Policy', 'Privacy Policy content would be displayed here.');
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
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleGoBack}
                            >
                                <Text style={styles.backButtonText}>← Back</Text>
                            </TouchableOpacity>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join DineEase and discover amazing restaurants</Text>
                        </View>

                        {/* Registration Form */}
                        <View style={styles.form}>
                            <View style={styles.nameRow}>
                                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.inputLabel}>First Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        placeholder="First name"
                                        autoCapitalize="words"
                                    />
                                </View>
                                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                                    <Text style={styles.inputLabel}>Last Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder="Last name"
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

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
                                <Text style={styles.inputLabel}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="+357 99 123456"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Create a password"
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Confirm Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm your password"
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Terms Checkbox */}
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setAgreeToTerms(!agreeToTerms)}
                            >
                                <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                                    {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <View style={styles.termsTextContainer}>
                                    <Text style={styles.termsText}>I agree to the </Text>
                                    <TouchableOpacity onPress={handleTermsPress}>
                                        <Text style={styles.termsLink}>Terms of Service</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.termsText}> and </Text>
                                    <TouchableOpacity onPress={handlePrivacyPress}>
                                        <Text style={styles.termsLink}>Privacy Policy</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.registerButton,
                                    isLoading && styles.registerButtonDisabled
                                ]}
                                onPress={handleRegister}
                                disabled={isLoading}
                            >
                                <Text style={styles.registerButtonText}>
                                    {isLoading ? 'Creating Account...' : 'Create Account'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Social Registration */}
                        <View style={styles.socialContainer}>
                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>Or sign up with</Text>
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

                        {/* Sign In Link */}
                        <View style={styles.signInContainer}>
                            <Text style={styles.signInText}>Already have an account? </Text>
                            <TouchableOpacity onPress={handleSignIn}>
                                <Text style={styles.signInLink}>Sign In</Text>
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
    },
    content: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    header: {
        marginBottom: 32,
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
        lineHeight: 22,
    },
    form: {
        marginBottom: 32,
    },
    nameRow: {
        flexDirection: 'row',
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
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 4,
        marginRight: 12,
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    checkmark: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    termsTextContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    termsText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    termsLink: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
        lineHeight: 20,
    },
    registerButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    registerButtonDisabled: {
        backgroundColor: '#ccc',
    },
    registerButtonText: {
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
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signInText: {
        fontSize: 14,
        color: '#666',
    },
    signInLink: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
});

export default RegisterScreen;