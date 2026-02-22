import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {ApiError} from '../../services/api';
import { Colors, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {login} = useAuth();

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Missing Information', 'Please fill in all fields.'); return; }
    if (!isValidEmail(email)) { Alert.alert('Invalid Email', 'Please enter a valid email address.'); return; }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const responseData = (error as any).response?.data;
        const detail = responseData?.body?.detail || responseData?.detail;
        Alert.alert('Login Failed', detail || error.message || 'Invalid credentials.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.backBtn}>
            <AppText variant="bodySemiBold" color={Colors.accent}>← Back</AppText>
          </TouchableOpacity>

          {/* Brand mark */}
          <View style={styles.brandMark}>
            <AppText style={styles.brandEmoji}>🍽️</AppText>
          </View>

          {/* Title */}
          <AppText variant="h2" color={NAVY} style={styles.title}>Welcome Back</AppText>
          <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.subtitle}>
            Sign in to your DineEase account
          </AppText>

          {/* Form card */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <AppText variant="captionMedium" color={Colors.textOnLight} style={styles.label}>Email</AppText>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textOnLightTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <AppText variant="captionMedium" color={Colors.textOnLight} style={styles.label}>Password</AppText>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textOnLightTertiary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={isLoading}
            >
              <AppText variant="captionMedium" color={Colors.accent}>Forgot Password?</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color={Colors.white} />
                : <AppText variant="button" color={Colors.white}>Sign In</AppText>
              }
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <AppText variant="caption" color={Colors.textOnLightTertiary} style={styles.dividerText}>
              Or continue with
            </AppText>
            <View style={styles.dividerLine} />
          </View>

          {/* Social */}
          <View style={styles.socialRow}>
            {['📱  Apple', '🔵  Google'].map((label) => (
              <TouchableOpacity key={label} style={styles.socialBtn} disabled={isLoading} activeOpacity={0.8}>
                <AppText variant="body" color={Colors.textOnLight}>{label}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign up link */}
          <View style={styles.signUpRow}>
            <AppText variant="body" color={Colors.textOnLightSecondary}>Don't have an account? </AppText>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
              <AppText variant="bodySemiBold" color={Colors.accent}>Sign Up</AppText>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBackground },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing['5'], paddingVertical: Spacing['5'] },

  backBtn: { alignSelf: 'flex-start', paddingVertical: Spacing['2'], marginBottom: Spacing['4'] },

  brandMark: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: NAVY,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing['5'],
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  brandEmoji: { fontSize: 30 },

  title: { textAlign: 'center', marginBottom: Spacing['1'] },
  subtitle: { textAlign: 'center', marginBottom: Spacing['6'] },

  // ── Form card ─────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.xl,
    padding: Spacing['5'],
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing['5'],
    shadowColor: '#1a2e3b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: { marginBottom: Spacing['4'] },
  label: { marginBottom: Spacing['2'], letterSpacing: 0.3 },
  input: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    fontSize: 15,
    backgroundColor: Colors.appBackground,
    color: Colors.textOnLight,
    fontFamily: 'Inter_400Regular',
  },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing['5'] },

  loginBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing['4'],
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  loginBtnDisabled: { backgroundColor: Colors.textOnLightTertiary },

  // ── Divider ───────────────────────────────────────────────────────────────
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing['4'] },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.cardBorder },
  dividerText: { marginHorizontal: Spacing['3'] },

  // ── Social ────────────────────────────────────────────────────────────────
  socialRow: { flexDirection: 'row', gap: Spacing['3'], marginBottom: Spacing['6'] },
  socialBtn: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    paddingVertical: Spacing['3'],
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  signUpRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});

export default LoginScreen;
