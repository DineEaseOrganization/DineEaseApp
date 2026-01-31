import React, {useCallback, useState} from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {useFavorites} from '../../context/FavoritesContext';
import {processingService} from '../../services/api/processingService';
import {ProfileScreenNavigationProp} from '../../navigation/AppNavigator';

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const {user, logout} = useAuth();
  const {favorites} = useFavorites();
  const [bookingsCount, setBookingsCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      processingService.getCustomerReservationCount()
        .then(({count}) => setBookingsCount(count))
        .catch(() => setBookingsCount(0));
    }, [])
  );

  const stats = {
    bookings: bookingsCount,
    reviews: 0,  // TODO: Get from reviews context/API
    favorites: favorites.length
  };

  const handleImagePress = () => {
    Alert.alert(
      'Coming Soon',
      'Profile image upload feature will be available soon!',
      [{text: 'OK'}]
    );
  };

  const handlePreferencesPress = () => {
    Alert.alert(
      'Coming Soon',
      'Dietary preferences feature will be available soon!',
      [{text: 'OK'}]
    );
  };

  const handleImportantDatesPress = () => {
    Alert.alert(
      'Coming Soon',
      'Important dates feature will be available soon!',
      [{text: 'OK'}]
    );
  };

  const handleAccountSettingsPress = () => {
    Alert.alert(
      'Account Settings',
      'Navigate to account settings page',
      [{text: 'OK'}]
    );
  };

  const handleVerifyEmail = () => {
    (navigation as any).navigate('EmailVerification', {email: user?.email || ''});
  };

  const handleVerifyPhone = () => {
    Alert.alert('Verify Phone', 'Phone verification functionality coming soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`;
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Image Section */}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{getInitials()}</Text>
            </View>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleImagePress}
            >
              <Ionicons name="camera" size={20} color="#fff"/>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.memberSince}>
            Member since July 2025
          </Text>
        </View>

        {/* Contact Info Section */}
        <View style={styles.contactSection}>
          {/* Email Verification */}
          <View style={styles.contactRow}>
            <Text style={styles.contactText}>{user.email}</Text>
            {user.emailVerified ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
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

          {/* Phone Verification */}
          <View style={styles.contactRow}>
            <Text style={styles.contactText}>
              {user.phoneCountryCode} {user.phone}
            </Text>
            {user.phoneVerified ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleVerifyPhone}
              >
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => (navigation as any).navigate('Bookings')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats.bookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </TouchableOpacity>

          <View style={styles.statDivider}/>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation.navigate('AllReviews')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats.reviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </TouchableOpacity>

          <View style={styles.statDivider}/>

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => navigation.navigate('Favorites')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats.favorites}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </TouchableOpacity>
        </View>

        {/* About You Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>About you</Text>
            <Ionicons name="chevron-forward" size={20} color="#666"/>
          </View>
          <Text style={styles.sectionDescription}>
            Inform restaurants of your dietary preferences now. We'll save them for future visits.
          </Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePreferencesPress}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.iconText}>🍴</Text>
            </View>
            <Text style={styles.menuText}>No preference</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleImportantDatesPress}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="calendar-outline" size={20} color="#666"/>
            </View>
            <Text style={styles.menuText}>No important dates</Text>
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('AccountSettings')}
        >
          <View style={styles.settingsContent}>
            <Ionicons name="settings-outline" size={20} color="#333"/>
            <Text style={styles.settingsText}>Account settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666"/>
        </TouchableOpacity>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#e74c3c"/>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing}/>
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
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  initialsCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#c084fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#666',
  },
  contactSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
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
  verifiedIcon: {
    fontSize: 12,
    color: '#2E7D32',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 24,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  settingsButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 10,
  },
  settingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 10,
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ProfileScreen;