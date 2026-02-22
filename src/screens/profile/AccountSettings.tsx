// src/screens/profile/AccountSettings.tsx
import React from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

interface AccountSettingsScreenProps {
    navigation: any;
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ navigation }) => {
    const showComingSoon = (feature: string) =>
        Alert.alert('Coming Soon', `${feature} will be available soon!`, [{ text: 'OK' }]);

    const sections = [
        {
            label: '👤  ACCOUNT',
            items: [
                { icon: 'person-outline' as const,         label: 'Your Details',    sub: 'Name, phone & contact info',     onPress: () => navigation.navigate('YourDetails'),    enabled: true },
                { icon: 'notifications-outline' as const,  label: 'Communications',  sub: 'Email & push preferences',       onPress: () => navigation.navigate('Communications'), enabled: true },
                { icon: 'phone-portrait-outline' as const, label: 'Devices',         sub: 'Manage your signed-in devices',  onPress: () => navigation.navigate('Devices'),        enabled: true },
            ],
        },
        {
            label: '⚙️  MORE',
            items: [
                { icon: 'card-outline' as const,               label: 'Payment Methods', sub: 'Manage saved cards',             onPress: () => showComingSoon('Payment Methods'), enabled: false },
                { icon: 'help-circle-outline' as const,        label: 'Help & Support',  sub: 'FAQs and contact us',            onPress: () => showComingSoon('Help & Support'),  enabled: false },
                { icon: 'information-circle-outline' as const, label: 'Terms & Privacy', sub: 'Legal information',              onPress: () => showComingSoon('Terms & Privacy'), enabled: false },
            ],
        },
    ];

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Navy header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>Account Settings</AppText>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {sections.map((section) => (
                    <View key={section.label} style={{ marginBottom: Spacing['4'] }}>
                        <View style={styles.sectionLabelRow}>
                            <View style={styles.sectionTick} />
                            <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                                {section.label}
                            </AppText>
                        </View>
                        <View style={styles.card}>
                            {section.items.map((item, i) => (
                                <View key={item.label}>
                                    {i > 0 && <View style={styles.divider} />}
                                    <TouchableOpacity
                                        style={[styles.menuRow, !item.enabled && styles.menuRowDisabled]}
                                        onPress={item.onPress}
                                        activeOpacity={item.enabled ? 0.7 : 0.5}
                                    >
                                        <View style={[styles.iconWrap, !item.enabled && styles.iconWrapDisabled]}>
                                            <Ionicons
                                                name={item.icon}
                                                size={18}
                                                color={item.enabled ? NAVY : Colors.textOnLightTertiary}
                                            />
                                        </View>
                                        <View style={styles.menuText}>
                                            <AppText
                                                variant="bodyMedium"
                                                color={item.enabled ? Colors.textOnLight : Colors.textOnLightTertiary}
                                            >
                                                {item.label}
                                            </AppText>
                                            <AppText variant="caption" color={Colors.textOnLightTertiary}>
                                                {item.sub}
                                            </AppText>
                                        </View>
                                        {!item.enabled ? (
                                            <View style={styles.comingBadge}>
                                                <AppText variant="captionMedium" color={Colors.textOnLightTertiary} style={{ fontSize: 10 }}>
                                                    SOON
                                                </AppText>
                                            </View>
                                        ) : (
                                            <Ionicons name="chevron-forward" size={16} color={Colors.textOnLightTertiary} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                <View style={{ height: Spacing['8'] }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.appBackground },

    header: {
        backgroundColor: NAVY,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['4'],
        paddingVertical: Spacing['3'],
    },
    backBtn: {
        width: 36, height: 36,
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: FontSize.lg },

    scroll: { flex: 1 },
    scrollContent: { padding: Spacing['4'] },

    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['2'],
    },
    sectionTick: { width: 3, height: 14, backgroundColor: NAVY, borderRadius: 2 },
    sectionLabel: { letterSpacing: 0.8 },

    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        paddingHorizontal: Spacing['4'],
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    divider: { height: 1, backgroundColor: Colors.cardBorder },

    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['3'],
        paddingVertical: Spacing['3'],
    },
    menuRowDisabled: { opacity: 0.55 },
    menuText: { flex: 1, gap: 2 },
    iconWrap: {
        width: 36, height: 36,
        borderRadius: Radius.sm,
        backgroundColor: 'rgba(15,51,70,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapDisabled: { backgroundColor: Colors.cardBackground },
    comingBadge: {
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        paddingHorizontal: Spacing['2'],
        paddingVertical: 2,
    },
});

export default AccountSettingsScreen;
