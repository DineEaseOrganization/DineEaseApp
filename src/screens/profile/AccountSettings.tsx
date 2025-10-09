import React from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

interface AccountSettingsScreenProps {
  navigation: any;
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({navigation}) => {
  const handleYourDetailsPress = () => {
    navigation.navigate('YourDetails');
  };

  const handleCommunicationsPress = () => {
    navigation.navigate('Communications');
  };

  const handleDevicesPress = () => {
    navigation.navigate('Devices');
  };

  const handleDisabledPress = (feature: string) => {
    Alert.alert(
      'Coming Soon',
      `${feature} feature will be available soon!`,
      [{text: 'OK'}]
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
          <Text style={styles.title}>Account settings</Text>

          {/* Your Details */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleYourDetailsPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={24} color="#333"/>
              <Text style={styles.menuItemText}>Your details</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666"/>
          </TouchableOpacity>

          {/* Communications */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleCommunicationsPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="chatbubble-outline" size={24} color="#333"/>
              <Text style={styles.menuItemText}>Communications</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666"/>
          </TouchableOpacity>

          {/* Devices */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDevicesPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="phone-portrait-outline" size={24} color="#333"/>
              <Text style={styles.menuItemText}>Devices</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666"/>
          </TouchableOpacity>

          {/* Payment Methods - Disabled */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDisabled]}
            onPress={() => handleDisabledPress('Payment methods')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="card-outline" size={24} color="#999"/>
              <Text style={[styles.menuItemText, styles.menuItemTextDisabled]}>
                Payment methods
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc"/>
          </TouchableOpacity>

          {/* Help & Support - Disabled */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDisabled]}
            onPress={() => handleDisabledPress('Help & Support')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#999"/>
              <Text style={[styles.menuItemText, styles.menuItemTextDisabled]}>
                Help & Support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc"/>
          </TouchableOpacity>

          {/* Terms & Privacy - Disabled */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDisabled]}
            onPress={() => handleDisabledPress('Terms & Privacy')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle-outline" size={24} color="#999"/>
              <Text style={[styles.menuItemText, styles.menuItemTextDisabled]}>
                Terms & Privacy
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc"/>
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
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuItemTextDisabled: {
    color: '#999',
  },
});

export default AccountSettingsScreen;