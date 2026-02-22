// src/screens/profile/CommunicationsScreen.tsx
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

interface CommunicationsScreenProps {
    navigation: any;
}

const CommunicationsScreen: React.FC<CommunicationsScreenProps> = ({ navigation }) => {
    const [reservationEmail, setReservationEmail] = useState(true);
    const [reservationPush, setReservationPush] = useState(false);
    const [waitlistEmail, setWaitlistEmail] = useState(false);
    const [waitlistPush, setWaitlistPush] = useState(false);
    const [marketingEmail, setMarketingEmail] = useState(false);

    const showComingSoon = () =>
        Alert.alert('Coming Soon', 'This preference will be available in an upcoming release.', [{ text: 'OK' }]);

    const sections = [
        {
            emoji: '🔔',
            title: 'Reservation Updates',
            description: 'Confirmations, reminders, and cancellation notices.',
            items: [
                { icon: 'mail-outline' as const, label: 'Email', value: reservationEmail, onChange: () => showComingSoon() },
                { icon: 'notifications-outline' as const, label: 'Push notifications', value: reservationPush, onChange: () => showComingSoon() },
            ],
        },
        {
            emoji: '⏳',
            title: 'Waitlist Updates',
            description: 'Get notified when a spot opens up for you.',
            items: [
                { icon: 'mail-outline' as const, label: 'Email', value: waitlistEmail, onChange: () => showComingSoon() },
                { icon: 'notifications-outline' as const, label: 'Push notifications', value: waitlistPush, onChange: () => showComingSoon() },
            ],
        },
        {
            emoji: '✨',
            title: 'Marketing',
            description: 'Trending restaurants, top picks & must-try spots.',
            items: [
                { icon: 'mail-outline' as const, label: 'Email', value: marketingEmail, onChange: () => showComingSoon() },
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
                <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>
                    Communications
                </AppText>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info banner */}
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle-outline" size={18} color={NAVY} />
                    <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ flex: 1 }}>
                        Push notification support is coming soon. Email preferences are active.
                    </AppText>
                </View>

                {sections.map((section, si) => (
                    <View key={section.title} style={{ marginBottom: Spacing['3'] }}>
                        <View style={styles.sectionLabelRow}>
                            <View style={styles.sectionTick} />
                            <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                                {section.emoji}  {section.title.toUpperCase()}
                            </AppText>
                        </View>
                        <AppText variant="caption" color={Colors.textOnLightTertiary} style={styles.sectionDesc}>
                            {section.description}
                        </AppText>
                        <View style={styles.card}>
                            {section.items.map((item, i) => (
                                <View key={item.label}>
                                    {i > 0 && <View style={styles.divider} />}
                                    <View style={styles.prefRow}>
                                        <View style={styles.prefLeft}>
                                            <View style={styles.iconWrap}>
                                                <Ionicons name={item.icon} size={17} color={NAVY} />
                                            </View>
                                            <AppText variant="bodyMedium" color={Colors.textOnLight}>{item.label}</AppText>
                                        </View>
                                        <Switch
                                            value={item.value}
                                            onValueChange={item.onChange}
                                            trackColor={{ false: Colors.cardBorder, true: Colors.success }}
                                            thumbColor={Colors.white}
                                            ios_backgroundColor={Colors.cardBorder}
                                        />
                                    </View>
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

    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing['2'],
        backgroundColor: 'rgba(15,51,70,0.05)',
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: 'rgba(15,51,70,0.10)',
        padding: Spacing['3'],
        marginBottom: Spacing['4'],
    },

    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: 4,
    },
    sectionTick: {
        width: 3, height: 14,
        backgroundColor: NAVY,
        borderRadius: 2,
    },
    sectionLabel: { letterSpacing: 0.8 },
    sectionDesc: {
        marginBottom: Spacing['2'],
        paddingLeft: Spacing['2'] + 3,
    },

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
    prefRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing['3'],
    },
    prefLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['3'],
    },
    iconWrap: {
        width: 32, height: 32,
        borderRadius: Radius.sm,
        backgroundColor: 'rgba(15,51,70,0.07)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CommunicationsScreen;
