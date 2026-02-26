import React, {useEffect, useRef, useState} from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import { FontSize, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';

interface EmailVerificationScreenProps {
  navigation: any;
  route: {
    params: {
      email: string;
    };
  };
}

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({navigation, route}) => {
  const {email} = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const {verifyEmail, resendVerificationCode} = useAuth();
  const codeInputs = useRef<Array<TextInput | null>>([]);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    const newCode = [...code];

    // Handle paste: user copied the full 6-digit code
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, code.length - index).split('');
      digits.forEach((char, i) => {
        newCode[index + i] = char;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, code.length - 1);
      codeInputs.current[nextIndex]?.focus();
      if (newCode.every(digit => digit !== '')) {
        handleVerify(newCode.join(''));
      }
      return;
    }

    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < code.length - 1) {
      codeInputs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && text) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // Move focus back to previous box on backspace
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');

    if (codeToVerify.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit code.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyEmail(codeToVerify);

      if (result.success) {
        Alert.alert(
          'Email Verified!',
          'Your email has been successfully verified.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to main app - user is already logged in
                navigation.reset({
                  index: 0,
                  routes: [{name: 'MainTabs'}] });
              }
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', result.message);
        setCode(['', '', '', '', '', '']);
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setCode(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldownSeconds > 0) {
      return;
    }

    setIsResending(true);

    try {
      const result = await resendVerificationCode(email);

      if (result.success) {
        Alert.alert('Code Sent', result.message);
        if (result.cooldownSeconds) {
          setCooldownSeconds(result.cooldownSeconds);
        }
      } else {
        Alert.alert('Failed to Resend', result.message);
        if (result.cooldownSeconds) {
          setCooldownSeconds(result.cooldownSeconds);
        }
      }
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.icon}>✉️</Text>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to{'\n'}
              <Text style={styles.email}>{email}</Text>
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { codeInputs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={({nativeEvent}) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (isLoading || code.some(d => !d)) && styles.verifyButtonDisabled
            ]}
            onPress={() => handleVerify()}
            disabled={isLoading || code.some(d => !d)}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff"/>
            ) : (
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            {cooldownSeconds > 0 ? (
              <Text style={styles.cooldownText}>
                Resend in {cooldownSeconds}s
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={isResending || isLoading}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color="#007AFF"/>
                ) : (
                  <Text style={styles.resendLink}>Resend Code</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              💡 Check your spam folder if you don't see the email
            </Text>
            <Text style={styles.infoText}>
              🔒 The code expires in 15 minutes for security
            </Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center' },
  content: {
    paddingHorizontal: Spacing['6'],
    paddingVertical: Spacing['10'] },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['10'] },
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
    marginBottom: Spacing['4'] },
  title: {
    fontSize: FontSize['4xl'],
    fontWeight: 'bold',
    color: '#333',
    marginBottom: Spacing['3'],
    textAlign: 'center' },
  subtitle: {
    fontSize: FontSize.lg,
    color: '#666',
    textAlign: 'center',
    lineHeight: r(24) },
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
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: Spacing['4'],
    borderRadius: r(12),
    alignItems: 'center',
    marginBottom: Spacing['6'] },
  verifyButtonDisabled: {
    backgroundColor: '#ccc' },
  verifyButtonText: {
    color: 'white',
    fontSize: FontSize.lg,
    fontWeight: 'bold' },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['8'] },
  resendText: {
    fontSize: FontSize.base,
    color: '#666' },
  resendLink: {
    fontSize: FontSize.base,
    color: '#007AFF',
    fontWeight: '500' },
  cooldownText: {
    fontSize: FontSize.base,
    color: '#999',
    fontWeight: '500' },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: Spacing['4'],
    borderRadius: r(12),
    borderWidth: 1,
    borderColor: '#bbdefb' },
  infoText: {
    fontSize: FontSize.base,
    color: '#1976d2',
    lineHeight: r(20),
    marginBottom: Spacing['2'] } });

export default EmailVerificationScreen;




