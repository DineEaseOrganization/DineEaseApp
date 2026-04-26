
    
// src/screens/auth/RegisterScreen.tsx
import React, {useRef, useState} from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import {useAuth} from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';
import { getFlagEmoji } from '../../utils/flagEmoji';
import { ValidationUtils } from '../../utils/validation';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedIso, setSelectedIso] = useState('CY');
  const phoneInputRef = useRef<PhoneInput>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {register} = useAuth();

  const handleRegister = async () => {
    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    if (!ValidationUtils.isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!phoneInputRef.current?.isValidNumber(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number for the selected country.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
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
      const callingCode = phoneInputRef.current?.getCallingCode() ?? '357';
      const result = await register({
        firstName,
        lastName,
        email,
        phone,
        phoneCountryCode: `+${callingCode}`,
        password
      });

      if (result.success) {
        Alert.alert(
          'Registration Successful',
          'Welcome to DineEase! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to email verification screen
                navigation.navigate('EmailVerification', {email});
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  const handleTermsPress = () => {
    Linking.openURL('https://dineeaseorganization.github.io/dineease-privacy-policy/terms-and-conditions').catch(() => {
      Alert.alert('Error', 'Unable to open the terms and conditions right now.');
    });
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://dineeaseorganization.github.io/dineease-privacy-policy/').catch(() => {
      Alert.alert('Error', 'Unable to open the privacy policy right now.');
    });
  };

  const handleSocialPress = (provider: 'Apple' | 'Google') => {
    Alert.alert('Feature coming soon', `${provider} sign-in will be available soon.`);
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
                disabled={isLoading}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join DineEase and discover amazing restaurants</Text>
            </View>

            {/* Registration Form */}
            <View style={styles.form}>
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, {flex: 1, marginRight: Spacing['2']}]}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>
                <View style={[styles.inputContainer, {flex: 1, marginLeft: Spacing['2']}]}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    autoCapitalize="words"
                    editable={!isLoading}
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
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <PhoneInput
                  ref={phoneInputRef}
                  defaultCode="CY"
                  layout="first"
                  onChangeText={setPhone}
                  onChangeCountry={(country) => setSelectedIso(country.cca2 as string)}
                  placeholder="Phone number"
                  disabled={isLoading}
                  withFlag={false}
                  countryPickerProps={{ disableNativeModal: false }}
                  renderDropdownImage={
                    <View style={styles.phoneFlagContent}>
                      <Text style={styles.phoneFlagEmoji}>{getFlagEmoji(selectedIso)}</Text>
                      <Ionicons name="chevron-down" size={14} color="#555" />
                    </View>
                  }
                  containerStyle={styles.phoneInputContainer}
                  textContainerStyle={styles.phoneTextContainer}
                  textInputStyle={styles.phoneTextInput}
                  codeTextStyle={styles.phoneCodeText}
                  flagButtonStyle={styles.phoneFlagButton}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password (min. 8 characters)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={rf(18)}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={rf(18)}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                  {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>I agree to the </Text>
                  <TouchableOpacity onPress={handleTermsPress} disabled={isLoading}>
                    <Text style={styles.termsLink}>Terms of Service</Text>
                  </TouchableOpacity>
                  <Text style={styles.termsText}> and </Text>
                  <TouchableOpacity onPress={handlePrivacyPress} disabled={isLoading}>
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
                {isLoading ? (
                  <ActivityIndicator color="#fff"/>
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Social Registration */}
            <View style={styles.socialContainer}>
              <View style={styles.dividerContainer}>
                <View style={styles.divider}/>
                <Text style={styles.dividerText}>Or sign up with</Text>
                <View style={styles.divider}/>
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButtonDisabled}
                  disabled={isLoading}
                  onPress={() => handleSocialPress('Apple')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.socialButtonText}>📱 Apple</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButtonDisabled}
                  disabled={isLoading}
                  onPress={() => handleSocialPress('Google')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.socialButtonText}>🔵 Google</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleSignIn} disabled={isLoading}>
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
    backgroundColor: '#f8f9fa' },
  keyboardAvoidingView: {
    flex: 1 },
  scrollContainer: {
    flexGrow: 1 },
  content: {
    paddingHorizontal: Spacing['6'],
    paddingVertical: Spacing['5'] },
  header: {
    marginBottom: Spacing['8'] },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing['5'],
    paddingVertical: r(10) },
  backButtonText: {
    fontSize: FontSize.lg,
    color: '#007AFF',
    fontWeight: '500' },
  title: {
    fontSize: FontSize['5xl'],
    fontWeight: 'bold',
    color: '#333',
    marginBottom: Spacing['2'] },
  subtitle: {
    fontSize: FontSize.lg,
    color: '#666',
    lineHeight: r(22) },
  form: {
    marginBottom: Spacing['8'] },
  nameRow: {
    flexDirection: 'row' },
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
    paddingRight: r(44),
    fontSize: FontSize.lg,
    backgroundColor: 'white' },
  passwordWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute',
    right: Spacing['3'],
    top: r(12),
    padding: r(2),
  },
  phoneInputContainer: {
    width: '100%',
    height: r(52),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: r(12),
    backgroundColor: 'white' },
  phoneTextContainer: {
    backgroundColor: 'white',
    paddingVertical: 0,
    borderTopRightRadius: r(12),
    borderBottomRightRadius: r(12) },
  phoneTextInput: {
    fontSize: FontSize.lg,
    color: '#333',
    height: r(50),
    paddingVertical: 0,
    marginVertical: 0 },
  phoneCodeText: {
    fontSize: FontSize.lg,
    color: '#333' },
  phoneFlagButton: {
    width: 88,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: r(12),
    borderBottomLeftRadius: r(12) },
  phoneFlagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4 },
  phoneFlagEmoji: {
    fontSize: 24,
    lineHeight: 30 },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing['6'] },
  checkbox: {
    width: r(20),
    height: r(20),
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: r(4),
    marginRight: Spacing['3'],
    marginTop: r(2),
    alignItems: 'center',
    justifyContent: 'center' },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF' },
  checkmark: {
    color: 'white',
    fontSize: FontSize.sm,
    fontWeight: 'bold' },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center' },
  termsText: {
    fontSize: FontSize.base,
    color: '#666',
    lineHeight: r(20) },
  termsLink: {
    fontSize: FontSize.base,
    color: '#007AFF',
    fontWeight: '500',
    lineHeight: r(20) },
  registerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: Spacing['4'],
    borderRadius: r(12),
    alignItems: 'center' },
  registerButtonDisabled: {
    backgroundColor: '#ccc' },
  registerButtonText: {
    color: 'white',
    fontSize: FontSize.lg,
    fontWeight: 'bold' },
  socialContainer: {
    marginBottom: Spacing['8'] },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['5'] },
  divider: {
    flex: 1,
    height: r(1),
    backgroundColor: '#ddd' },
  dividerText: {
    marginHorizontal: Spacing['4'],
    fontSize: FontSize.base,
    color: '#666' },
  socialButtons: {
    flexDirection: 'row',
    gap: Spacing['3'] },
  socialButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: r(14),
    borderRadius: r(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd' },
  socialButtonDisabled: {
    flex: 1,
    backgroundColor: '#f2f3f5',
    paddingVertical: r(14),
    borderRadius: r(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    opacity: 0.7 },
  socialButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '500',
    color: '#333' },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center' },
  signInText: {
    fontSize: FontSize.base,
    color: '#666' },
  signInLink: {
    fontSize: FontSize.base,
    color: '#007AFF',
    fontWeight: '500' } });

export default RegisterScreen;




