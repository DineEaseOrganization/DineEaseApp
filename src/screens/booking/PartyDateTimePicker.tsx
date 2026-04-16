// src/components/booking/PartyDateTimePicker.tsx
import React, { useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
    Dimensions,
    Keyboard,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { currentTimeRounded, formatDateWeekdayShortDayMonthYear } from '../../utils/Datetimeutils';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import { r } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';

interface PartyDateTimePickerProps {
    visible: boolean;
    onClose: () => void;
    partySize: number;
    selectedDate: Date;
    selectedTime: string;
    onPartySizeChange: (_size: number) => void;
    onDateChange: (_date: Date) => void;
    onTimeChange: (_time: string) => void;
}

function parseTime(time: string): { hour: string; minute: string } {
    if (!time || time === 'ASAP') {
        const rounded = currentTimeRounded();
        const [h, m] = rounded.split(':');
        return { hour: h, minute: m };
    }
    const [h, m] = time.split(':');
    return { hour: h ?? '', minute: m ?? '' };
}

const SLIDE_DURATION = 300;

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
    const [mounted, setMounted] = useState(visible);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const minuteRef = useRef<TextInput>(null);
    const hourRef = useRef<TextInput>(null);
    const isEditingTime = useRef(false);
    const hourFreshFocus = useRef(false);
    const minuteFreshFocus = useRef(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const slideAnim = useRef(new Animated.Value(600)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const keyboardOffset = useRef(new Animated.Value(0)).current;

    const { hour: initHour, minute: initMinute } = parseTime(selectedTime);
    const [hourInput, setHourInput] = useState(initHour);
    const [minuteInput, setMinuteInput] = useState(initMinute);

    // If selectedTime is still ASAP when the picker opens, immediately emit a real time
    React.useEffect(() => {
        if (visible && (selectedTime === 'ASAP' || !selectedTime)) {
            const rounded = currentTimeRounded();
            const { hour, minute } = parseTime(rounded);
            setHourInput(hour);
            setMinuteInput(minute);
            onTimeChange(rounded);
        }
    }, [visible]);

    // Sync local input state when selectedTime changes externally.
    // Skip while the user is actively editing to prevent the commitTime →
    // onTimeChange → effect loop from overwriting their in-progress input.
    React.useEffect(() => {
        if (isEditingTime.current) return;
        const { hour, minute } = parseTime(selectedTime);
        setHourInput(hour);
        setMinuteInput(minute);
    }, [selectedTime]);

    // Animate in/out — replaces Modal so the sheet renders in the main Activity
    // window, which is required for the Android soft keyboard to appear.
    React.useEffect(() => {
        if (visible) {
            // Dismiss any stale keyboard state from a previous session before
            // the new TextInputs mount — prevents Android IME from auto-refocusing.
            Keyboard.dismiss();
            slideAnim.setValue(600);
            setMounted(true);
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: SLIDE_DURATION, useNativeDriver: true }),
                Animated.timing(backdropAnim, { toValue: 1, duration: SLIDE_DURATION, useNativeDriver: true }),
            ]).start();
        } else {
            Keyboard.dismiss();
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 1000, duration: 250, useNativeDriver: true }),
                Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
                Animated.timing(keyboardOffset, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start(() => setMounted(false));
        }
    }, [visible]);

    // Lift the sheet above the keyboard when it appears, lower it when it hides.
    // adjustResize does not propagate into absolute overlays inside the nav hierarchy,
    // so we handle the offset manually here.
    React.useEffect(() => {
        if (!mounted) return;
        const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardVisible(true);
            const windowHeight = Dimensions.get('window').height;
            // Don't push the sheet higher than 10% from the top of the screen
            const maxLift = windowHeight * 0.9;
            const lift = Math.min(e.endCoordinates.height, maxLift);
            Animated.timing(keyboardOffset, {
                toValue: -lift,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            });
        });
        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
            Animated.timing(keyboardOffset, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
        return () => { showSub.remove(); hideSub.remove(); };
    }, [mounted]);

    // Handle Android hardware back button
    React.useEffect(() => {
        if (!mounted) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (visible) { onClose(); return true; }
            return false;
        });
        return () => sub.remove();
    }, [mounted, visible, onClose]);

    const commitTime = (h: string, m: string) => {
        const hNum = parseInt(h);
        const mNum = parseInt(m);
        if (!isNaN(hNum) && !isNaN(mNum) && hNum >= 0 && hNum <= 23 && mNum >= 0 && mNum <= 59) {
            onTimeChange(`${h.padStart(2, '0')}:${m.padStart(2, '0')}`);
        }
    };

    const handleHourChange = (text: string) => {
        const allDigits = text.replace(/\D/g, '');
        let clean: string;
        if (hourFreshFocus.current) {
            // First keystroke after focus: take only the newly typed digit(s),
            // not the old value that Android appended onto.
            hourFreshFocus.current = false;
            const prevLen = hourInput.replace(/\D/g, '').length;
            const newChars = allDigits.slice(prevLen);
            clean = (newChars || allDigits).slice(0, 2);
        } else {
            clean = allDigits.slice(0, 2);
        }
        setHourInput(clean);
        if (clean.length === 2 || parseInt(clean) > 2) {
            minuteRef.current?.focus();
        }
        commitTime(clean, minuteInput);
    };

    const handleMinuteChange = (text: string) => {
        const allDigits = text.replace(/\D/g, '');
        let clean: string;
        if (minuteFreshFocus.current) {
            minuteFreshFocus.current = false;
            const prevLen = minuteInput.replace(/\D/g, '').length;
            const newChars = allDigits.slice(prevLen);
            clean = (newChars || allDigits).slice(0, 2);
        } else {
            clean = allDigits.slice(0, 2);
        }
        setMinuteInput(clean);
        commitTime(hourInput, clean);
    };

    const handleHourFocus = () => {
        isEditingTime.current = true;
        hourFreshFocus.current = true;
    };
    const handleMinuteFocus = () => {
        isEditingTime.current = true;
        minuteFreshFocus.current = true;
    };

    const handleHourBlur = () => {
        isEditingTime.current = false;
        const hNum = parseInt(hourInput);
        const clamped = isNaN(hNum) ? 0 : Math.min(23, Math.max(0, hNum));
        const padded = clamped.toString().padStart(2, '0');
        setHourInput(padded);
        commitTime(padded, minuteInput);
    };

    const handleMinuteBlur = () => {
        isEditingTime.current = false;
        const mNum = parseInt(minuteInput);
        const clamped = isNaN(mNum) ? 0 : Math.min(59, Math.max(0, mNum));
        const padded = clamped.toString().padStart(2, '0');
        setMinuteInput(padded);
        commitTime(hourInput, padded);
    };

    const formatDate = (d: Date) => formatDateWeekdayShortDayMonthYear(d);

    const handleDone = () => {
        setShowDatePicker(false);
        onClose();
    };

    if (!mounted) return null;

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            {/* Dimmed backdrop — tap to dismiss */}
            <Pressable
                style={StyleSheet.absoluteFillObject}
                onPress={() => {
                    if (keyboardVisible) {
                        Keyboard.dismiss();
                    } else {
                        onClose();
                    }
                }}
            >
                <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropAnim }]} />
            </Pressable>

            {/* Sheet slides up from the bottom, lifts further when keyboard appears */}
            <Animated.View style={[styles.sheet, { transform: [{ translateY: Animated.add(slideAnim, keyboardOffset) }] }]}>
                {/* Absorb touches so they don't fall through to the backdrop */}
                <View onStartShouldSetResponder={() => true}>

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
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="always"
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

                            <View style={styles.timeInputRow}>
                                {/* Hour */}
                                <View style={styles.timeInputWrap}>
                                    <AppText variant="label" color={Colors.textOnLightTertiary} style={styles.timeInputLabel}>
                                        HH
                                    </AppText>
                                    <TextInput
                                        ref={hourRef}
                                        style={styles.timeInput}
                                        value={hourInput}
                                        onChangeText={handleHourChange}
                                        onFocus={handleHourFocus}
                                        onBlur={handleHourBlur}
                                        keyboardType="number-pad"
                                        placeholder="00"
                                        placeholderTextColor={Colors.textOnLightTertiary}
                                        returnKeyType="next"
                                        onSubmitEditing={() => minuteRef.current?.focus()}
                                        showSoftInputOnFocus={true}
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
                                        onFocus={handleMinuteFocus}
                                        onBlur={handleMinuteBlur}
                                        keyboardType="number-pad"
                                        placeholder="00"
                                        placeholderTextColor={Colors.textOnLightTertiary}
                                        returnKeyType="done"
                                        onSubmitEditing={handleDone}
                                        showSoftInputOnFocus={true}
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Done */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
                            <AppText variant="button" color={Colors.white}>
                                {`Confirm  —  ${selectedTime}  ·  ${partySize} guest${partySize > 1 ? 's' : ''}`}
                            </AppText>
                        </TouchableOpacity>
                    </View>

                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'rgba(9,31,43,0.55)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.appBackground,
        borderTopLeftRadius: Radius['2xl'],
        borderTopRightRadius: Radius['2xl'],
        paddingBottom: r(34),
        maxHeight: '90%',
    },
    handle: {
        width: r(40),
        height: r(4),
        borderRadius: r(2),
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
        width: r(32),
        height: r(32),
        borderRadius: Radius.full,
        backgroundColor: Colors.cardBackground,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        fontSize: FontSize.sm,
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
        width: r(3),
        height: r(14),
        backgroundColor: Colors.primary,
        borderRadius: r(2),
    },
    sectionLabel: { letterSpacing: 1 },

    // ── Party size ─────────────────────────────────────────────────────────────
    partySizeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing['2'],
    },
    sizeBtn: {
        width: r(56),
        height: r(48),
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

    // ── Row card (date) ────────────────────────────────────────────────────────
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
    rowIcon: { fontSize: FontSize.lg },

    // ── Time inputs ────────────────────────────────────────────────────────────
    timeInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: Spacing['2'],
    },
    timeInputWrap: {
        alignItems: 'center',
        gap: Spacing['1'],
    },
    timeInputLabel: {
        letterSpacing: 1,
    },
    timeInput: {
        width: r(88),
        height: r(72),
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
        paddingVertical: r(14),
        borderRadius: Radius.lg,
        alignItems: 'center',
        shadowColor: Colors.accent,
        shadowOffset: { width: r(0), height: r(3) },
        shadowOpacity: 0.25,
        shadowRadius: r(6),
        elevation: r(4),
    },
});

export default PartyDateTimePicker;
