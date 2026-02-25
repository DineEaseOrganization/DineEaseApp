
    
import React, {useState} from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {ApiError, passwordService} from '../../services/api';
import { FontSize, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';

interface ResetPasswordScreenProps {
  navigation: any;
  route: {
    params: {
      email: string;
    };
  };
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({navigation, route}) => {
  const {email} = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeChange = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
  };

  const handleReset = async () => {
    const resetToken = code.join('');

    if (resetToken.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit code.');
      return;
    }

    if (!newPassword) {
      Alert.alert('Missing Information', 'Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await passwordService.resetPassword(email, resetToken, newPassword);

      if (response.success) {
        Alert.alert('Success', 'Your password has been reset successfully.', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Login');
            } },
        ]);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Reset password error:', error);

      if (error instanceof ApiError) {
        const responseData = (error as any).response?.data;
        const detail = responseData?.body?.detail || responseData?.detail;

        Alert.alert('Error', detail || error.message || 'An unexpected error occurred.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                style={[styles.codeInput, digit && styles.codeInputFilled]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
              />
            ))}
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min. 8 characters)"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleReset}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff"/>
              ) : (
                <Text style={styles.resetButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa' },
  scrollContent: {
    flexGrow: 1 },
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
    marginBottom: Spacing['8'] },
  email: {
    fontWeight: '600',
    color: '#007AFF' },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing['8'],
    paddingHorizontal: Spacing['2'] },
  codeInput: {
    width: r(48),
    height: r(56),
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: r(12),
    fontSize: FontSize['3xl'],
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'white',
    color: '#333' },
  codeInputFilled: {
    borderColor: '#007AFF' },
  form: {
    marginBottom: Spacing['8'] },
  inputContainer: {
    marginBottom: Spacing['5'] },
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
  resetButton: {
    backgroundColor: '#007AFF',
    paddingVertical: Spacing['4'],
    borderRadius: r(12),
    alignItems: 'center',
    marginTop: Spacing['2'] },
  resetButtonDisabled: {
    backgroundColor: '#ccc' },
  resetButtonText: {
    color: 'white',
    fontSize: FontSize.lg,
    fontWeight: 'bold' } });

export default ResetPasswordScreen;




