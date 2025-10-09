// src/screens/settings/DevicesScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Device from 'expo-device';

interface DeviceInfo {
  deviceUuid: string;
  deviceName: string;
  platform: string;
  lastActive: string;
  isCurrent: boolean;
}

interface DevicesScreenProps {
  navigation: any;
}

const DevicesScreen: React.FC<DevicesScreenProps> = ({navigation}) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    // TODO: Call API to get logged-in devices
    // Mock data for now
    setTimeout(() => {
      setDevices([
        {
          deviceUuid: '1234-5678-9012',
          deviceName: Device.deviceName || 'iPhone 15 Pro',
          platform: Device.osName || 'iOS',
          lastActive: 'Active now',
          isCurrent: true,
        },
        {
          deviceUuid: '9876-5432-1098',
          deviceName: 'iPad Air',
          platform: 'iOS',
          lastActive: '2 days ago',
          isCurrent: false,
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const handleLogoutDevice = (device: DeviceInfo) => {
    Alert.alert(
      'Logout Device',
      `Are you sure you want to logout from ${device.deviceName}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // TODO: Call API to logout device
            setDevices(devices.filter(d => d.deviceUuid !== device.deviceUuid));
            Alert.alert('Success', 'Device logged out successfully.');
          }
        }
      ]
    );
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Logout All Devices',
      'Are you sure you want to logout from all devices except this one? You will need to sign in again on those devices.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: () => {
            // TODO: Call API to logout all devices
            setDevices(devices.filter(d => d.isCurrent));
            Alert.alert('Success', 'All other devices have been logged out.');
          }
        }
      ]
    );
  };

  const getDeviceIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('ios') || platformLower.includes('iphone') || platformLower.includes('ipad')) {
      return 'phone-portrait-outline';
    } else if (platformLower.includes('android')) {
      return 'phone-portrait-outline';
    } else if (platformLower.includes('web')) {
      return 'desktop-outline';
    }
    return 'phone-portrait-outline';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF"/>
        </View>
      </SafeAreaView>
    );
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

        <View style={styles.content}>
          <Text style={styles.title}>Devices</Text>
          <Text style={styles.subtitle}>
            Manage devices where you're currently logged in. You can logout from any device at any time.
          </Text>

          {/* Current Device */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Device</Text>
            {devices.filter(d => d.isCurrent).map((device) => (
              <View key={device.deviceUuid} style={styles.deviceCard}>
                <View style={styles.deviceIcon}>
                  <Ionicons name={getDeviceIcon(device.platform) as any} size={24} color="#007AFF"/>
                </View>
                <View style={styles.deviceInfo}>
                  <View style={styles.deviceHeader}>
                    <Text style={styles.deviceName}>{device.deviceName}</Text>
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  </View>
                  <Text style={styles.devicePlatform}>{device.platform}</Text>
                  <Text style={styles.deviceActivity}>{device.lastActive}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Other Devices */}
          {devices.filter(d => !d.isCurrent).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Other Devices</Text>
                {devices.filter(d => !d.isCurrent).length > 1 && (
                  <TouchableOpacity onPress={handleLogoutAllDevices}>
                    <Text style={styles.logoutAllText}>Logout all</Text>
                  </TouchableOpacity>
                )}
              </View>
              {devices.filter(d => !d.isCurrent).map((device) => (
                <View key={device.deviceUuid} style={styles.deviceCard}>
                  <View style={styles.deviceIcon}>
                    <Ionicons name={getDeviceIcon(device.platform) as any} size={24} color="#666"/>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.deviceName}</Text>
                    <Text style={styles.devicePlatform}>{device.platform}</Text>
                    <Text style={styles.deviceActivity}>Last active: {device.lastActive}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => handleLogoutDevice(device)}
                  >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle-outline" size={20} color="#666"/>
            <Text style={styles.infoText}>
              For security reasons, we recommend logging out from devices you no longer use.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  logoutAllText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  currentBadge: {
    backgroundColor: '#E7F5E7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  devicePlatform: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  deviceActivity: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#f0f8ff',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default DevicesScreen;