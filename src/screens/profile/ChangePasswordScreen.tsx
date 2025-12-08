// src/screens/settings/ChangePasswordScreen.tsx
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
import {Ionicons} from '@expo/vector-icons';
import {passwordService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';

interface PasswordStrength {
  isValid: boolean;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  violations: string[];
  suggestions: string[];
}

interface ChangePasswordScreenProps {
  navigation: any;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({navigation}) => {
  const {logout} = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [checkingStrength, setCheckingStrength] = useState(false);

  // Debounce password strength check
  useEffect(() => {
    if (newPassword.length >= 3) {
      const timer = setTimeout(() => {
        checkPasswordStrength(newPassword);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setPasswordStrength(null);
    }
  }, [newPassword]);

  const checkPasswordStrength = async (password: string) => {
    setCheckingStrength(true);
    try {
      const result = await passwordService.checkPasswordStrength(password);
      setPasswordStrength(result as any);
    } catch (error) {
      console.error('Error checking password strength:', error);
    } finally {
      setCheckingStrength(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return '#e74c3c';
      case 'fair':
        return '#f39c12';
      case 'good':
        return '#3498db';
      case 'strong':
        return '#27ae60';
      default:
        return '#999';
    }
  };

  const getStrengthWidth = (strength: string) => {
    switch (strength) {
      case 'weak':
        return '25%';
      case 'fair':
        return '50%';
      case 'good':
        return '75%';
      case 'strong':
        return '100%';
      default:
        return '0%';
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Invalid Password', 'New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Same Password', 'New password must be different from current password.');
      return;
    }

    if (passwordStrength && !passwordStrength.isValid) {
      Alert.alert(
        'Weak Password',
        'Please choose a stronger password that meets all requirements.',
        [{text: 'OK'}]
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await passwordService.changePassword(currentPassword, newPassword);

      if (response.success) {
        if (response.forceLogoutAllDevices) {
          Alert.alert(
            'Password Changed Successfully',
            'For security reasons, you have been logged out from all devices. Please sign in again.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  await logout();
                  navigation.reset({
                    index: 0,
                    routes: [{name: 'Login'}],
                  });
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Success',
            'Your password has been changed successfully.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack()
              }
            ]
          );
        }
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>
            Choose a strong password to keep your account secure.
          </Text>

          {/* Current Password */}
          <View style={styles.section}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.section}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: passwordStrength ? getStrengthWidth(passwordStrength.strength) : '0%',
                        backgroundColor: passwordStrength
                          ? getStrengthColor(passwordStrength.strength)
                          : '#999',
                      },
                    ]}
                  />
                </View>
                {checkingStrength ? (
                  <ActivityIndicator size="small" color="#007AFF"/>
                ) : passwordStrength ? (
                  <Text
                    style={[
                      styles.strengthText,
                      {color: getStrengthColor(passwordStrength.strength)},
                    ]}
                  >
                    {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Password Requirements */}
            {passwordStrength && passwordStrength.violations.length > 0 && (
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Password must contain:</Text>
                {passwordStrength.violations.map((violation, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <Ionicons name="close-circle" size={16} color="#e74c3c"/>
                    <Text style={styles.requirementText}>{violation}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Password Suggestions */}
            {passwordStrength && passwordStrength.suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {passwordStrength.suggestions.map((suggestion, index) => (
                  <View key={index} style={styles.suggestionItem}>
                    <Ionicons name="information-circle-outline" size={16} color="#007AFF"/>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.section}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#007AFF"/>
            <Text style={styles.infoText}>
              For security, you may be logged out from all devices after changing your password.
            </Text>
          </View>

          {/* Change Password Button */}
          <TouchableOpacity
            style={[
              styles.changeButton,
              (!currentPassword || !newPassword || !confirmPassword || isLoading) && styles.changeButtonDisabled,
            ]}
            onPress={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff"/>
            ) : (
              <Text style={styles.changeButtonText}>Change Password</Text>
            )}
          </TouchableOpacity>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  strengthContainer: {
    marginTop: 12,
    gap: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requirementsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe0e0',
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: '#e74c3c',
  },
  suggestionsContainer: {
    marginTop: 8,
    gap: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 12,
    color: '#007AFF',
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  changeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  changeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen;