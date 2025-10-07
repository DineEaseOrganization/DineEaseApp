// src/screens/auth/EmailVerificationScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';

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
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      const nextInput = index + 1;
      // Focus next input (you'd need refs for this in production)
    }

    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && text) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace
      const prevInput = index - 1;
      // Focus prev input (you'd need refs for this in production)
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
                  routes: [{name: 'MainTabs'}],
                });
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
    backgroundColor: '#f8f9fa',
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
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    fontWeight: '600',
    color: '#007AFF',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'white',
    color: '#333',
  },
  codeInputFilled: {
    borderColor: '#007AFF',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  cooldownText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default EmailVerificationScreen;