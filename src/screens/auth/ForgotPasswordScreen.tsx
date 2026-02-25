
    
import React, {useEffect, useState} from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {ApiError, passwordService} from '../../services/api';
import { FontSize, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Countdown effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Missing Information', 'Please enter your email address.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await passwordService.forgotPassword(email);

      if (response.success) {
        Alert.alert('Success', response.message, [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ResetPassword', {email});
            } },
        ]);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Forgot password error:', error);

      if (error instanceof ApiError) {
        const responseData = (error as any).response?.data;
        const detail = responseData?.body?.detail || responseData?.detail;
        const cooldown = responseData?.body?.cooldownSeconds;

        // Add cooldown info if present
        if (cooldown) {
          setCooldownSeconds(cooldown);
        }

        Alert.alert('Error', detail || error.message || 'Failed to send reset code.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isButtonDisabled = isLoading || cooldownSeconds > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a code to reset your password.
        </Text>

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
              editable={!isLoading && cooldownSeconds === 0}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isButtonDisabled && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isButtonDisabled}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff"/>
            ) : (
              <Text style={styles.submitButtonText}>
                {cooldownSeconds > 0
                  ? `Wait ${cooldownSeconds}s`
                  : 'Send Reset Code'}
              </Text>
            )}
          </TouchableOpacity>
          {cooldownSeconds > 0 && (
            <Text style={styles.cooldownText}>
              Please wait {cooldownSeconds} seconds before requesting another code.
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa' },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['6'],
    paddingTop: Spacing['5'] },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing['5'],
    paddingVertical: r(10) },
  backButtonText: {
    fontSize: FontSize.lg,
    color: '#007AFF',
    fontWeight: '500' },
  icon: {
    fontSize: rf(64),
    textAlign: 'center',
    marginBottom: Spacing['4'] },
  title: {
    fontSize: FontSize['4xl'],
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: Spacing['3'] },
  subtitle: {
    fontSize: FontSize.lg,
    color: '#666',
    textAlign: 'center',
    lineHeight: r(24),
    marginBottom: Spacing['10'],
    paddingHorizontal: Spacing['5'] },
  form: {
    marginBottom: Spacing['8'] },
  inputContainer: {
    marginBottom: Spacing['6'] },
  inputLabel: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: '#333',
    marginBottom: Spacing['2'] },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: r(12),
    paddingHorizontal: Spacing['4'],
    paddingVertical: r(14),
    fontSize: FontSize.lg,
    backgroundColor: 'white' },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: Spacing['4'],
    borderRadius: r(12),
    alignItems: 'center' },
  submitButtonDisabled: {
    backgroundColor: '#ccc' },
  submitButtonText: {
    color: 'white',
    fontSize: FontSize.lg,
    fontWeight: 'bold' },
  cooldownText: {
    marginTop: Spacing['3'],
    fontSize: FontSize.base,
    color: '#666',
    textAlign: 'center' } });

export default ForgotPasswordScreen;




