// src/components/availability/AllSlotsModal.tsx
import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvailableSlot } from '../../types/api.types';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import { r } from '../../theme/responsive';
import AppText from '../ui/AppText';
import { TimeSlotDisplay } from './TimeSlotDisplay';

export interface AllSlotsModalProps {
  visible: boolean;
  onClose: () => void;
  slots: AvailableSlot[];
  allSlots?: AvailableSlot[];
  selectedTime?: string;
  onTimeSelect: (slot: AvailableSlot) => void;
  onAdvanceNoticeSlotPress?: (slot: AvailableSlot) => void;
  headerTitle?: string;
  headerSubtitle?: string;
}

export const AllSlotsModal: React.FC<AllSlotsModalProps> = ({
  visible,
  onClose,
  slots,
  allSlots,
  selectedTime,
  onTimeSelect,
  onAdvanceNoticeSlotPress,
  headerTitle = 'All Available Times',
  headerSubtitle }) => {
  const groupSlotsByMealPeriod = (slotsToGroup: AvailableSlot[]) => {
    const groups: { [key: string]: AvailableSlot[] } = {
      'Morning': [],
      'Lunch': [],
      'Afternoon': [],
      'Dinner': [],
      'Late Night': [] };

    slotsToGroup.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour < 11) groups['Morning'].push(slot);
      else if (hour < 14) groups['Lunch'].push(slot);
      else if (hour < 17) groups['Afternoon'].push(slot);
      else if (hour < 22) groups['Dinner'].push(slot);
      else groups['Late Night'].push(slot);
    });

    return Object.entries(groups).filter(([__unused, s]) => s.length > 0);
  };

  const slotsToDisplay = allSlots && allSlots.length > 0 ? allSlots : slots;
  const available = slotsToDisplay.filter(s => s.isAvailable);

  // Slots that are unavailable strictly because of advance notice (restaurant is open
  // but the booking window hasn't opened yet for this time).
  const requiresNotice = slotsToDisplay.filter(s => !s.isAvailable && s.requiresAdvanceNotice);

  // Slots that are unavailable because no table can seat this party size at this time.
  // These are distinct from advance-notice slots and need a different message.
  const noTableFit = slotsToDisplay.filter(
    s => !s.isAvailable && !s.requiresAdvanceNotice && (s.availableTableCount ?? s.availableTables?.length ?? 0) === 0
  );

  const groupedAvailable = groupSlotsByMealPeriod(available);

  // True when every slot across the whole day has no fitting table — likely the party
  // is too large for the restaurant's table inventory entirely.
  const allSlotsHaveNoFit =
    available.length === 0 &&
    requiresNotice.length === 0 &&
    noTableFit.length > 0 &&
    noTableFit.length === slotsToDisplay.length;

  const periodEmoji: Record<string, string> = {
    'Morning': '🌅',
    'Lunch': '☀️',
    'Afternoon': '🕑',
    'Dinner': '🌙',
    'Late Night': '🌃' };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <AppText variant="sectionTitle" color={Colors.white} style={styles.title}>
              {headerTitle}
            </AppText>
            {headerSubtitle && (
              <AppText variant="caption" color="rgba(255,255,255,0.65)" style={styles.subtitle}>
                {headerSubtitle}
              </AppText>
            )}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <AppText style={styles.closeIcon}>✕</AppText>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Available slots grouped by meal period ── */}
          {groupedAvailable.map(([period, periodSlots]) => (
            <View key={period} style={styles.section}>
              {/* Section label — left tick + emoji + period name */}
              <View style={styles.sectionLabelRow}>
                <View style={styles.sectionTick} />
                <AppText style={styles.periodEmoji}>{periodEmoji[period] || '🍽️'}</AppText>
                <AppText variant="sectionTitle" color={Colors.primary} style={styles.periodTitle}>
                  {period}
                </AppText>
                <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.slotCount}>
                  {periodSlots.length} {periodSlots.length === 1 ? 'slot' : 'slots'}
                </AppText>
              </View>

              <View style={styles.slotGrid}>
                {periodSlots.map((slot, i) => (
                  <TimeSlotDisplay
                    key={i}
                    slot={slot}
                    onPress={onTimeSelect}
                    variant="modal"
                    isSelected={selectedTime === slot.time}
                  />
                ))}
              </View>
            </View>
          ))}

          {/* ── Requires Advance Notice section ── */}
          {requiresNotice.length > 0 && onAdvanceNoticeSlotPress && (
            <View style={styles.section}>
              {/* Divider pill */}
              <View style={styles.noticeHeader}>
                <View style={styles.noticeDivider} />
                <View style={styles.noticePill}>
                  <AppText variant="captionMedium" color={Colors.textOnLightSecondary} style={styles.noticePillText}>
                    ⏰  Requires Advance Booking
                  </AppText>
                </View>
                <View style={styles.noticeDivider} />
              </View>
              <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.noticeSubtext}>
                These times require at least 2 hours advance notice. Tap a slot for details.
              </AppText>

              <View style={styles.slotGrid}>
                {requiresNotice.map((slot, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.disabledSlot}
                    onPress={() => onAdvanceNoticeSlotPress(slot)}
                  >
                    <AppText variant="buttonSmall" color={Colors.textOnLightTertiary}>
                      {slot.time}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Empty state: party too large for any table ── */}
          {allSlotsHaveNoFit && (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyIcon}>🪑</AppText>
              <AppText variant="bodyMedium" color={Colors.textOnLight}>No tables for your party size</AppText>
              <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.emptySubtext}>
                This restaurant doesn't have a table large enough for your group on this date.
                Try a smaller party size or call the restaurant directly.
              </AppText>
            </View>
          )}

          {/* ── Empty state: fully unavailable (no notice slots, no fit slots) ── */}
          {available.length === 0 && requiresNotice.length === 0 && noTableFit.length === 0 && (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyIcon}>🍽️</AppText>
              <AppText variant="bodyMedium" color={Colors.textOnLight}>No times available</AppText>
              <AppText variant="caption" color={Colors.textOnLightSecondary} style={styles.emptySubtext}>
                Try a different date or party size
              </AppText>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['4'] },
  headerLeft: {
    flex: 1 },
  title: {
    fontSize: FontSize.xl },
  subtitle: {
    marginTop: r(3) },
  closeButton: {
    width: r(34),
    height: r(34),
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing['3'] },
  closeIcon: {
    fontSize: FontSize.base,
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold' },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['5'],
    paddingBottom: Spacing['10'] },

  // ── Section ────────────────────────────────────────────────────────────────
  section: {
    marginBottom: Spacing['6'] },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['3'],
    gap: Spacing['2'] },
  sectionTick: {
    width: r(3),
    height: r(18),
    backgroundColor: Colors.primary,
    borderRadius: r(2) },
  periodEmoji: {
    fontSize: FontSize.md },
  periodTitle: {
    fontSize: FontSize.lg,
    flex: 1 },
  slotCount: {
    alignSelf: 'flex-end' },

  // ── Slot grid ──────────────────────────────────────────────────────────────
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing['2'] },

  // ── Advance notice section ─────────────────────────────────────────────────
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['2'],
    gap: Spacing['3'] },
  noticeDivider: {
    flex: 1,
    height: r(1),
    backgroundColor: Colors.cardBorder },
  noticePill: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['1'] },
  noticePillText: {
    letterSpacing: 0.2 },
  noticeSubtext: {
    marginBottom: Spacing['3'],
    lineHeight: r(18) },
  disabledSlot: {
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['2'],
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    minWidth: r(72),
    alignItems: 'center',
    opacity: 0.5 },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['12'] },
  emptyIcon: {
    fontSize: FontSize['6xl'],
    marginBottom: Spacing['3'] },
  emptySubtext: {
    marginTop: Spacing['1'],
    textAlign: 'center',
    lineHeight: r(18),
    paddingHorizontal: Spacing['4'] } });

export default AllSlotsModal;



