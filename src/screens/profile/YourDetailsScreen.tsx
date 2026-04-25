// src/screens/profile/YourDetailsScreen.tsx
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
// @ts-ignore — google-libphonenumber ships no types
import { PhoneNumberUtil } from 'google-libphonenumber';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/api';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';

const NAVY = Colors.primary;

const getFlagEmoji = (isoCode: string) =>
  isoCode.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  );

const phoneUtil = PhoneNumberUtil.getInstance();
const DEFAULT_ISO = 'CY';

const dialCodeToIso = (dialCode?: string): string => {
  const numeric = parseInt((dialCode || '').replace(/\D/g, ''), 10);
  if (!numeric) return DEFAULT_ISO;
  const region = phoneUtil.getRegionCodeForCountryCode(numeric);
  return region && region !== 'ZZ' ? region : DEFAULT_ISO;
};

interface YourDetailsScreenProps {
    navigation: any;
}

const YourDetailsScreen: React.FC<YourDetailsScreenProps> = ({ navigation }) => {
    const { user, refreshUserData } = useAuth();

    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const [selectedIso, setSelectedIso] = useState(dialCodeToIso(user?.phoneCountryCode));
    const phoneInputRef = useRef<PhoneInput>(null);

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

        const callingCode = phoneInputRef.current?.getCallingCode() ?? '357';
        const newPhoneCountryCode = `+${callingCode}`;

        setIsSaving(true);
        try {
            const updateData: any = { };
            if (firstName !== user?.firstName) updateData.firstName = firstName;
            if (lastName !== user?.lastName) updateData.lastName = lastName;
            if (phone !== user?.phone) updateData.phone = phone;
            if (newPhoneCountryCode !== user?.phoneCountryCode) updateData.phoneCountryCode = newPhoneCountryCode;

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
        setPhone(user?.phone || '');
        setSelectedIso(dialCodeToIso(user?.phoneCountryCode));
        setResetKey(k => k + 1);
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
                            <Ionicons name="chevron-back" size={rf(20)} color={Colors.white} />
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
                    <AppText variant="caption" color={Colors.textOnLightSecondary} style={{ marginTop: r(2) }}>
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
                                        <Ionicons name="checkmark-circle" size={rf(13)} color={Colors.success} />
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
                            <PhoneInput
                                key={resetKey}
                                ref={phoneInputRef}
                                defaultCode={dialCodeToIso(user?.phoneCountryCode) as any}
                                defaultValue={phone}
                                layout="first"
                                onChangeText={setPhone}
                                onChangeCountry={(country) => setSelectedIso(country.cca2 as string)}
                                disabled={!isEditing}
                                withFlag={false}
                                countryPickerProps={{ disableNativeModal: false }}
                                renderDropdownImage={
                                  isEditing ? (
                                    <View style={styles.phoneFlagContent}>
                                      <Text style={styles.phoneFlagEmoji}>{getFlagEmoji(selectedIso)}</Text>
                                      <Ionicons name="chevron-down" size={13} color={Colors.textOnLightTertiary} />
                                    </View>
                                  ) : (
                                    <Text style={styles.phoneFlagEmoji}>{getFlagEmoji(selectedIso)}</Text>
                                  )
                                }
                                containerStyle={[styles.phonePickerContainer, !isEditing && styles.phonePickerReadOnly]}
                                textContainerStyle={styles.phonePickerTextContainer}
                                textInputStyle={[styles.phonePickerInput, !isEditing && styles.fieldInputReadOnly]}
                                codeTextStyle={[styles.phonePickerCode, !isEditing && styles.fieldInputReadOnly]}
                                flagButtonStyle={styles.phonePickerFlagBtn}
                            />
                            <View style={styles.phoneVerifyOverlay}>
                                {user?.phoneVerified ? (
                                    <View style={styles.phoneVerifiedPill}>
                                        <Ionicons name="checkmark-circle" size={rf(13)} color={Colors.success} />
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
                            <Ionicons name="lock-closed-outline" size={rf(18)} color={NAVY} />
                        </View>
                        <AppText variant="bodyMedium" color={Colors.textOnLight} style={{ flex: 1 }}>Change Password</AppText>
                        <Ionicons name="chevron-forward" size={rf(17)} color={Colors.textOnLightTertiary} />
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
                            <Ionicons name="trash-outline" size={rf(18)} color={Colors.error} />
                        </View>
                        <AppText variant="bodyMedium" color={Colors.error} style={{ flex: 1 }}>Delete Account</AppText>
                        <Ionicons name="chevron-forward" size={rf(17)} color={Colors.error} />
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
        paddingVertical: Spacing['3'] },
    backBtn: {
        width: r(36), height: r(36),
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center' },
    headerTitle: { fontSize: FontSize.lg },
    headerSideBtn: { minWidth: r(52), alignItems: 'flex-end' },

    // ── Scroll ────────────────────────────────────────────────────────────────
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing['4'] },

    // ── Avatar block ──────────────────────────────────────────────────────────
    avatarBlock: {
        alignItems: 'center',
        paddingVertical: Spacing['5'],
        marginBottom: Spacing['2'] },
    avatarRing: {
        width: r(80), height: r(80),
        borderRadius: Radius.full,
        borderWidth: 2,
        borderColor: Colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['3'],
        backgroundColor: Colors.cardBackground },
    avatar: {
        width: r(68), height: r(68),
        borderRadius: Radius.full,
        backgroundColor: NAVY,
        justifyContent: 'center',
        alignItems: 'center' },
    initials: {
        fontSize: rf(24),
        fontFamily: 'Inter_700Bold',
        color: Colors.white },

    // ── Section labels ────────────────────────────────────────────────────────
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['2'],
        marginTop: Spacing['1'] },
    sectionTick: { width: r(3), height: r(14), backgroundColor: NAVY, borderRadius: r(2) },
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
        shadowOffset: { width: r(0), height: r(2) },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2 },
    divider: { height: r(1), backgroundColor: Colors.cardBorder },

    // ── Field rows ────────────────────────────────────────────────────────────
    fieldRow: { paddingVertical: Spacing['3'] },
    fieldLabel: {
        letterSpacing: 0.8,
        fontSize: rf(10),
        marginBottom: r(5) },
    fieldValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'] },
    fieldInput: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight,
        paddingVertical: r(4) },
    fieldInputReadOnly: {
        color: Colors.textOnLightSecondary },
    helperText: { marginTop: r(4) },

    // Verified / verify pills
    verifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['1'],
        backgroundColor: Colors.successFaded,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing['2'],
        paddingVertical: r(4) },
    verifyBtn: {
        backgroundColor: Colors.accent,
        paddingHorizontal: Spacing['3'],
        paddingVertical: r(4),
        borderRadius: Radius.full },

    // Phone row
    phoneRow: { position: 'relative' },
    phonePickerContainer: {
        width: '100%',
        height: r(40),
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderColor: Colors.cardBorder },
    phonePickerReadOnly: {
        borderBottomWidth: 0 },
    phonePickerTextContainer: {
        backgroundColor: 'transparent',
        paddingVertical: 0 },
    phonePickerInput: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight,
        height: r(38),
        paddingVertical: 0,
        paddingRight: r(80) },
    phonePickerCode: {
        fontSize: FontSize.sm,
        fontFamily: FontFamily.regular,
        color: Colors.textOnLight },
    phonePickerFlagBtn: {
        width: 72,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center' },
    phoneFlagContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4 },
    phoneFlagEmoji: {
        fontSize: 20,
        lineHeight: 26 },
    phoneVerifyOverlay: {
        position: 'absolute',
        right: 0,
        top: r(8) },
    phoneVerifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['1'],
        backgroundColor: Colors.successFaded,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing['2'],
        paddingVertical: r(4) },
    phoneVerifyBtn: {
        backgroundColor: Colors.accent,
        paddingHorizontal: Spacing['3'],
        paddingVertical: r(4),
        borderRadius: Radius.full },

    // Menu rows (Security / Danger Zone)
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['3'],
        paddingVertical: Spacing['3'] },
    menuIconWrap: {
        width: r(34), height: r(34),
        borderRadius: Radius.sm,
        backgroundColor: 'rgba(15,51,70,0.07)',
        justifyContent: 'center',
        alignItems: 'center' } });

export default YourDetailsScreen;
