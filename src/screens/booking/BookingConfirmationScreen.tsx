// src/screens/booking/BookingConfirmationScreen.tsx
import React from 'react';
import { formatDateWeekdayLongDayMonthYear } from '../../utils/Datetimeutils';
import { Linking, Alert, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { BookingConfirmationScreenProps } from '../../navigation/AppNavigator';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import { r } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';

const BookingConfirmationScreen: React.FC<BookingConfirmationScreenProps> = ({ route, navigation }) => {
    const { booking } = route.params;

    const formatDate = (date: Date) => formatDateWeekdayLongDayMonthYear(date);

    const handleShare = async () => {
        try {
            await Share.share({
                message:
                    `Reservation Confirmed!\n\n` +
                    `Restaurant: ${booking.restaurant.name}\n` +
                    `Date: ${formatDate(booking.date)}\n` +
                    `Time: ${booking.time}\n` +
                    `Party Size: ${booking.partySize} guests\n` +
                    `Confirmation: ${booking.confirmationCode}`,
                title: 'Restaurant Reservation' });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleCall = () => {
        if (!booking.restaurant.phoneNumber) return;
        const url = `tel:${booking.restaurant.phoneNumber.replace(/\s/g, '')}`;
        Linking.openURL(url).catch(() =>
            Alert.alert('Error', 'Unable to open phone dialer')
        );
    };

    const handleDone = () => {
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'RestaurantList' }] }));
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero header — navy ── */}
                <View style={styles.hero}>
                    {/* Success badge */}
                    <View style={styles.successRing}>
                        <View style={styles.successCircle}>
                            <AppText style={styles.checkmark}>✓</AppText>
                        </View>
                    </View>

                    <AppText variant="h3" color={Colors.white} style={styles.heroTitle}>
                        Reservation Confirmed!
                    </AppText>
                    <AppText variant="body" color="rgba(255,255,255,0.7)" style={styles.heroSub}>
                        We've sent confirmation details to your phone.
                    </AppText>

                    {/* Confirmation code pill */}
                    <View style={styles.codePill}>
                        <AppText variant="label" color="rgba(255,255,255,0.6)" style={styles.codeLabel}>
                            CONFIRMATION CODE
                        </AppText>
                        <AppText variant="sectionTitle" color={Colors.white} style={styles.codeValue}>
                            {booking.confirmationCode}
                        </AppText>
                    </View>
                </View>

                {/* ── Ticket card ── */}
                <View style={styles.ticketCard}>

                    {/* Notch cutouts */}
                    <View style={styles.notchLeft} />
                    <View style={styles.notchRight} />

                    {/* Restaurant name row */}
                    <View style={styles.ticketTop}>
                        <AppText variant="sectionTitle" color={Colors.primary} numberOfLines={2} style={styles.ticketRestaurantName}>
                            {booking.restaurant.name}
                        </AppText>
                        <View style={styles.cuisinePill}>
                            <AppText variant="captionMedium" color={Colors.textOnLightSecondary}>
                                {booking.restaurant.cuisineType || 'Restaurant'}
                            </AppText>
                        </View>
                    </View>

                    {/* Dashed perforation line */}
                    <View style={styles.perforationRow}>
                        {Array.from({ length: 26 }).map((_, i) => (
                            <View key={i} style={styles.dash} />
                        ))}
                    </View>

                    {/* Detail grid */}
                    <View style={styles.detailGrid}>
                        <View style={styles.detailCell}>
                            <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.cellLabel}>DATE</AppText>
                            <AppText variant="bodySemiBold" color={Colors.textOnLight} style={styles.cellValue}>
                                {formatDate(booking.date)}
                            </AppText>
                        </View>
                        <View style={[styles.detailCell, styles.detailCellRight]}>
                            <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.cellLabel}>TIME</AppText>
                            <AppText variant="bodySemiBold" color={Colors.textOnLight} style={styles.cellValue}>
                                {booking.time}
                            </AppText>
                        </View>
                        <View style={styles.detailCell}>
                            <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.cellLabel}>GUESTS</AppText>
                            <AppText variant="bodySemiBold" color={Colors.textOnLight} style={styles.cellValue}>
                                {booking.partySize} {booking.partySize === 1 ? 'guest' : 'guests'}
                            </AppText>
                        </View>
                        <View style={[styles.detailCell, styles.detailCellRight]}>
                            <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.cellLabel}>NAME</AppText>
                            <AppText variant="bodySemiBold" color={Colors.textOnLight} style={styles.cellValue}>
                                {booking.customerName}
                            </AppText>
                        </View>
                    </View>

                    {/* Address row */}
                    <View style={styles.addressRow}>
                        <AppText style={styles.addressPin}>📍</AppText>
                        <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.addressText}>
                            {booking.restaurant.address}
                        </AppText>
                    </View>

                    {/* Special requests */}
                    {booking.specialRequests ? (
                        <View style={styles.requestsRow}>
                            <AppText style={styles.addressPin}>📝</AppText>
                            <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.addressText}>
                                {booking.specialRequests}
                            </AppText>
                        </View>
                    ) : null}
                </View>

                {/* ── Info section ── */}
                <View style={styles.infoSection}>
                    <View style={styles.sectionLabelRow}>
                        <View style={styles.sectionTick} />
                        <AppText variant="sectionTitle" color={Colors.primary}>Good to Know</AppText>
                    </View>

                    {[
                        { icon: '🕒', text: 'Please arrive 10 minutes before your reservation time' },
                        { icon: '📱', text: 'Show this confirmation or quote your code at the door' },
                        { icon: '🚫', text: 'Cancellations must be made at least 2 hours in advance' },
                    ].map(({ icon, text }, i) => (
                        <View key={i} style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <AppText style={styles.infoIcon}>{icon}</AppText>
                            </View>
                            <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.infoText}>
                                {text}
                            </AppText>
                        </View>
                    ))}
                </View>

                {/* ── Call restaurant ── */}
                {booking.restaurant.phoneNumber && (
                    <View style={styles.callSection}>
                        <View style={styles.sectionLabelRow}>
                            <View style={styles.sectionTick} />
                            <AppText variant="sectionTitle" color={Colors.primary}>Need Help?</AppText>
                        </View>
                        <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.85}>
                            <AppText style={styles.callIcon}>📞</AppText>
                            <AppText variant="bodyMedium" color={Colors.primary}>
                                Call {booking.restaurant.name}
                            </AppText>
                            <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.callNumber}>
                                {booking.restaurant.phoneNumber}
                            </AppText>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── Footer action bar ── */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
                    <AppText style={styles.shareBtnIcon}>↗</AppText>
                    <AppText variant="bodySemiBold" color={Colors.textOnLight}>Share</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
                    <AppText variant="button" color={Colors.white}>Done</AppText>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.appBackground },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: Spacing['6'] },

    // ── Hero ───────────────────────────────────────────────────────────────────
    hero: {
        backgroundColor: Colors.primary,
        alignItems: 'center',
        paddingTop: Spacing['8'],
        paddingBottom: Spacing['8'] + Spacing['5'],
        paddingHorizontal: Spacing['5'] },
    successRing: {
        width: r(88),
        height: r(88),
        borderRadius: Radius.full,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['4'] },
    successCircle: {
        width: r(68),
        height: r(68),
        borderRadius: Radius.full,
        backgroundColor: Colors.success,
        justifyContent: 'center',
        alignItems: 'center' },
    checkmark: {
        fontSize: FontSize['5xl'],
        color: Colors.white,
        fontFamily: FontFamily.bold },
    heroTitle: {
        textAlign: 'center',
        marginBottom: Spacing['2'] },
    heroSub: {
        textAlign: 'center',
        lineHeight: r(22),
        marginBottom: Spacing['5'] },
    codePill: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing['5'],
        paddingVertical: Spacing['3'],
        alignItems: 'center' },
    codeLabel: {
        letterSpacing: 1.2,
        marginBottom: r(3) },
    codeValue: {
        fontSize: FontSize.xl,
        letterSpacing: 1 },

    // ── Ticket card ────────────────────────────────────────────────────────────
    ticketCard: {
        backgroundColor: Colors.appBackground,
        marginHorizontal: Spacing['5'],
        marginTop: -Spacing['5'],
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        shadowColor: Colors.primary,
        shadowOffset: { width: r(0), height: r(4) },
        shadowOpacity: 0.1,
        shadowRadius: r(16),
        elevation: r(6),
        overflow: 'visible',
        paddingBottom: Spacing['4'] },
    // Circular notch cutouts on the sides
    notchLeft: {
        position: 'absolute',
        left: r(-14),
        top: '45%',
        width: r(28),
        height: r(28),
        borderRadius: Radius.full,
        backgroundColor: Colors.appBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder },
    notchRight: {
        position: 'absolute',
        right: r(-14),
        top: '45%',
        width: r(28),
        height: r(28),
        borderRadius: Radius.full,
        backgroundColor: Colors.appBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder },
    ticketTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['5'],
        paddingBottom: Spacing['4'],
        gap: Spacing['3'] },
    ticketRestaurantName: {
        flex: 1,
        fontSize: FontSize.lg },
    cuisinePill: {
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderRadius: Radius.full,
        paddingHorizontal: r(10),
        paddingVertical: Spacing['1'],
        flexShrink: 0 },

    // Dashed perforation line
    perforationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['4'],
        gap: Spacing['1'] },
    dash: {
        width: r(6),
        height: r(1.5),
        backgroundColor: Colors.cardBorder,
        borderRadius: r(1) },

    // Detail grid — 2 columns
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing['5'],
        marginBottom: Spacing['4'] },
    detailCell: {
        width: '50%',
        marginBottom: Spacing['4'],
        paddingRight: Spacing['3'] },
    detailCellRight: {
        paddingRight: 0,
        paddingLeft: Spacing['3'],
        borderLeftWidth: 1,
        borderLeftColor: Colors.cardBorder },
    cellLabel: {
        letterSpacing: 0.8,
        marginBottom: Spacing['1'] },
    cellValue: {
        lineHeight: r(20) },

    // Address + requests
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing['5'],
        gap: Spacing['2'],
        marginBottom: Spacing['2'] },
    requestsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing['5'],
        gap: Spacing['2'] },
    addressPin: { fontSize: FontSize.base, marginTop: r(1) },
    addressText: { flex: 1, lineHeight: r(20) },

    // ── Info section ───────────────────────────────────────────────────────────
    infoSection: {
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['6'] },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['4'] },
    sectionTick: {
        width: r(3),
        height: r(18),
        backgroundColor: Colors.primary,
        borderRadius: r(2) },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing['3'],
        gap: Spacing['3'] },
    infoIconWrap: {
        width: r(36),
        height: r(36),
        borderRadius: Radius.md,
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0 },
    infoIcon: { fontSize: FontSize.lg },
    infoText: { flex: 1, lineHeight: r(20), marginTop: Spacing['2'] },

    // ── Call section ───────────────────────────────────────────────────────────
    callSection: {
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['5'] },
    callBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['3'],
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderRadius: Radius.lg,
        paddingVertical: Spacing['3'],
        paddingHorizontal: Spacing['4'] },
    callIcon: { fontSize: FontSize.xl },
    callNumber: { marginLeft: 'auto' },

    // ── Footer ─────────────────────────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.appBackground,
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
        paddingHorizontal: Spacing['5'],
        paddingVertical: Spacing['3'],
        flexDirection: 'row',
        gap: Spacing['3'] },
    shareBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing['2'],
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderRadius: Radius.lg,
        paddingVertical: r(14) },
    shareBtnIcon: {
        fontSize: FontSize.lg,
        color: Colors.textOnLight,
        fontFamily: FontFamily.semiBold },
    doneBtn: {
        flex: 2,
        backgroundColor: Colors.accent,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: r(14),
        shadowColor: Colors.accent,
        shadowOffset: { width: r(0), height: r(3) },
        shadowOpacity: 0.25,
        shadowRadius: r(6),
        elevation: r(4) } });

export default BookingConfirmationScreen;




