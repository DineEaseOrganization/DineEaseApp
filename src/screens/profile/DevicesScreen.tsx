// src/screens/profile/DevicesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeviceDTO } from '../../types/api.types';
import { ApiError, deviceService } from '../../services/api';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

interface DevicesScreenProps {
    navigation: any;
}

const DevicesScreen: React.FC<DevicesScreenProps> = ({ navigation }) => {
    const [devices, setDevices] = useState<DeviceDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { loadDevices(); }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);
            const response = await deviceService.listDevices();
            if (response.success) {
                setDevices(response.devices);
            } else {
                Alert.alert('Error', 'Failed to load devices');
            }
        } catch (error) {
            Alert.alert('Error', error instanceof ApiError ? error.message : 'Failed to load devices. Please try again.');
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
        if (device.isCurrentDevice) {
            Alert.alert('Cannot Remove', 'You cannot remove the device you are currently using.', [{ text: 'OK' }]);
            return;
        }
        Alert.alert(
            'Remove Device',
            `Remove "${device.deviceName || 'Unknown Device'}"? You will need to sign in again on this device.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove', style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await deviceService.removeDevice(device.deviceId);
                            if (res.success) { Alert.alert('Removed', res.message); await loadDevices(); }
                            else Alert.alert('Error', res.message);
                        } catch (error) {
                            Alert.alert('Error', error instanceof ApiError ? error.message : 'Failed to remove device.');
                        }
                    },
                },
            ]
        );
    };

    const handleToggleTrust = async (device: DeviceDTO) => {
        const newTrust = !device.isTrusted;
        try {
            const res = await deviceService.updateDeviceTrust(device.deviceId, newTrust);
            if (res.success) {
                setDevices(prev => prev.map(d => d.deviceId === device.deviceId ? { ...d, isTrusted: newTrust } : d));
                Alert.alert('Updated', newTrust ? 'Device marked as trusted' : 'Device trust removed');
            } else Alert.alert('Error', res.message);
        } catch (error) {
            Alert.alert('Error', error instanceof ApiError ? error.message : 'Failed to update trust.');
        }
    };

    const handleRemoveAll = () => {
        const others = devices.filter(d => !d.isCurrentDevice);
        if (!others.length) { Alert.alert('No Devices', "You don't have any other devices to remove."); return; }
        Alert.alert(
            'Remove All Other Devices',
            `This will remove ${others.length} device(s). They will need to sign in again.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove All', style: 'destructive',
                    onPress: async () => {
                        try {
                            await Promise.all(others.map(d => deviceService.removeDevice(d.deviceId)));
                            Alert.alert('Done', 'All other devices have been removed.');
                            await loadDevices();
                        } catch {
                            Alert.alert('Error', 'Failed to remove some devices.');
                        }
                    },
                },
            ]
        );
    };

    const getDeviceIcon = (platform: string | null): keyof typeof Ionicons.glyphMap => {
        if (!platform) return 'phone-portrait-outline';
        const p = platform.toLowerCase();
        if (p.includes('ipad')) return 'tablet-portrait-outline';
        if (p.includes('web') || p.includes('windows') || p.includes('mac')) return 'desktop-outline';
        return 'phone-portrait-outline';
    };

    const formatLastSeen = (lastSeenAt: string | null): string => {
        if (!lastSeenAt) return 'Never';
        const diff = Date.now() - new Date(lastSeenAt).getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'Active now';
        if (mins < 60) return `${mins}m ago`;
        if (hrs < 24) return `${hrs}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(lastSeenAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Ionicons name="chevron-back" size={20} color={Colors.white} />
                    </TouchableOpacity>
                    <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>Devices</AppText>
                    <View style={{ width: 36 }} />
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={NAVY} />
                    <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginTop: Spacing['3'] }}>
                        Loading devices...
                    </AppText>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Navy header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>Devices</AppText>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={NAVY} />}
            >
                {/* Info tip */}
                <View style={styles.infoBanner}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={NAVY} />
                    <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ flex: 1 }}>
                        Trusted devices skip two-factor authentication for future logins.
                    </AppText>
                </View>

                {/* Active Devices */}
                <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionTick} />
                    <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                        📱  ACTIVE DEVICES ({devices.length})
                    </AppText>
                    {devices.length > 1 && (
                        <TouchableOpacity onPress={handleRemoveAll} activeOpacity={0.8}>
                            <AppText variant="captionMedium" color={Colors.error}>Remove Others</AppText>
                        </TouchableOpacity>
                    )}
                </View>

                {devices.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="phone-portrait-outline" size={40} color={Colors.textOnLightTertiary} />
                        <AppText variant="body" color={Colors.textOnLightTertiary} style={{ marginTop: Spacing['3'] }}>
                            No devices found
                        </AppText>
                    </View>
                ) : (
                    <View style={styles.card}>
                        {devices.map((device, i) => (
                            <View key={device.deviceId}>
                                {i > 0 && <View style={styles.divider} />}
                                <View style={styles.deviceRow}>
                                    {/* Icon */}
                                    <View style={[styles.deviceIconWrap, device.isCurrentDevice && styles.deviceIconWrapCurrent]}>
                                        <Ionicons
                                            name={getDeviceIcon(device.platform)}
                                            size={20}
                                            color={device.isCurrentDevice ? Colors.white : NAVY}
                                        />
                                    </View>

                                    {/* Info */}
                                    <View style={styles.deviceInfo}>
                                        <View style={styles.deviceNameRow}>
                                            <AppText variant="bodyMedium" color={Colors.textOnLight} numberOfLines={1} style={{ flex: 1 }}>
                                                {device.deviceName || 'Unknown Device'}
                                            </AppText>
                                            {device.isCurrentDevice && (
                                                <View style={styles.currentBadge}>
                                                    <AppText variant="captionMedium" color={Colors.success} style={{ fontSize: 10 }}>
                                                        THIS DEVICE
                                                    </AppText>
                                                </View>
                                            )}
                                            {device.isTrusted && !device.isCurrentDevice && (
                                                <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
                                            )}
                                        </View>

                                        <AppText variant="caption" color={Colors.textOnLightSecondary}>
                                            {[device.platform, device.platformVersion, device.deviceModel].filter(Boolean).join(' · ')}
                                        </AppText>
                                        <AppText variant="caption" color={Colors.textOnLightTertiary} style={{ marginTop: 2 }}>
                                            Last active: {formatLastSeen(device.lastSeenAt)}
                                        </AppText>

                                        {/* Actions */}
                                        <View style={styles.deviceActions}>
                                            <TouchableOpacity
                                                style={[styles.actionPill, device.isTrusted && styles.actionPillTrusted]}
                                                onPress={() => handleToggleTrust(device)}
                                                activeOpacity={0.8}
                                            >
                                                <Ionicons
                                                    name={device.isTrusted ? 'shield' : 'shield-outline'}
                                                    size={12}
                                                    color={device.isTrusted ? Colors.success : NAVY}
                                                />
                                                <AppText variant="captionMedium" color={device.isTrusted ? Colors.success : NAVY}>
                                                    {device.isTrusted ? 'Trusted' : 'Mark Trusted'}
                                                </AppText>
                                            </TouchableOpacity>
                                            {!device.isCurrentDevice && (
                                                <TouchableOpacity
                                                    style={styles.removePill}
                                                    onPress={() => handleRemoveDevice(device)}
                                                    activeOpacity={0.8}
                                                >
                                                    <AppText variant="captionMedium" color={Colors.error}>Remove</AppText>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Security tips */}
                <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionTick} />
                    <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                        🔒  SECURITY TIPS
                    </AppText>
                </View>
                <View style={styles.tipsCard}>
                    {[
                        'Regularly review your active devices',
                        'Remove devices you no longer use',
                        'Only mark your personal devices as trusted',
                    ].map((tip, i) => (
                        <View key={i} style={styles.tipRow}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ flex: 1 }}>{tip}</AppText>
                        </View>
                    ))}
                </View>

                <View style={{ height: Spacing['8'] }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.appBackground },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['5'] },

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
        marginBottom: Spacing['2'],
        marginTop: Spacing['1'],
    },
    sectionTick: { width: 3, height: 14, backgroundColor: NAVY, borderRadius: 2 },
    sectionLabel: { flex: 1, letterSpacing: 0.8 },

    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        paddingHorizontal: Spacing['4'],
        marginBottom: Spacing['4'],
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    divider: { height: 1, backgroundColor: Colors.cardBorder },
    emptyCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        padding: Spacing['8'],
        alignItems: 'center',
        marginBottom: Spacing['4'],
    },

    deviceRow: {
        flexDirection: 'row',
        gap: Spacing['3'],
        paddingVertical: Spacing['3'],
    },
    deviceIconWrap: {
        width: 42, height: 42,
        borderRadius: Radius.md,
        backgroundColor: 'rgba(15,51,70,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    deviceIconWrapCurrent: {
        backgroundColor: NAVY,
    },
    deviceInfo: { flex: 1 },
    deviceNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: 3,
    },
    currentBadge: {
        backgroundColor: Colors.successFaded,
        paddingHorizontal: Spacing['2'],
        paddingVertical: 2,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.success,
    },
    deviceActions: {
        flexDirection: 'row',
        gap: Spacing['2'],
        marginTop: Spacing['2'],
    },
    actionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(15,51,70,0.07)',
        paddingHorizontal: Spacing['2'] + 2,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    actionPillTrusted: {
        backgroundColor: Colors.successFaded,
    },
    removePill: {
        paddingHorizontal: Spacing['2'] + 2,
        paddingVertical: 4,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.error,
        backgroundColor: Colors.errorFaded,
    },

    tipsCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        padding: Spacing['4'],
        gap: Spacing['2'],
        marginBottom: Spacing['4'],
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing['2'],
    },
});

export default DevicesScreen;
