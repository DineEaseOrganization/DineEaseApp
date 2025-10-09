// src/screens/settings/CommunicationsScreen.tsx
import React, {useState} from 'react';
import {Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

interface CommunicationsScreenProps {
  navigation: any;
}

const CommunicationsScreen: React.FC<CommunicationsScreenProps> = ({navigation}) => {
  // Push Notifications State
  const [pushNotifications, setPushNotifications] = useState(true);

  // Reservation Updates State
  const [reservationEmail, setReservationEmail] = useState(true);
  const [reservationPush, setReservationPush] = useState(true);

  // Waitlist Updates State
  const [waitlistEmail, setWaitlistEmail] = useState(false);
  const [waitlistPush, setWaitlistPush] = useState(true);

  // Marketing State
  const [marketingEmail, setMarketingEmail] = useState(true);

  const handlePushNotificationsToggle = () => {
    if (!pushNotifications) {
      Alert.alert(
        'Enable Notifications',
        'Allow notifications from DineEase to stay in the know about your upcoming bookings, new features and more.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Yes, notify me', onPress: () => setPushNotifications(true)}
        ]
      );
    } else {
      setPushNotifications(false);
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
          <Text style={styles.title}>Communications</Text>
        </View>

        <View style={styles.content}>
          {/* Push Notifications Banner */}
          {!pushNotifications && (
            <View style={styles.banner}>
              <Ionicons name="notifications-off-outline" size={48} color="#666" style={styles.bannerIcon}/>
              <Text style={styles.bannerTitle}>Looks like all your notifications are off</Text>
              <Text style={styles.bannerDescription}>
                Allow notifications from DineEase to stay in the know about your upcoming bookings, new features and
                more.
              </Text>
              <TouchableOpacity
                style={styles.bannerButton}
                onPress={() => setPushNotifications(true)}
              >
                <Text style={styles.bannerButtonText}>Yes, notify me</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reservation Updates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reservation updates</Text>
            <Text style={styles.sectionDescription}>
              Get updates about your reservations including confirmations, reminders, and cancellations.
            </Text>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="mail-outline" size={20} color="#666"/>
                <Text style={styles.preferenceText}>Email</Text>
              </View>
              <Switch
                value={reservationEmail}
                onValueChange={setReservationEmail}
                trackColor={{false: '#e0e0e0', true: '#34C759'}}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="notifications-outline" size={20} color="#666"/>
                <Text style={styles.preferenceText}>Push notifications</Text>
              </View>
              <Switch
                value={reservationPush}
                onValueChange={setReservationPush}
                trackColor={{false: '#e0e0e0', true: '#34C759'}}
                thumbColor="#fff"
                disabled={!pushNotifications}
              />
            </View>
          </View>

          {/* Waitlist Updates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Waitlist updates</Text>
            <Text style={styles.sectionDescription}>
              Standard text messaging rates may apply. You can opt out at any time.
            </Text>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="mail-outline" size={20} color="#666"/>
                <Text style={styles.preferenceText}>Email</Text>
              </View>
              <Switch
                value={waitlistEmail}
                onValueChange={setWaitlistEmail}
                trackColor={{false: '#e0e0e0', true: '#34C759'}}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="notifications-outline" size={20} color="#666"/>
                <Text style={styles.preferenceText}>Push notifications</Text>
              </View>
              <Switch
                value={waitlistPush}
                onValueChange={setWaitlistPush}
                trackColor={{false: '#e0e0e0', true: '#34C759'}}
                thumbColor="#fff"
                disabled={!pushNotifications}
              />
            </View>
          </View>

          {/* Marketing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Marketing</Text>
            <Text style={styles.sectionDescription}>
              Stay current on trending restaurants, top picks & must-try spots.
            </Text>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="mail-outline" size={20} color="#666"/>
                <Text style={styles.preferenceText}>Email</Text>
              </View>
              <Switch
                value={marketingEmail}
                onValueChange={setMarketingEmail}
                trackColor={{false: '#e0e0e0', true: '#34C759'}}
                thumbColor="#fff"
              />
            </View>
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
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#fff',
    padding: 24,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerIcon: {
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  bannerDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  bannerButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CommunicationsScreen;