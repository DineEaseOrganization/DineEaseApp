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
import {useAuth} from '../../context/AuthContext';
import {profileService} from '../../services/api';

interface YourDetailsScreenProps {
  navigation: any;
}

const YourDetailsScreen: React.FC<YourDetailsScreenProps> = ({navigation}) => {
  const {user, refreshUserData, logout} = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneCountryCode, setPhoneCountryCode] = useState(user?.phoneCountryCode || '+357');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!firstName || !lastName || !phone) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Validate name lengths
    if (firstName.length > 120 || lastName.length > 120) {
      Alert.alert('Invalid Input', 'Name must not exceed 120 characters.');
      return;
    }

    // Validate phone
    if (phone.length > 32) {
      Alert.alert('Invalid Input', 'Phone number must not exceed 32 characters.');
      return;
    }

    // Validate phone country code
    const countryCodeRegex = /^\+?[0-9]{1,4}$/;
    if (!countryCodeRegex.test(phoneCountryCode)) {
      Alert.alert('Invalid Input', 'Invalid phone country code format.');
      return;
    }

    setIsSaving(true);

    try {
      const updateData: any = {};

      // Only include changed fields
      if (firstName !== user?.firstName) updateData.firstName = firstName;
      if (lastName !== user?.lastName) updateData.lastName = lastName;
      if (phone !== user?.phone) updateData.phone = phone;
      if (phoneCountryCode !== user?.phoneCountryCode) updateData.phoneCountryCode = phoneCountryCode;

      // If nothing changed
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await profileService.updateProfile(updateData);

      if (response.success) {
        // Refresh user data from context
        await refreshUserData();

        Alert.alert(
          'Success',
          'Your details have been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsEditing(false);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile.');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setPhoneCountryCode(user?.phoneCountryCode || '+357');
    setPhone(user?.phone || '');
    setIsEditing(false);
  };

  const handleVerifyEmail = () => {
    navigation.navigate('EmailVerification', {email: user?.email || ''});
  };

  const handleVerifyPhone = () => {
    Alert.alert('Verify Phone', 'Phone verification functionality coming soon!');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleDeleteAccount = () => {
    navigation.navigate('DeleteAccount');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {isEditing ? (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleCancel} disabled={isSaving}>
                <Text style={[styles.cancelText, isSaving && styles.disabledText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#007AFF"/>
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Your details</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                editable={isEditing}
                maxLength={120}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                editable={isEditing}
                maxLength={120}
              />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.emailContainer}>
                <Text style={styles.emailText}>{email}</Text>
                {user?.emailVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#2E7D32"/>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={handleVerifyEmail}
                  >
                    <Text style={styles.verifyButtonText}>Verify</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.helperText}>
                Email cannot be changed. Contact support if you need to update it.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={[styles.countryCodeInput, !isEditing && styles.inputDisabled]}
                  value={phoneCountryCode}
                  onChangeText={setPhoneCountryCode}
                  placeholder="+357"
                  keyboardType="phone-pad"
                  editable={isEditing}
                  maxLength={5}
                />
                <View style={styles.phoneInputWrapper}>
                  <TextInput
                    style={[styles.phoneInput, !isEditing && styles.inputDisabled]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone number"
                    keyboardType="phone-pad"
                    editable={isEditing}
                    maxLength={32}
                  />
                  {user?.phoneVerified ? (
                    <View style={styles.verifiedBadgePhone}>
                      <Ionicons name="checkmark-circle" size={16} color="#2E7D32"/>
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.verifyButtonPhone}
                      onPress={handleVerifyPhone}
                    >
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleChangePassword}
            >
              <View style={styles.actionButtonLeft}>
                <Ionicons name="lock-closed-outline" size={20} color="#007AFF"/>
                <Text style={styles.actionButtonText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666"/>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>

            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={20} color="#e74c3c"/>
              <Text style={styles.deleteAccountText}>Delete Account</Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  cancelText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  content: {
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E7F5E7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  phoneInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 100,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  verifiedBadgePhone: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E7F5E7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifyButtonPhone: {
    position: 'absolute',
    right: 12,
    top: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  deleteAccountText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
  },
});

export default YourDetailsScreen;