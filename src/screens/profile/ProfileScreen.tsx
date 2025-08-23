// src/screens/profile/ProfileScreen.tsx
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { dummyReviews } from '../../data/dummyData';
import { ProfileScreenProps } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(true);
    const { user, logout } = useAuth();

    const userReviewsCount = dummyReviews.length;
    // In real app, this would be fetched from the user's actual favorites
    const favoritesCount = 5; // Mock count

    const handleEditProfile = () => {
        Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            // Navigation will be handled automatically by auth state change
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    // If user is not available, this shouldn't render (protected by ProtectedScreen)
    if (!user) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>

                {/* User Info */}
                <View style={styles.userSection}>
                    <View style={styles.userInfo}>
                        <Image
                            source={{
                                uri: user.profileImage ||
                                    'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150'
                            }}
                            style={styles.profileImage}
                        />
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>
                                {user.firstName} {user.lastName}
                            </Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                            <Text style={styles.userPhone}>{user.phone}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsSection}>
                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => navigation.navigate('AllReviews')}
                    >
                        <Text style={styles.statNumber}>{userReviewsCount}</Text>
                        <Text style={styles.statLabel}>Reviews</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => navigation.navigate('Favorites')}
                    >
                        <Text style={styles.statNumber}>{favoritesCount}</Text>
                        <Text style={styles.statLabel}>Favorites</Text>
                    </TouchableOpacity>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>Visits</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('AllReviews')}
                    >
                        <Text style={styles.actionButtonIcon}>⭐</Text>
                        <View style={styles.actionButtonContent}>
                            <Text style={styles.actionButtonText}>My Reviews</Text>
                            <Text style={styles.actionButtonSubtext}>View all your restaurant reviews</Text>
                        </View>
                        <Text style={styles.actionButtonArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Favorites')}
                    >
                        <Text style={styles.actionButtonIcon}>❤️</Text>
                        <View style={styles.actionButtonContent}>
                            <Text style={styles.actionButtonText}>Favorite Restaurants</Text>
                            <Text style={styles.actionButtonSubtext}>Your saved restaurants</Text>
                        </View>
                        <Text style={styles.actionButtonArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Push Notifications</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Email Updates</Text>
                        <Switch
                            value={emailUpdates}
                            onValueChange={setEmailUpdates}
                            trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                        />
                    </View>

                    <TouchableOpacity style={styles.settingButton}>
                        <Text style={styles.settingButtonText}>Payment Methods</Text>
                        <Text style={styles.settingArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingButton}>
                        <Text style={styles.settingButtonText}>Help & Support</Text>
                        <Text style={styles.settingArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingButton}>
                        <Text style={styles.settingButtonText}>Privacy Policy</Text>
                        <Text style={styles.settingArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingButton}>
                        <Text style={styles.settingButtonText}>Terms of Service</Text>
                        <Text style={styles.settingArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacing} />
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
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    userSection: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 10,
    },
    userInfo: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 16,
    },
    userDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    userPhone: {
        fontSize: 14,
        color: '#666',
    },
    editButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    editButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    statsSection: {
        backgroundColor: 'white',
        flexDirection: 'row',
        paddingVertical: 20,
        marginBottom: 10,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    section: {
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    actionButtonIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    actionButtonContent: {
        flex: 1,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    actionButtonSubtext: {
        fontSize: 14,
        color: '#666',
    },
    actionButtonArrow: {
        fontSize: 20,
        color: '#ccc',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingLabel: {
        fontSize: 16,
        color: '#333',
    },
    settingButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingButtonText: {
        fontSize: 16,
        color: '#333',
    },
    settingArrow: {
        fontSize: 20,
        color: '#ccc',
    },
    logoutButton: {
        backgroundColor: '#e74c3c',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomSpacing: {
        height: 100,
    },
});

export default ProfileScreen;