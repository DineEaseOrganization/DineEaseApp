// src/screens/profile/DeleteAccountScreen.tsx
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { profileService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

interface DeleteAccountScreenProps {
    navigation: any;
}

const DeleteAccountScreen: React.FC<DeleteAccountScreenProps> = ({ navigation }) => {
    const { logout } = useAuth();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [action, setAction] = useState<'DEACTIVATE' | 'DELETE'>('DEACTIVATE');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!password) { Alert.alert('Missing Password', 'Please enter your password to confirm.'); return; }

        const actionText = action === 'DEACTIVATE' ? 'deactivate' : 'permanently delete';
        const warningText = action === 'DELETE'
            ? 'This action cannot be undone. All your data will be permanently deleted.'
            : 'Your account will be deactivated but can be restored within 30 days.';

        Alert.alert(
            `${action === 'DELETE' ? 'Delete' : 'Deactivate'} Account`,
            `Are you sure you want to ${actionText} your account?\n\n${warningText}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action === 'DELETE' ? 'Delete' : 'Deactivate',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const response = await profileService.deleteAccount({ password, action, reason: reason.trim() || undefined });
                            if (response.success) {
                                Alert.alert(
                                    `Account ${action === 'DELETE' ? 'Deleted' : 'Deactivated'}`,
                                    response.message,
                                    [{
                                        text: 'OK',
                                        onPress: async () => {
                                            await logout();
                                            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                                        },
                                    }]
                                );
                            } else {
                                Alert.alert('Error', response.message);
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed. Please try again.');
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const ActionOption = ({ type, title, description }: { type: 'DEACTIVATE' | 'DELETE'; title: string; description: string }) => {
        const selected = action === type;
        const isDelete = type === 'DELETE';
        return (
            <TouchableOpacity
                style={[
                    styles.actionCard,
                    selected && (isDelete ? styles.actionCardSelectedDelete : styles.actionCardSelectedDeactivate),
                ]}
                onPress={() => setAction(type)}
                activeOpacity={0.8}
            >
                <View style={styles.actionCardHeader}>
                    <View style={[styles.radio, selected && (isDelete ? styles.radioDelete : styles.radioDeactivate)]}>
                        {selected && <View style={styles.radioInner} />}
                    </View>
                    <AppText variant="bodyMedium" color={isDelete ? Colors.error : NAVY}>{title}</AppText>
                </View>
                <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.actionDesc}>
                    {description}
                </AppText>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Navy header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>Delete Account</AppText>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Warning banner */}
                <View style={styles.warningBanner}>
                    <Ionicons name="warning-outline" size={22} color={Colors.error} />
                    <AppText variant="captionMedium" color={Colors.error} style={{ flex: 1 }}>
                        This section contains sensitive account actions. Please read carefully.
                    </AppText>
                </View>

                {/* Action selection */}
                <View style={styles.sectionLabelRow}>
                    <View style={[styles.sectionTick, { backgroundColor: Colors.error }]} />
                    <AppText variant="label" color={Colors.error} style={styles.sectionLabel}>
                        SELECT ACTION
                    </AppText>
                </View>

                <ActionOption
                    type="DEACTIVATE"
                    title="Deactivate Account"
                    description="Temporarily disable your account. You can restore it within 30 days by logging back in."
                />
                <ActionOption
                    type="DELETE"
                    title="Permanently Delete"
                    description="Permanently delete your account and all associated data. This cannot be undone."
                />

                {/* Password confirmation */}
                <View style={[styles.sectionLabelRow, { marginTop: Spacing['4'] }]}>
                    <View style={[styles.sectionTick, { backgroundColor: Colors.error }]} />
                    <AppText variant="label" color={Colors.error} style={styles.sectionLabel}>
                        CONFIRM WITH PASSWORD
                    </AppText>
                </View>
                <View style={styles.card}>
                    <View style={styles.fieldGroup}>
                        <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.fieldLabel}>
                            Your Password *
                        </AppText>
                        <View style={styles.passwordWrap}>
                            <TextInput
                                style={styles.passwordInput}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.textOnLightTertiary}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)} activeOpacity={0.7}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color={Colors.textOnLightSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.fieldGroup}>
                        <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.fieldLabel}>
                            Reason (Optional)
                        </AppText>
                        <TextInput
                            style={styles.textArea}
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Tell us why you're leaving (optional)"
                            placeholderTextColor={Colors.textOnLightTertiary}
                            multiline
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <AppText variant="caption" color={Colors.textOnLightTertiary} style={{ textAlign: 'right', marginTop: 4 }}>
                            {reason.length}/500
                        </AppText>
                    </View>
                </View>

                {/* Dynamic warning */}
                <View style={styles.dangerBox}>
                    <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
                    <AppText variant="caption" color={Colors.error} style={{ flex: 1 }}>
                        {action === 'DELETE'
                            ? 'Permanent deletion cannot be undone. All your reservations, reviews, and preferences will be lost forever.'
                            : 'After deactivation you have 30 days to restore your account. After that, it will be permanently deleted.'}
                    </AppText>
                </View>

                {/* Action button */}
                <TouchableOpacity
                    style={[styles.deleteBtn, (!password || isLoading) && styles.deleteBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!password || isLoading}
                    activeOpacity={0.85}
                >
                    {isLoading
                        ? <ActivityIndicator color={Colors.white} />
                        : <AppText variant="button" color={Colors.white}>
                            {action === 'DELETE' ? 'Permanently Delete Account' : 'Deactivate Account'}
                        </AppText>
                    }
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <AppText variant="bodyMedium" color={Colors.textOnLightSecondary}>Cancel</AppText>
                </TouchableOpacity>

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

    warningBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing['2'],
        backgroundColor: Colors.errorFaded,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.error,
        padding: Spacing['3'],
        marginBottom: Spacing['4'],
    },

    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['2'],
    },
    sectionTick: { width: 3, height: 14, borderRadius: 2 },
    sectionLabel: { letterSpacing: 0.8 },

    // Action option cards
    actionCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        borderWidth: 2,
        borderColor: Colors.cardBorder,
        padding: Spacing['4'],
        marginBottom: Spacing['2'],
    },
    actionCardSelectedDeactivate: { borderColor: NAVY, backgroundColor: 'rgba(15,51,70,0.04)' },
    actionCardSelectedDelete: { borderColor: Colors.error, backgroundColor: Colors.errorFaded },
    actionCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['3'],
        marginBottom: 6,
    },
    radio: {
        width: 20, height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioDeactivate: { borderColor: NAVY },
    radioDelete: { borderColor: Colors.error },
    radioInner: {
        width: 10, height: 10,
        borderRadius: 5,
        backgroundColor: Colors.error,
    },
    actionDesc: { marginLeft: 32, lineHeight: 18 },

    // Form card
    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        paddingHorizontal: Spacing['4'],
        paddingBottom: Spacing['2'],
        marginBottom: Spacing['3'],
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    divider: { height: 1, backgroundColor: Colors.cardBorder, marginVertical: Spacing['2'] },
    fieldGroup: { paddingTop: Spacing['3'] },
    fieldLabel: { letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase', fontSize: 11 },
    passwordWrap: { position: 'relative' },
    passwordInput: {
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing['3'],
        paddingVertical: 11,
        paddingRight: 44,
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight,
    },
    eyeBtn: { position: 'absolute', right: 12, top: 11, padding: 2 },
    textArea: {
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['2'],
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight,
        minHeight: 80,
    },

    dangerBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing['2'],
        backgroundColor: Colors.errorFaded,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.error,
        padding: Spacing['3'],
        marginBottom: Spacing['4'],
    },

    deleteBtn: {
        backgroundColor: Colors.error,
        paddingVertical: Spacing['3'] + 2,
        borderRadius: Radius.lg,
        alignItems: 'center',
        marginBottom: Spacing['2'],
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    deleteBtnDisabled: {
        backgroundColor: Colors.textOnLightTertiary,
        shadowOpacity: 0,
        elevation: 0,
    },
    cancelBtn: {
        paddingVertical: Spacing['3'],
        alignItems: 'center',
    },
});

export default DeleteAccountScreen;
