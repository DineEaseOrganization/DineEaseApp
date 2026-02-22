// src/components/booking/BookingCard.tsx
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { processingService } from '../../services/api';
import { AvailableSlot } from '../../types/api.types';
import { parseAvailabilityError, AvailabilityError } from '../../utils/errorHandlers';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

interface BookingCardProps {
    restaurantId: number;
    restaurantName?: string;
    restaurantPhone?: string;
    onTimeSelected?: (date: Date, partySize: number, time: string) => void;
    initialDate?: Date;
    initialPartySize?: number;
}

export const BookingCard: React.FC<BookingCardProps> = ({
    restaurantId,
    restaurantName,
    restaurantPhone,
    onTimeSelected,
    initialDate,
    initialPartySize = 2,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
    const [partySize, setPartySize] = useState<number>(initialPartySize);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AvailabilityError | null>(null);

    useEffect(() => { void loadAvailability(); }, [selectedDate, partySize]);

    const loadAvailability = async () => {
        try {
            setLoading(true);
            setError(null);
            setSelectedTime(null);
            const dateStr = selectedDate.toISOString().split('T')[0];
            const response = await processingService.getAvailableSlots(restaurantId, dateStr, partySize);
            setAvailableSlots(response.slots || []);
            if (!response.slots || response.slots.length === 0) {
                setError({ type: 'no_slots', title: 'No Availability', message: 'No tables available for this date and party size.', showContactInfo: false });
            }
        } catch (err: any) {
            setError(parseAvailabilityError(err));
            setAvailableSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const getNextDays = (count = 7) => {
        return Array.from({ length: count }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d;
        });
    };

    const formatDate = (date: Date): string => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        onTimeSelected?.(selectedDate, partySize, time);
    };

    const groupSlotsByMealPeriod = (slots: AvailableSlot[]) => {
        const groups: Record<string, AvailableSlot[]> = { 'Morning': [], 'Lunch': [], 'Dinner': [], 'Late Night': [] };
        slots.forEach(slot => {
            const h = parseInt(slot.time.split(':')[0]);
            if (h < 11) groups['Morning'].push(slot);
            else if (h < 16) groups['Lunch'].push(slot);
            else if (h < 22) groups['Dinner'].push(slot);
            else groups['Late Night'].push(slot);
        });
        return Object.entries(groups).filter(([, s]) => s.length > 0);
    };

    return (
        <View style={styles.card}>

            {/* ── Party Size ── */}
            <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionTick} />
                    <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>PARTY SIZE</AppText>
                </View>
                <View style={styles.partySizeRow}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => {
                        const active = partySize === size;
                        return (
                            <TouchableOpacity
                                key={size}
                                style={[styles.sizeBtn, active && styles.sizeBtnActive]}
                                onPress={() => setPartySize(size)}
                                activeOpacity={0.75}
                            >
                                <AppText variant="bodySemiBold" color={active ? Colors.white : Colors.textOnLightSecondary}>
                                    {size}
                                </AppText>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* ── Date ── */}
            <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionTick} />
                    <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>DATE</AppText>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
                    {getNextDays(14).map((date, i) => {
                        const active = selectedDate.toDateString() === date.toDateString();
                        return (
                            <TouchableOpacity
                                key={i}
                                style={[styles.dateChip, active && styles.dateChipActive]}
                                onPress={() => setSelectedDate(date)}
                                activeOpacity={0.8}
                            >
                                <AppText variant="captionMedium" color={active ? Colors.white : Colors.textOnLightSecondary}>
                                    {formatDate(date)}
                                </AppText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Time Slots ── */}
            <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                    <View style={styles.sectionTick} />
                    <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>AVAILABLE TIMES</AppText>
                </View>

                {loading ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={Colors.accent} />
                        <AppText variant="body" color={Colors.textOnLightSecondary} style={{ marginLeft: Spacing['2'] }}>
                            Checking availability...
                        </AppText>
                    </View>
                ) : error ? (
                    <View style={styles.errorBox}>
                        <AppText variant="bodyMedium" color={Colors.textOnLight} style={{ marginBottom: 4 }}>{error.title}</AppText>
                        <AppText variant="caption" color={Colors.textOnLightSecondary}>{error.message}</AppText>
                        {error.showContactInfo && restaurantPhone && (
                            <TouchableOpacity style={styles.callBtn}>
                                <AppText variant="captionMedium" color={Colors.accent}>📞 {restaurantPhone}</AppText>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    groupSlotsByMealPeriod(availableSlots).map(([period, slots]) => (
                        <View key={period} style={styles.periodGroup}>
                            <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.periodLabel}>{period.toUpperCase()}</AppText>
                            <View style={styles.slotsRow}>
                                {slots.map((slot, i) => {
                                    const active = selectedTime === slot.time;
                                    const limited = slot.availableCapacity !== undefined && slot.availableCapacity < 5;
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={[styles.slotBtn, active && styles.slotBtnActive, limited && !active && styles.slotBtnLimited]}
                                            onPress={() => handleTimeSelect(slot.time)}
                                            activeOpacity={0.8}
                                        >
                                            <AppText variant="buttonSmall" color={active ? Colors.white : Colors.primary}>
                                                {slot.time}
                                            </AppText>
                                            {limited && (
                                                <AppText variant="caption" color={active ? 'rgba(255,255,255,0.75)' : Colors.capacityLow}>
                                                    {slot.availableCapacity} left
                                                </AppText>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    ))
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.appBackground,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        overflow: 'hidden',
    },

    // Section
    section: {
        paddingHorizontal: Spacing['4'],
        paddingTop: Spacing['4'],
        paddingBottom: Spacing['3'],
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['2'],
        marginBottom: Spacing['3'],
    },
    sectionTick: {
        width: 3,
        height: 14,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    sectionLabel: { letterSpacing: 1 },

    // Party size
    partySizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'] },
    sizeBtn: {
        width: 48,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    sizeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

    // Date scroll
    dateScroll: { gap: Spacing['2'], paddingBottom: 2 },
    dateChip: {
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['2'],
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    dateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

    // Loading / error
    loadingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing['3'] },
    errorBox: {
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.lg,
        padding: Spacing['3'],
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    callBtn: { marginTop: Spacing['2'] },

    // Time slots
    periodGroup: { marginBottom: Spacing['3'] },
    periodLabel: { letterSpacing: 1, marginBottom: Spacing['2'] },
    slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'] },
    slotBtn: {
        paddingHorizontal: Spacing['3'],
        paddingVertical: Spacing['2'],
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        minWidth: 72,
        alignItems: 'center',
    },
    slotBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accentDark },
    slotBtnLimited: { borderColor: Colors.capacityLow },
});

export default BookingCard;
