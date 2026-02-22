// src/screens/profile/YourDetailsScreen.tsx
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
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/api';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

interface YourDetailsScreenProps {
    navigation: any;
}

const YourDetailsScreen: React.FC<YourDetailsScreenProps> = ({ navigation }) => {
    const { user, refreshUserData } = useAuth();

    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [phoneCountryCode, setPhoneCountryCode] = useState(user?.phoneCountryCode || '+357');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!firstName || !lastName || !phone) {
            Alert.alert('Missing Information', 'Please fill in all required fields.'); return;
        }
        if (firstName.length > 120 || lastName.length > 120) {
            Alert.alert('Invalid Input', 'Name must not exceed 120 characters.'); return;
        }
        if (phone.length > 32) {
            Alert.alert('Invalid Input', 'Phone number must not exceed 32 characters.'); return;
        }
        if (!/^\+?[0-9]{1,4}$/.test(phoneCountryCode)) {
            Alert.alert('Invalid Input', 'Invalid phone country code format.'); return;
        }

        setIsSaving(true);
        try {
            const updateData: any = {};
            if (firstName !== user?.firstName) updateData.firstName = firstName;
            if (lastName !== user?.lastName) updateData.lastName = lastName;
            if (phone !== user?.phone) updateData.phone = phone;
            if (phoneCountryCode !== user?.phoneCountryCode) updateData.phoneCountryCode = phoneCountryCode;

            if (Object.keys(updateData).length === 0) { setIsEditing(false); return; }

            const response = await profileService.updateProfile(updateData);
            if (response.success) {
                await refreshUserData();
                Alert.alert('Saved', 'Your details have been updated.', [{ text: 'OK', onPress: () => setIsEditing(false) }]);
            } else {
                Alert.alert('Error', response.message || 'Failed to update profile.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setPhoneCountryCode(user?.phoneCountryCode || '+357');
        setPhone(user?.phone || '');
        setIsEditing(false);
    };

    const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'U';

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Navy header ── */}
            <View style={styles.header}>
                {isEditing ? (
                    <>
                        <TouchableOpacity onPress={handleCancel} disabled={isSaving} style={styles.headerSideBtn}>
                            <AppText variant="captionMedium" color="rgba(255,255,255,0.75)">Cancel</AppText>
                        </TouchableOpacity>
                        <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>Your Details</AppText>
                        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.headerSideBtn}>
                            {isSaving
                                ? <ActivityIndicator size="small" color={Colors.white} />
                                : <AppText variant="bodySemiBold" color={Colors.white}>Save</AppText>
                            }
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                            <Ionicons name="chevron-back" size={20} color={Colors.white} />
                        </TouchableOpacity>
                        <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>Your Details</AppText>
                        <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.headerSideBtn}>
                            <AppText variant="captionMedium" color="rgba(255,255,255,0.85)">Edit</AppText>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Avatar block ── */}
                <View style={styles.avatarBlock}>
                    <View style={styles.avatarRing}>
                        <View style={styles.avatar}>
                            <AppText style={styles.initials}>{initials}</AppText>
                        </View>
                    </View>
                    <AppText variant="cardTitle" color={NAVY}>
                        {user?.firstName} {user?.lastName}
                    </AppText>
                    <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ marginTop: 2 }}>
                        {user?.email}
                    </AppText>
                </View>

                {/* ── Profile Information ── */}
                <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionTick} />
                    <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                        👤  PROFILE INFORMATION
                    </AppText>
                </View>
                <View style={styles.card}>
                    {/* First name */}
                    <View style={styles.fieldRow}>
                        <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.fieldLabel}>FIRST NAME</AppText>
                        <TextInput
                            style={[styles.fieldInput, !isEditing && styles.fieldInputReadOnly]}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="First name"
                            placeholderTextColor={Colors.textOnLightTertiary}
                            editable={isEditing}
                            maxLength={120}
                        />
                    </View>
                    <View style={styles.divider} />
                    {/* Last name */}
                    <View style={styles.fieldRow}>
                        <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.fieldLabel}>LAST NAME</AppText>
                        <TextInput
                            style={[styles.fieldInput, !isEditing && styles.fieldInputReadOnly]}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Last name"
                            placeholderTextColor={Colors.textOnLightTertiary}
                            editable={isEditing}
                            maxLength={120}
                        />
                    </View>
                </View>

                {/* ── Contact Information ── */}
                <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionTick} />
                    <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                        📬  CONTACT INFORMATION
                    </AppText>
                </View>
                <View style={styles.card}>
                    {/* Email */}
                    <View style={styles.fieldRow}>
                        <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.fieldLabel}>EMAIL</AppText>
                        <View style={styles.fieldValueRow}>
                            <AppText variant="body" color={Colors.textOnLightSecondary} style={{ flex: 1 }} numberOfLines={1}>
                                {user?.email}
                            </AppText>
                            {user?.emailVerified ? (
                                <View style={styles.verifiedPill}>
                                    <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                                    <AppText variant="captionMedium" color={Colors.success}>Verified</AppText>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.verifyBtn}
                                    onPress={() => navigation.navigate('EmailVerification', { email: user?.email || '' })}
                                >
                                    <AppText variant="captionMedium" color={Colors.white}>Verify</AppText>
                                </TouchableOpacity>
                            )}
                        </View>
                        <AppText variant="caption" color={Colors.textOnLightTertiary} style={styles.helperText}>
                            Email cannot be changed. Contact support if needed.
                        </AppText>
                    </View>

                    <View style={styles.divider} />

                    {/* Phone */}
                    <View style={styles.fieldRow}>
                        <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.fieldLabel}>PHONE NUMBER</AppText>
                        <View style={styles.phoneRow}>
                            <TextInput
                                style={[styles.countryCodeInput, !isEditing && styles.fieldInputReadOnly]}
                                value={phoneCountryCode}
                                onChangeText={setPhoneCountryCode}
                                placeholder="+357"
                                placeholderTextColor={Colors.textOnLightTertiary}
                                keyboardType="phone-pad"
                                editable={isEditing}
                                maxLength={5}
                            />
                            <View style={{ flex: 1, position: 'relative' }}>
                                <TextInput
                                    style={[styles.phoneInput, !isEditing && styles.fieldInputReadOnly, { paddingRight: 90 }]}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Phone number"
                                    placeholderTextColor={Colors.textOnLightTertiary}
                                    keyboardType="phone-pad"
                                    editable={isEditing}
                                    maxLength={32}
                                />
                                {user?.phoneVerified ? (
                                    <View style={styles.phoneVerifiedPill}>
                                        <Ionicons name="checkmark-circle" size={13} color={Colors.success} />
                                        <AppText variant="captionMedium" color={Colors.success}>Verified</AppText>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.phoneVerifyBtn}
                                        onPress={() => Alert.alert('Verify Phone', 'Phone verification coming soon!')}
                                    >
                                        <AppText variant="captionMedium" color={Colors.white}>Verify</AppText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Security ── */}
                <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionTick} />
                    <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                        🔒  SECURITY
                    </AppText>
                </View>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('ChangePassword')} activeOpacity={0.7}>
                        <View style={styles.menuIconWrap}>
                            <Ionicons name="lock-closed-outline" size={18} color={NAVY} />
                        </View>
                        <AppText variant="bodyMedium" color={Colors.textOnLight} style={{ flex: 1 }}>Change Password</AppText>
                        <Ionicons name="chevron-forward" size={17} color={Colors.textOnLightTertiary} />
                    </TouchableOpacity>
                </View>

                {/* ── Danger Zone ── */}
                <View style={styles.sectionLabelRow}>
                    <View style={[styles.sectionTick, { backgroundColor: Colors.error }]} />
                    <AppText variant="label" color={Colors.error} style={styles.sectionLabel}>
                        ⚠️  DANGER ZONE
                    </AppText>
                </View>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('DeleteAccount')} activeOpacity={0.7}>
                        <View style={[styles.menuIconWrap, { backgroundColor: Colors.errorFaded }]}>
                            <Ionicons name="trash-outline" size={18} color={Colors.error} />
                        </View>
                        <AppText variant="bodyMedium" color={Colors.error} style={{ flex: 1 }}>Delete Account</AppText>
                        <Ionicons name="chevron-forward" size={17} color={Colors.error} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: Spacing['8'] }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.appBackground },

    // ── Header ────────────────────────────────────────────────────────────────
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
    headerSideBtn: { minWidth: 52, alignItems: 'flex-end' },

    // ── Scroll ────────────────────────────────────────────────────────────────
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing['4'] },

    // ── Avatar block ──────────────────────────────────────────────────────────
    avatarBlock: {
        alignItems: 'center',
        paddingVertical: Spacing['5'],
        marginBottom: Spacing['2'],
    },
    avatarRing: {
        width: 80, height: 80,
        borderRadius: Radius.full,
        borderWidth: 2,
        borderColor: Colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['3'],
        backgroundColor: Colors.cardBackground,
    },
    avatar: {
        width: 68, height: 68,
        borderRadius: Radius.full,
        backgroundColor: NAVY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 24,
        fontFamily: 'Inter_700Bold',
        color: Colors.white,
    },

    // ── Section labels ────────────────────────────────────────────────────────
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['2'],
        marginTop: Spacing['1'],
    },
    sectionTick: { width: 3, height: 14, backgroundColor: NAVY, borderRadius: 2 },
    sectionLabel: { letterSpacing: 0.8 },

    // ── Card ──────────────────────────────────────────────────────────────────
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

    // ── Field rows ────────────────────────────────────────────────────────────
    fieldRow: { paddingVertical: Spacing['3'] },
    fieldLabel: {
        letterSpacing: 0.8,
        fontSize: 10,
        marginBottom: 5,
    },
    fieldValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
    },
    fieldInput: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight,
        paddingVertical: 4,
    },
    fieldInputReadOnly: {
        color: Colors.textOnLightSecondary,
    },
    helperText: { marginTop: 4 },

    // Verified / verify pills
    verifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.successFaded,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing['2'],
        paddingVertical: 4,
    },
    verifyBtn: {
        backgroundColor: Colors.accent,
        paddingHorizontal: Spacing['3'],
        paddingVertical: 4,
        borderRadius: Radius.full,
    },

    // Phone row
    phoneRow: { flexDirection: 'row', gap: Spacing['2'] },
    countryCodeInput: {
        width: 64,
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight,
        paddingVertical: 4,
        textAlign: 'center',
    },
    phoneInput: {
        flex: 1,
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight,
        paddingVertical: 4,
    },
    phoneVerifiedPill: {
        position: 'absolute',
        right: 0,
        top: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.successFaded,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing['2'],
        paddingVertical: 4,
    },
    phoneVerifyBtn: {
        position: 'absolute',
        right: 0,
        top: 1,
        backgroundColor: Colors.accent,
        paddingHorizontal: Spacing['3'],
        paddingVertical: 4,
        borderRadius: Radius.full,
    },

    // Menu rows (Security / Danger Zone)
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['3'],
        paddingVertical: Spacing['3'],
    },
    menuIconWrap: {
        width: 34, height: 34,
        borderRadius: Radius.sm,
        backgroundColor: 'rgba(15,51,70,0.07)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default YourDetailsScreen;
