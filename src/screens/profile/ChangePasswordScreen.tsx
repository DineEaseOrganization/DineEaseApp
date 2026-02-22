// src/screens/profile/ChangePasswordScreen.tsx
import React, { useEffect, useState } from 'react';
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
import { passwordService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

interface PasswordStrength {
    isValid: boolean;
    strength: 'weak' | 'fair' | 'good' | 'strong';
    violations: string[];
    suggestions: string[];
}

interface ChangePasswordScreenProps {
    navigation: any;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
    const { logout } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
    const [checkingStrength, setCheckingStrength] = useState(false);

    useEffect(() => {
        if (newPassword.length >= 3) {
            const timer = setTimeout(async () => {
                setCheckingStrength(true);
                try {
                    const result = await passwordService.checkPasswordStrength(newPassword);
                    setPasswordStrength(result as any);
                } catch { /* silent */ } finally {
                    setCheckingStrength(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setPasswordStrength(null);
        }
    }, [newPassword]);

    const strengthColor = (s: string) =>
        ({ weak: Colors.error, fair: Colors.warning, good: '#3498db', strong: Colors.success }[s] ?? Colors.cardBorder);

    const strengthWidth = (s: string) =>
        ({ weak: '25%', fair: '50%', good: '75%', strong: '100%' }[s] ?? '0%') as `${number}%`;

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Missing Information', 'Please fill in all fields.'); return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Invalid Password', 'New password must be at least 8 characters.'); return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match.'); return;
        }
        if (currentPassword === newPassword) {
            Alert.alert('Same Password', 'New password must be different from current.'); return;
        }
        if (passwordStrength && !passwordStrength.isValid) {
            Alert.alert('Weak Password', 'Please choose a stronger password.'); return;
        }

        setIsLoading(true);
        try {
            const response = await passwordService.changePassword(currentPassword, newPassword);
            if (response.success) {
                if (response.forceLogoutAllDevices) {
                    Alert.alert(
                        'Password Changed',
                        'For security, you have been logged out from all devices.',
                        [{ text: 'OK', onPress: async () => { await logout(); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); } }]
                    );
                } else {
                    Alert.alert('Success', 'Password changed successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
                }
            } else {
                Alert.alert('Error', response.message);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to change password.');
        } finally {
            setIsLoading(false);
        }
    };

    const canSubmit = !!currentPassword && !!newPassword && !!confirmPassword && !isLoading;

    const PasswordField = ({
        label, value, onChange, show, onToggle, placeholder,
    }: {
        label: string; value: string; onChange: (v: string) => void;
        show: boolean; onToggle: () => void; placeholder: string;
    }) => (
        <View style={styles.fieldGroup}>
            <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.fieldLabel}>{label}</AppText>
            <View style={styles.passwordWrap}>
                <TextInput
                    style={styles.passwordInput}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textOnLightTertiary}
                    secureTextEntry={!show}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={onToggle} activeOpacity={0.7}>
                    <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={19} color={Colors.textOnLightSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Navy header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>Change Password</AppText>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Current password */}
                <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionTick} />
                    <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                        🔑  CURRENT PASSWORD
                    </AppText>
                </View>
                <View style={styles.card}>
                    <PasswordField
                        label="Current Password"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        show={showCurrent}
                        onToggle={() => setShowCurrent(v => !v)}
                        placeholder="Enter current password"
                    />
                </View>

                {/* New password */}
                <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionTick} />
                    <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                        🔒  NEW PASSWORD
                    </AppText>
                </View>
                <View style={styles.card}>
                    <PasswordField
                        label="New Password"
                        value={newPassword}
                        onChange={setNewPassword}
                        show={showNew}
                        onToggle={() => setShowNew(v => !v)}
                        placeholder="Enter new password"
                    />

                    {/* Strength bar */}
                    {newPassword.length > 0 && (
                        <View style={styles.strengthSection}>
                            <View style={styles.strengthBarBg}>
                                <View style={[
                                    styles.strengthBarFill,
                                    {
                                        width: passwordStrength ? strengthWidth(passwordStrength.strength) : '0%',
                                        backgroundColor: passwordStrength ? strengthColor(passwordStrength.strength) : Colors.cardBorder,
                                    },
                                ]} />
                            </View>
                            {checkingStrength ? (
                                <ActivityIndicator size="small" color={NAVY} />
                            ) : passwordStrength ? (
                                <AppText variant="captionMedium" color={strengthColor(passwordStrength.strength)}>
                                    {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                                </AppText>
                            ) : null}
                        </View>
                    )}

                    {/* Violations */}
                    {passwordStrength && passwordStrength.violations.length > 0 && (
                        <View style={styles.violationsBox}>
                            <AppText variant="captionMedium" color={Colors.error} style={{ marginBottom: 6 }}>
                                Password must contain:
                            </AppText>
                            {passwordStrength.violations.map((v, i) => (
                                <View key={i} style={styles.checkRow}>
                                    <Ionicons name="close-circle" size={14} color={Colors.error} />
                                    <AppText variant="caption" color={Colors.error}>{v}</AppText>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Suggestions */}
                    {passwordStrength && passwordStrength.suggestions.length > 0 && (
                        <View style={{ gap: 6, marginTop: Spacing['2'] }}>
                            {passwordStrength.suggestions.map((s, i) => (
                                <View key={i} style={styles.checkRow}>
                                    <Ionicons name="information-circle-outline" size={14} color={NAVY} />
                                    <AppText variant="caption" color={Colors.textOnLightSecondary}>{s}</AppText>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.divider} />

                    <PasswordField
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        show={showConfirm}
                        onToggle={() => setShowConfirm(v => !v)}
                        placeholder="Re-enter new password"
                    />
                    {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                        <AppText variant="caption" color={Colors.error} style={{ marginBottom: Spacing['2'] }}>
                            Passwords do not match
                        </AppText>
                    )}
                </View>

                {/* Info tile */}
                <View style={styles.infoBanner}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={NAVY} />
                    <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ flex: 1 }}>
                        For security, you may be logged out from all devices after changing your password.
                    </AppText>
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                    onPress={handleChangePassword}
                    disabled={!canSubmit}
                    activeOpacity={0.85}
                >
                    {isLoading
                        ? <ActivityIndicator color={Colors.white} />
                        : <AppText variant="button" color={Colors.white}>Change Password</AppText>
                    }
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

    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['2'],
        marginTop: Spacing['1'],
    },
    sectionTick: { width: 3, height: 14, backgroundColor: NAVY, borderRadius: 2 },
    sectionLabel: { letterSpacing: 0.8 },

    card: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        paddingHorizontal: Spacing['4'],
        paddingBottom: Spacing['2'],
        marginBottom: Spacing['4'],
        shadowColor: '#1a2e3b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    divider: { height: 1, backgroundColor: Colors.cardBorder, marginVertical: Spacing['2'] },

    fieldGroup: { paddingTop: Spacing['3'] },
    fieldLabel: {
        letterSpacing: 0.8,
        marginBottom: 6,
        textTransform: 'uppercase',
        fontSize: 11,
    },
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
    eyeBtn: {
        position: 'absolute',
        right: 12,
        top: 11,
        padding: 2,
    },

    strengthSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['3'],
        marginTop: Spacing['2'],
    },
    strengthBarBg: {
        flex: 1,
        height: 4,
        backgroundColor: Colors.cardBorder,
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthBarFill: { height: '100%', borderRadius: 2 },

    violationsBox: {
        marginTop: Spacing['2'],
        backgroundColor: Colors.errorFaded,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.error,
        padding: Spacing['3'],
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing['1'] + 2,
        marginBottom: 3,
    },

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

    submitBtn: {
        backgroundColor: Colors.accent,
        paddingVertical: Spacing['3'] + 2,
        borderRadius: Radius.lg,
        alignItems: 'center',
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    submitBtnDisabled: {
        backgroundColor: Colors.textOnLightTertiary,
        shadowOpacity: 0,
        elevation: 0,
    },
});

export default ChangePasswordScreen;
