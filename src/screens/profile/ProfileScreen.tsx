// src/screens/profile/ProfileScreen.tsx
import React, { useCallback, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { processingService } from '../../services/api/processingService';
import { ProfileScreenNavigationProp } from '../../navigation/AppNavigator';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

interface ProfileScreenProps {
    navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { favorites } = useFavorites();
    const [bookingsCount, setBookingsCount] = useState(0);
    const [reviewsCount, setReviewsCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            processingService.getCustomerReservationCount()
                .then(({ count }) => setBookingsCount(count))
                .catch(() => setBookingsCount(0));
            processingService.getCustomerReviewCount()
                .then(({ count }) => setReviewsCount(count))
                .catch(() => setReviewsCount(0));
        }, [])
    );

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out', style: 'destructive',
                onPress: async () => {
                    try { await logout(); }
                    catch { Alert.alert('Error', 'Failed to sign out. Please try again.'); }
                },
            },
        ]);
    };

    if (!user) return null;

    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

    const stats = [
        { label: 'Bookings',  value: bookingsCount,    onPress: () => (navigation as any).navigate('Bookings') },
        { label: 'Reviews',   value: reviewsCount,     onPress: () => navigation.navigate('AllReviews') },
        { label: 'Favourites', value: favorites.length, onPress: () => navigation.navigate('Favorites') },
    ];

    // Communications & Devices moved to Account Settings only
    const menuItems = [
        { icon: 'person-outline' as const,      label: 'Your Details',      sub: 'Name, phone & contact info',  onPress: () => navigation.navigate('YourDetails') },
        { icon: 'lock-closed-outline' as const, label: 'Change Password',   sub: 'Update your password',        onPress: () => navigation.navigate('ChangePassword') },
        { icon: 'settings-outline' as const,    label: 'Account Settings',  sub: 'Communications, devices & more', onPress: () => navigation.navigate('AccountSettings') },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ── Navy hero header with avatar ── */}
                <View style={styles.hero}>
                    <View style={styles.avatarRing}>
                        <View style={styles.avatar}>
                            <AppText style={styles.initials}>{initials}</AppText>
                        </View>
                    </View>
                    <AppText variant="sectionTitle" color={Colors.white} style={styles.heroName}>
                        {user.firstName} {user.lastName}
                    </AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.7)" style={styles.heroEmail}>
                        {user.email}
                    </AppText>

                    {/* Verification badges */}
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, user.emailVerified ? styles.badgeVerified : styles.badgePending]}>
                            <Ionicons
                                name={user.emailVerified ? 'checkmark-circle' : 'alert-circle'}
                                size={12}
                                color={user.emailVerified ? Colors.success : Colors.warning}
                            />
                            <AppText variant="captionMedium" color={user.emailVerified ? Colors.success : Colors.warning}>
                                Email {user.emailVerified ? 'Verified' : 'Unverified'}
                            </AppText>
                        </View>
                        <View style={[styles.badge, user.phoneVerified ? styles.badgeVerified : styles.badgePending]}>
                            <Ionicons
                                name={user.phoneVerified ? 'checkmark-circle' : 'alert-circle'}
                                size={12}
                                color={user.phoneVerified ? Colors.success : Colors.warning}
                            />
                            <AppText variant="captionMedium" color={user.phoneVerified ? Colors.success : Colors.warning}>
                                Phone {user.phoneVerified ? 'Verified' : 'Unverified'}
                            </AppText>
                        </View>
                    </View>
                </View>

                {/* ── Stats strip ── */}
                <View style={styles.statsStrip}>
                    {stats.map((stat, i) => (
                        <React.Fragment key={stat.label}>
                            {i > 0 && <View style={styles.statDivider} />}
                            <TouchableOpacity style={styles.statItem} onPress={stat.onPress} activeOpacity={0.7}>
                                <AppText style={styles.statValue}>{stat.value}</AppText>
                                <AppText variant="caption" color={Colors.textOnLightSecondary}>{stat.label}</AppText>
                            </TouchableOpacity>
                        </React.Fragment>
                    ))}
                </View>

                {/* ── Menu ── */}
                <View style={styles.menuCard}>
                    {menuItems.map((item, i) => (
                        <TouchableOpacity
                            key={item.label}
                            style={[styles.menuRow, i < menuItems.length - 1 && styles.menuRowBorder]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconWrap}>
                                <Ionicons name={item.icon} size={19} color={NAVY} />
                            </View>
                            <View style={styles.menuText}>
                                <AppText variant="bodyMedium" color={Colors.textOnLight}>{item.label}</AppText>
                                <AppText variant="caption" color={Colors.textOnLightTertiary}>{item.sub}</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={17} color={Colors.textOnLightTertiary} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Sign out ── */}
                <View style={styles.signOutWrap}>
                    <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.85}>
                        <Ionicons name="log-out-outline" size={18} color={Colors.white} />
                        <AppText variant="button" color={Colors.white}>Sign Out</AppText>
                    </TouchableOpacity>
                </View>

                <View style={{ height: Spacing['8'] }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.appBackground },

    // ── Hero ──────────────────────────────────────────────────────────────────
    hero: {
        backgroundColor: NAVY,
        alignItems: 'center',
        paddingTop: Spacing['6'],
        paddingBottom: Spacing['8'],
        paddingHorizontal: Spacing['5'],
    },
    avatarRing: {
        width: 96,
        height: 96,
        borderRadius: Radius.full,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['3'],
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 30,
        fontFamily: 'Inter_700Bold',
        color: Colors.white,
        letterSpacing: 1,
    },
    heroName: {
        fontSize: FontSize.xl,
        marginBottom: 4,
    },
    heroEmail: {
        marginBottom: Spacing['3'],
    },
    badgeRow: {
        flexDirection: 'row',
        gap: Spacing['2'],
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: Spacing['3'],
        paddingVertical: 5,
        borderRadius: Radius.full,
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    badgeVerified: { borderColor: Colors.success },
    badgePending:  { borderColor: Colors.warning },

    // ── Stats strip ───────────────────────────────────────────────────────────
    statsStrip: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        marginHorizontal: Spacing['4'],
        marginTop: -Spacing['5'],
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        overflow: 'hidden',
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: Spacing['5'],
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing['4'],
    },
    statValue: {
        fontSize: FontSize['2xl'],
        fontFamily: 'Inter_700Bold',
        color: NAVY,
        marginBottom: 3,
    },
    statDivider: { width: 1, backgroundColor: Colors.cardBorder },

    // ── Menu ──────────────────────────────────────────────────────────────────
    menuCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        marginHorizontal: Spacing['4'],
        marginBottom: Spacing['4'],
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        overflow: 'hidden',
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['3'] + 2,
        gap: Spacing['3'],
    },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
    menuIconWrap: {
        width: 38,
        height: 38,
        borderRadius: Radius.md,
        backgroundColor: 'rgba(15,51,70,0.07)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: { flex: 1, gap: 2 },

    // ── Sign out ──────────────────────────────────────────────────────────────
    signOutWrap: {
        paddingHorizontal: Spacing['4'],
        marginBottom: Spacing['2'],
    },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing['2'],
        backgroundColor: Colors.error,
        paddingVertical: Spacing['3'] + 2,
        borderRadius: Radius.lg,
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
});

export default ProfileScreen;
