// src/screens/settings/DeleteAccountScreen.tsx
import React, {useState} from 'react';
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
import {profileService} from '../../services/api';
import {useAuth} from '../../context/AuthContext';

interface DeleteAccountScreenProps {
  navigation: any;
}

const DeleteAccountScreen: React.FC<DeleteAccountScreenProps> = ({navigation}) => {
  const {logout} = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [action, setAction] = useState<'DEACTIVATE' | 'DELETE'>('DEACTIVATE');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password) {
      Alert.alert('Missing Password', 'Please enter your password to confirm.');
      return;
    }

    const actionText = action === 'DEACTIVATE' ? 'deactivate' : 'permanently delete';
    const warningText = action === 'DELETE'
      ? 'This action cannot be undone. All your data will be permanently deleted.'
      : 'Your account will be deactivated but can be restored within 30 days.';

    Alert.alert(
      `${action === 'DELETE' ? 'Delete' : 'Deactivate'} Account`,
      `Are you sure you want to ${actionText} your account? ${warningText}`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: action === 'DELETE' ? 'Delete' : 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await profileService.deleteAccount({
                password,
                action,
                reason: reason.trim() || undefined,
              });

              if (response.success) {
                Alert.alert(
                  'Account ' + (action === 'DELETE' ? 'Deleted' : 'Deactivated'),
                  response.message,
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
                Alert.alert('Error', response.message);
              }
            } catch (error: any) {
              console.error('Delete account error:', error);
              Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
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
          <View style={styles.iconContainer}>
            <Ionicons name="warning-outline" size={64} color="#e74c3c"/>
          </View>

          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.subtitle}>
            We're sorry to see you go. Please select what you'd like to do with your account.
          </Text>

          {/* Action Selection */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.actionCard,
                action === 'DEACTIVATE' && styles.actionCardSelected,
              ]}
              onPress={() => setAction('DEACTIVATE')}
            >
              <View style={styles.actionCardHeader}>
                <View style={styles.radioOuter}>
                  {action === 'DEACTIVATE' && <View style={styles.radioInner}/>}
                </View>
                <Text style={styles.actionCardTitle}>Deactivate Account</Text>
              </View>
              <Text style={styles.actionCardDescription}>
                Temporarily disable your account. You can restore it within 30 days by logging back in.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                action === 'DELETE' && styles.actionCardSelected,
              ]}
              onPress={() => setAction('DELETE')}
            >
              <View style={styles.actionCardHeader}>
                <View style={styles.radioOuter}>
                  {action === 'DELETE' && <View style={styles.radioInner}/>}
                </View>
                <Text style={styles.actionCardTitle}>Permanently Delete</Text>
              </View>
              <Text style={styles.actionCardDescription}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password Confirmation */}
          <View style={styles.section}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Optional Reason */}
          <View style={styles.section}>
            <Text style={styles.label}>Reason (Optional)</Text>
            <TextInput
              style={styles.textArea}
              value={reason}
              onChangeText={setReason}
              placeholder="Tell us why you're leaving (optional)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{reason.length}/500</Text>
          </View>

          {/* Warning Box */}
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#e74c3c"/>
            <Text style={styles.warningText}>
              {action === 'DELETE'
                ? 'Permanent deletion cannot be undone. All your reservations, reviews, and preferences will be lost forever.'
                : 'After deactivation, you have 30 days to restore your account by logging back in. After 30 days, your account will be permanently deleted.'}
            </Text>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              (!password || isLoading) && styles.deleteButtonDisabled,
            ]}
            onPress={handleDeleteAccount}
            disabled={!password || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff"/>
            ) : (
              <Text style={styles.deleteButtonText}>
                {action === 'DELETE' ? 'Permanently Delete Account' : 'Deactivate Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionCardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 32,
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
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    height: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe0e0',
    gap: 12,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#e74c3c',
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonDisabled: {
    backgroundColor: '#ccc',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DeleteAccountScreen;