// src/screens/settings/DevicesScreen.tsx
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert, RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Device from 'expo-device';
import {DeviceDTO} from "../../types/api.types";
import {ApiError, deviceService} from "../../services/api";

interface DevicesScreenProps {
  navigation: any;
}

const DevicesScreen: React.FC<DevicesScreenProps> = ({navigation}) => {
  const [devices, setDevices] = useState<DeviceDTO[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await deviceService.listDevices();

      if (response.success) {
        setDevices(response.devices);
        setCurrentDeviceId(response.currentDeviceId);
      } else {
        Alert.alert('Error', 'Failed to load devices');
      }
    } catch (error) {
      console.error('Error loading devices:', error);

      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to load devices. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };

  const handleRemoveDevice = (device: DeviceDTO) => {
    // Prevent removing current device
    if (device.isCurrentDevice) {
      Alert.alert(
        'Cannot Remove',
        'You cannot remove the device you are currently using. Please use another device to remove this one.',
        [{text: 'OK'}]
      );
      return;
    }

    Alert.alert(
      'Remove Device',
      `Are you sure you want to remove "${device.deviceName || 'Unknown Device'}"? You will need to sign in again on this device.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deviceService.removeDevice(device.deviceId);

              if (response.success) {
                Alert.alert('Success', response.message);
                await loadDevices();
              } else {
                Alert.alert('Error', response.message);
              }
            } catch (error) {
              console.error('Error removing device:', error);

              if (error instanceof ApiError) {
                Alert.alert('Error', error.message);
              } else {
                Alert.alert('Error', 'Failed to remove device. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const handleToggleTrust = async (device: DeviceDTO) => {
    const newTrustStatus = !device.isTrusted;

    try {
      const response = await deviceService.updateDeviceTrust(
        device.deviceId,
        newTrustStatus
      );

      if (response.success) {
        setDevices(prevDevices =>
          prevDevices.map(d =>
            d.deviceId === device.deviceId
              ? {...d, isTrusted: newTrustStatus}
              : d
          )
        );

        Alert.alert(
          'Success',
          newTrustStatus
            ? 'Device marked as trusted'
            : 'Device trust removed'
        );
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error updating trust status:', error);

      if (error instanceof ApiError) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to update device trust. Please try again.');
      }
    }
  };

  const handleRemoveAllOtherDevices = () => {
    const otherDevices = devices.filter(d => !d.isCurrentDevice);

    if (otherDevices.length === 0) {
      Alert.alert('No Devices', 'You don\'t have any other devices to remove.');
      return;
    }

    Alert.alert(
      'Remove All Other Devices',
      `This will remove ${otherDevices.length} device(s). You will need to sign in again on those devices.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove All',
          style: 'destructive',
          onPress: async () => {
            try {
              const promises = otherDevices.map(device =>
                deviceService.removeDevice(device.deviceId)
              );

              await Promise.all(promises);

              Alert.alert('Success', 'All other devices have been removed.');
              await loadDevices();
            } catch (error) {
              console.error('Error removing all devices:', error);

              if (error instanceof ApiError) {
                Alert.alert('Error', error.message);
              } else {
                Alert.alert('Error', 'Failed to remove some devices. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  const getDeviceIcon = (platform: string | null): string => {
    if (!platform) return 'phone-portrait-outline';

    const platformLower = platform.toLowerCase();
    if (platformLower.includes('ios') || platformLower.includes('iphone')) {
      return 'phone-portrait-outline';
    } else if (platformLower.includes('ipad')) {
      return 'tablet-portrait-outline';  // ADD THIS
    } else if (platformLower.includes('android')) {
      return 'phone-portrait-outline';
    } else if (platformLower.includes('web') || platformLower.includes('windows') || platformLower.includes('mac')) {  // UPDATE THIS
      return 'desktop-outline';
    }
    return 'phone-portrait-outline';
  };

  const formatLastSeen = (lastSeenAt: string | null): string => {
    if (!lastSeenAt) return 'Never';

    const date = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF"/>
          <Text style={styles.loadingText}>Loading devices...</Text> {/* ADD THIS */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Devices</Text>
          <Text style={styles.subtitle}>
            Manage devices where you're currently logged in. You can remove any
            device or mark devices as trusted.
          </Text>

          {/* Info Alert */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle" size={20} color="#007AFF"/>
            <Text style={styles.infoText}>
              Trusted devices won't require two-factor authentication for future logins.
            </Text>
          </View>

          {/* Devices Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Active Devices ({devices.length})
              </Text>
              {devices.length > 1 && (
                <TouchableOpacity onPress={handleRemoveAllOtherDevices}>
                  <Text style={styles.removeAllText}>Remove All Others</Text>
                </TouchableOpacity>
              )}
            </View>

            {devices.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={48}
                  color="#999"
                />
                <Text style={styles.emptyStateText}>No devices found</Text>
              </View>
            ) : (
              devices.map((device, index) => (
                <View
                  key={device.deviceId}
                  style={[
                    styles.deviceCard,
                    index === devices.length - 1 && styles.deviceCardLast,
                  ]}
                >
                  <View style={styles.deviceIcon}>
                    <Ionicons
                      name={getDeviceIcon(device.platform) as any}
                      size={24}
                      color="#007AFF"
                    />
                  </View>

                  <View style={styles.deviceInfo}>
                    <View style={styles.deviceHeader}>
                      <Text style={styles.deviceName}>
                        {device.deviceName || 'Unknown Device'}
                      </Text>
                      {device.isCurrentDevice && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>
                            THIS DEVICE
                          </Text>
                        </View>
                      )}
                      {device.isTrusted && (
                        <Ionicons
                          name="shield-checkmark"
                          size={16}
                          color="#2E7D32"
                          style={{marginLeft: 6}}
                        />
                      )}
                    </View>

                    <Text style={styles.devicePlatform}>
                      {device.platform || 'Unknown Platform'}
                      {device.platformVersion && ` ${device.platformVersion}`}
                      {device.deviceModel && ` • ${device.deviceModel}`}
                    </Text>

                    <Text style={styles.deviceActivity}>
                      Last active: {formatLastSeen(device.lastSeenAt)}
                    </Text>

                    {/* Device Actions */}
                    <View style={styles.deviceActions}>
                      <TouchableOpacity
                        style={styles.trustButton}
                        onPress={() => handleToggleTrust(device)}
                      >
                        <Ionicons
                          name={device.isTrusted ? 'shield' : 'shield-outline'}
                          size={14}
                          color={device.isTrusted ? '#2E7D32' : '#007AFF'}
                        />
                        <Text
                          style={[
                            styles.trustButtonText,
                            device.isTrusted && styles.trustButtonTextActive,
                          ]}
                        >
                          {device.isTrusted ? 'Trusted' : 'Mark as Trusted'}
                        </Text>
                      </TouchableOpacity>

                      {!device.isCurrentDevice && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveDevice(device)}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Security Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Tips</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2E7D32"/>
              <Text style={styles.tipText}>
                Regularly review your active devices
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2E7D32"/>
              <Text style={styles.tipText}>
                Remove devices you no longer use
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2E7D32"/>
              <Text style={styles.tipText}>
                Only mark your personal devices as trusted
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  deviceCardLast: {
    borderBottomWidth: 0,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  trustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  trustButtonText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  trustButtonTextActive: {
    color: '#2E7D32',
  },
  removeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 13,
    color: '#e74c3c',
    fontWeight: '500',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  removeAllText: {  // UPDATE existing logoutAllText
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
  },
});

export default DevicesScreen;