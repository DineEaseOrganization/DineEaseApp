// src/components/booking/PartyDateTimePicker.tsx
import React, { useRef, useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import AppText from '../../components/ui/AppText';

interface PartyDateTimePickerProps {
    visible: boolean;
    onClose: () => void;
    partySize: number;
    selectedDate: Date;
    selectedTime: string;
    onPartySizeChange: (size: number) => void;
    onDateChange: (date: Date) => void;
    onTimeChange: (time: string) => void;
}

function parseTime(time: string): { hour: string; minute: string } {
    if (time === 'ASAP') return { hour: '', minute: '' };
    const [h, m] = time.split(':');
    return { hour: h, minute: m };
}

const PartyDateTimePicker: React.FC<PartyDateTimePickerProps> = ({
    visible,
    onClose,
    partySize,
    selectedDate,
    selectedTime,
    onPartySizeChange,
    onDateChange,
    onTimeChange,
}) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const minuteRef = useRef<TextInput>(null);

    const isAsap = selectedTime === 'ASAP';
    const { hour: initHour, minute: initMinute } = parseTime(selectedTime);
    const [hourInput, setHourInput] = useState(initHour);
    const [minuteInput, setMinuteInput] = useState(initMinute);

    // Sync local input state when selectedTime changes externally
    React.useEffect(() => {
        const { hour, minute } = parseTime(selectedTime);
        setHourInput(hour);
        setMinuteInput(minute);
    }, [selectedTime]);

    const commitTime = (h: string, m: string) => {
        const hNum = parseInt(h);
        const mNum = parseInt(m);
        if (!isNaN(hNum) && !isNaN(mNum) && hNum >= 0 && hNum <= 23 && mNum >= 0 && mNum <= 59) {
            onTimeChange(`${h.padStart(2, '0')}:${m.padStart(2, '0')}`);
        }
    };

    const handleHourChange = (text: string) => {
        const clean = text.replace(/\D/g, '').slice(0, 2);
        setHourInput(clean);
        // Auto-jump to minutes when 2 digits entered or value > 2
        if (clean.length === 2 || parseInt(clean) > 2) {
            minuteRef.current?.focus();
        }
        commitTime(clean, minuteInput);
    };

    const handleMinuteChange = (text: string) => {
        const clean = text.replace(/\D/g, '').slice(0, 2);
        setMinuteInput(clean);
        commitTime(hourInput, clean);
    };

    const handleHourBlur = () => {
        const hNum = parseInt(hourInput);
        if (!isNaN(hNum)) {
            const clamped = Math.min(23, Math.max(0, hNum)).toString().padStart(2, '0');
            setHourInput(clamped);
            commitTime(clamped, minuteInput);
        }
    };

    const handleMinuteBlur = () => {
        const mNum = parseInt(minuteInput);
        if (!isNaN(mNum)) {
            const clamped = Math.min(59, Math.max(0, mNum)).toString().padStart(2, '0');
            setMinuteInput(clamped);
            commitTime(hourInput, clamped);
        }
    };

    const handleAsapToggle = () => {
        if (isAsap) {
            const now = new Date();
            const h = now.getHours().toString().padStart(2, '0');
            const m = (now.getMinutes() < 30 ? 30 : 0).toString().padStart(2, '0');
            const nextH = now.getMinutes() < 30 ? h : (now.getHours() + 1).toString().padStart(2, '0');
            setHourInput(nextH);
            setMinuteInput(m);
            onTimeChange(`${nextH}:${m}`);
        } else {
            setHourInput('');
            setMinuteInput('');
            onTimeChange('ASAP');
        }
    };

    const formatDate = (d: Date) =>
        d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const handleDone = () => {
        setShowDatePicker(false);
        onClose();
    };

    const summaryTime = isAsap ? 'ASAP' : selectedTime;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>

                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <AppText variant="sectionTitle" color={Colors.primary} style={styles.title}>
                            Reservation Options
                        </AppText>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <AppText style={styles.closeIcon}>✕</AppText>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* ── Party Size ── */}
                        <View style={styles.section}>
                            <View style={styles.sectionLabelRow}>
                                <View style={styles.sectionTick} />
                                <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                                    PARTY SIZE
                                </AppText>
                            </View>
                            <View style={styles.partySizeRow}>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => {
                                    const active = partySize === size;
                                    return (
                                        <TouchableOpacity
                                            key={size}
                                            style={[styles.sizeBtn, active && styles.sizeBtnActive]}
                                            onPress={() => onPartySizeChange(size)}
                                            activeOpacity={0.75}
                                        >
                                            <AppText
                                                variant="bodySemiBold"
                                                color={active ? Colors.white : Colors.textOnLightSecondary}
                                                style={styles.sizeBtnText}
                                            >
                                                {size}{size === 8 ? '+' : ''}
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
                                <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                                    DATE
                                </AppText>
                            </View>
                            <TouchableOpacity
                                style={styles.rowCard}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.8}
                            >
                                <AppText style={styles.rowIcon}>📅</AppText>
                                <AppText variant="bodyMedium" color={Colors.textOnLight} style={{ flex: 1 }}>
                                    {formatDate(selectedDate)}
                                </AppText>
                                <AppText variant="captionMedium" color={Colors.accent}>Change</AppText>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    minimumDate={new Date()}
                                    onChange={(event, date) => {
                                        setShowDatePicker(Platform.OS === 'ios');
                                        if (date) onDateChange(date);
                                    }}
                                />
                            )}
                        </View>

                        {/* ── Time ── */}
                        <View style={styles.section}>
                            <View style={styles.sectionLabelRow}>
                                <View style={styles.sectionTick} />
                                <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
                                    TIME
                                </AppText>
                            </View>

                            {/* ASAP toggle */}
                            <TouchableOpacity
                                style={[styles.rowCard, isAsap && styles.rowCardActive]}
                                onPress={handleAsapToggle}
                                activeOpacity={0.8}
                            >
                                <AppText style={styles.rowIcon}>⚡</AppText>
                                <AppText variant="bodyMedium" color={isAsap ? Colors.white : Colors.textOnLightSecondary}>
                                    As soon as possible
                                </AppText>
                                <View style={[styles.checkCircle, isAsap && styles.checkCircleActive]}>
                                    {isAsap && <AppText style={styles.checkMark}>✓</AppText>}
                                </View>
                            </TouchableOpacity>

                            {/* Time input — shown when not ASAP */}
                            {!isAsap && (
                                <View style={styles.timeInputRow}>
                                    {/* Hour */}
                                    <View style={styles.timeInputWrap}>
                                        <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.timeInputLabel}>
                                            HH
                                        </AppText>
                                        <TextInput
                                            style={styles.timeInput}
                                            value={hourInput}
                                            onChangeText={handleHourChange}
                                            onBlur={handleHourBlur}
                                            keyboardType="number-pad"
                                            maxLength={2}
                                            placeholder="00"
                                            placeholderTextColor={Colors.textOnLightTertiary}
                                            returnKeyType="next"
                                            onSubmitEditing={() => minuteRef.current?.focus()}
                                            selectTextOnFocus
                                        />
                                    </View>

                                    <AppText style={styles.timeSeparator}>:</AppText>

                                    {/* Minute */}
                                    <View style={styles.timeInputWrap}>
                                        <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.timeInputLabel}>
                                            MM
                                        </AppText>
                                        <TextInput
                                            ref={minuteRef}
                                            style={styles.timeInput}
                                            value={minuteInput}
                                            onChangeText={handleMinuteChange}
                                            onBlur={handleMinuteBlur}
                                            keyboardType="number-pad"
                                            maxLength={2}
                                            placeholder="00"
                                            placeholderTextColor={Colors.textOnLightTertiary}
                                            returnKeyType="done"
                                            onSubmitEditing={handleDone}
                                            selectTextOnFocus
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Done */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
                            <AppText variant="button" color={Colors.white}>
                                {`Confirm  —  ${summaryTime}  ·  ${partySize} guest${partySize > 1 ? 's' : ''}`}
                            </AppText>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(9,31,43,0.55)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.appBackground,
        borderTopLeftRadius: Radius['2xl'],
        borderTopRightRadius: Radius['2xl'],
        paddingBottom: 34,
        maxHeight: '90%',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.cardBorder,
        alignSelf: 'center',
        marginTop: Spacing['3'],
        marginBottom: Spacing['2'],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['5'],
        paddingVertical: Spacing['3'],
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
    },
    title: { fontSize: FontSize.lg },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: Radius.full,
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        fontSize: 12,
        color: Colors.textOnLightSecondary,
        fontFamily: FontFamily.semiBold,
    },
    scrollContent: { paddingBottom: Spacing['4'] },

    // ── Section ────────────────────────────────────────────────────────────────
    section: {
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['4'],
        paddingBottom: Spacing['4'],
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

    // ── Party size ─────────────────────────────────────────────────────────────
    partySizeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing['2'],
    },
    sizeBtn: {
        width: 56,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    sizeBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    sizeBtnText: { fontSize: FontSize.lg },

    // ── Row card (date / asap) ──────────────────────────────────────────────────
    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing['3'],
        backgroundColor: Colors.cardBackground,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        paddingVertical: Spacing['3'],
        paddingHorizontal: Spacing['4'],
    },
    rowCardActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    rowIcon: { fontSize: 16 },

    // ── ASAP check ─────────────────────────────────────────────────────────────
    checkCircle: {
        marginLeft: 'auto',
        width: 22,
        height: 22,
        borderRadius: Radius.full,
        borderWidth: 1.5,
        borderColor: Colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircleActive: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    checkMark: {
        fontSize: 11,
        color: Colors.white,
        fontFamily: FontFamily.bold,
    },

    // ── Time inputs ────────────────────────────────────────────────────────────
    timeInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: Spacing['2'],
        marginTop: Spacing['3'],
    },
    timeInputWrap: {
        alignItems: 'center',
        gap: Spacing['1'],
    },
    timeInputLabel: {
        letterSpacing: 1,
    },
    timeInput: {
        width: 88,
        height: 72,
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.cardBackground,
        textAlign: 'center',
        fontSize: FontSize['4xl'],
        fontFamily: FontFamily.bold,
        color: Colors.primary,
    },
    timeSeparator: {
        fontSize: FontSize['4xl'],
        fontFamily: FontFamily.bold,
        color: Colors.primary,
        paddingBottom: Spacing['2'],
    },

    // ── Footer ─────────────────────────────────────────────────────────────────
    footer: {
        paddingHorizontal: Spacing['5'],
        paddingTop: Spacing['3'],
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
    },
    doneBtn: {
        backgroundColor: Colors.accent,
        paddingVertical: Spacing['3'] + 2,
        borderRadius: Radius.lg,
        alignItems: 'center',
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
});

export default PartyDateTimePicker;
