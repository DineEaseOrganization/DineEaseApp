// src/screens/profile/PaymentMethodsScreen.tsx
//
// Payment Methods management screen.
// Uses @stripe/stripe-react-native for secure card collection via Payment Sheet.
// App.tsx wraps the app in <StripeProvider> so useStripe() works here.

import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, Radius, Spacing } from '../../theme';
import { r, rf } from '../../theme/responsive';
import AppText from '../../components/ui/AppText';
import { paymentService } from '../../services/api/paymentService';
import { CustomerSetupResponse, SavedCard } from '../../types/api.types';

const NAVY = Colors.primary;

interface PaymentMethodsScreenProps {
  navigation: any;
  route?: {
    params?: {
      /** When navigated from BookingScreen after a new customer was created */
      fromBooking?: boolean;
      setupClientSecret?: string;
      reservationId?: number;
    };
  };
}

const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({ navigation, route }) => {
  const fromBooking = route?.params?.fromBooking ?? false;
  const incomingClientSecret = route?.params?.setupClientSecret;

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [removingCardId, setRemovingCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved cards from the backend on every screen focus so the list always
  // reflects the real Stripe state — not transient local React state.
  const loadSavedCards = useCallback(async () => {
    setIsLoadingCards(true);
    try {
      const response = await paymentService.getPaymentMethods();
      setSavedCards(response.cards);
    } catch {
      // Fail silently — show empty state rather than an error on load
      setSavedCards([]);
    } finally {
      setIsLoadingCards(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedCards();
    }, [loadSavedCards])
  );

  const handleAddCard = async () => {
    setError(null);
    setIsSettingUp(true);
    try {
      // 1. Ask the backend to create (or retrieve) a Stripe Customer + SetupIntent
      const result = await paymentService.setupStripeCustomer();

      if (__DEV__) {
        console.log('🔑 SetupIntent clientSecret received, initialising Payment Sheet...');
      }

      // 2. Initialise the Stripe Payment Sheet in setup mode
      const { error: initError } = await initPaymentSheet({
        setupIntentClientSecret: result.clientSecret,
        merchantDisplayName: 'DineEase',
        customerId: result.stripeCustomerId,
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        setError(initError.message);
        return;
      }

      // 3. Present the sheet — user enters card details
      const { error: sheetError } = await presentPaymentSheet();

      if (!sheetError) {
        // Reload from the backend so the screen shows the real card brand/last4
        await loadSavedCards();
        Alert.alert('Card Saved', 'Your payment method has been saved securely.');
      } else if (sheetError.code !== 'Canceled') {
        // Canceled means the user dismissed — not an error worth showing
        setError(sheetError.message);
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to set up payment method');
    } finally {
      setIsSettingUp(false);
    }
  };

  /**
   * Remove a saved card with an upstream guard:
   *   1. Check if customer has upcoming CANCELLATION_FEE reservations.
   *   2. If yes → show blocking alert explaining why removal is not permitted.
   *   3. If no → confirm with the user, then detach from Stripe and reload the list.
   */
  const handleRemoveCard = async (card: SavedCard) => {
    setError(null);
    try {
      // Guard: block removal if a future cancellation fee hold may be needed
      const hasPending = await paymentService.hasUpcomingCancellationFee();
      if (hasPending) {
        Alert.alert(
          'Card Required',
          'You have upcoming bookings with a cancellation fee policy. Your saved card must remain on file until those reservations are completed or cancelled.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Confirm before removing
      Alert.alert(
        'Remove Card',
        `Remove ${card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• ${card.last4}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              setRemovingCardId(card.paymentMethodId);
              try {
                await paymentService.removePaymentMethod(card.paymentMethodId);
                await loadSavedCards();
              } catch (err: any) {
                setError(err.message ?? 'Failed to remove card. Please try again.');
              } finally {
                setRemovingCardId(null);
              }
            },
          },
        ]
      );
    } catch {
      // If the guard check itself fails, fail safe — block removal
      Alert.alert(
        'Temporarily Unavailable',
        'Unable to verify your booking status right now. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleContinueAfterSetup = () => {
    if (fromBooking) {
      navigation.goBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Navy header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={rf(20)} color={Colors.white} />
        </TouchableOpacity>
        <AppText variant="sectionTitle" color={Colors.white} style={styles.headerTitle}>
          Payment Methods
        </AppText>
        <View style={{ width: r(36) }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Context banner (when navigated from booking) ── */}
        {fromBooking && (
          <View style={styles.banner}>
            <Ionicons name="card-outline" size={rf(18)} color={NAVY} style={styles.bannerIcon} />
            <AppText variant="body" color={NAVY} style={styles.bannerText}>
              Save a card now so we can securely hold your booking and process any applicable fees.
            </AppText>
          </View>
        )}

        {/* ── Saved cards placeholder ── */}
        <View style={styles.sectionLabelRow}>
          <View style={styles.sectionTick} />
          <AppText variant="label" color={Colors.textOnLightSecondary} style={styles.sectionLabel}>
            💳  SAVED CARDS
          </AppText>
        </View>

        <View style={styles.card}>
          {isLoadingCards ? (
            /* ── Loading state ── */
            <View style={styles.emptyState}>
              <ActivityIndicator color={NAVY} />
            </View>
          ) : savedCards.length > 0 ? (
            /* ── All saved cards ── */
            <>
              {savedCards.map((card, index) => (
                <View key={card.paymentMethodId}>
                  {index > 0 && <View style={styles.cardDivider} />}
                  <View style={styles.savedRow}>
                    <View style={styles.cardIconWrap}>
                      <Ionicons name="card" size={rf(22)} color={NAVY} />
                    </View>
                    <View style={styles.cardInfo}>
                      <AppText variant="bodyMedium" color={Colors.textOnLight}>
                        {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• {card.last4}
                      </AppText>
                      <AppText variant="caption" color={Colors.textOnLightSecondary}>
                        Expires {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
                      </AppText>
                    </View>
                    {removingCardId === card.paymentMethodId ? (
                      <ActivityIndicator size="small" color={Colors.error ?? '#dc2626'} />
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleRemoveCard(card)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                        style={styles.removeBtn}
                      >
                        <Ionicons name="trash-outline" size={rf(18)} color={Colors.error ?? '#dc2626'} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </>
          ) : (
            /* ── Empty state ── */
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="card-outline" size={rf(32)} color={Colors.textOnLightTertiary} />
              </View>
              <AppText variant="bodyMedium" color={Colors.textOnLight} style={styles.emptyTitle}>
                No saved cards
              </AppText>
              <AppText variant="body" color={Colors.textOnLightSecondary} style={styles.emptyBody}>
                Add a payment method to speed up checkout and enable cancellation fee protection.
              </AppText>
            </View>
          )}
        </View>

        {/* ── Error message ── */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={rf(16)} color={Colors.error ?? '#dc2626'} />
            <AppText variant="caption" color={Colors.error ?? '#dc2626'} style={{ flex: 1, marginLeft: Spacing['2'] }}>
              {error}
            </AppText>
          </View>
        )}

        {/* ── Add Card button — always visible so users can add multiple cards ── */}
        {!isLoadingCards && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAddCard}
            disabled={isSettingUp}
            activeOpacity={0.85}
          >
            {isSettingUp ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={rf(18)} color={Colors.white} style={{ marginRight: r(6) }} />
                <AppText variant="button" color={Colors.white}>Add Payment Method</AppText>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* ── Continue button (post-setup / from booking) ── */}
        {(savedCards.length > 0 || fromBooking) && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleContinueAfterSetup}
            activeOpacity={0.85}
          >
            <AppText variant="button" color={Colors.white}>
              {fromBooking ? 'Continue to Booking' : 'Done'}
            </AppText>
          </TouchableOpacity>
        )}

        {/* ── Security note ── */}
        <View style={styles.securityNote}>
          <Ionicons name="lock-closed-outline" size={rf(14)} color={Colors.textOnLightTertiary} />
          <AppText variant="caption" color={Colors.textOnLightTertiary} style={styles.securityText}>
            Card details are never stored on our servers. All payments are processed
            securely by Stripe.
          </AppText>
        </View>

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
    width: r(36), height: r(36),
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

  // ── Banner ────────────────────────────────────────────────────────────────
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(15,51,70,0.07)',
    borderRadius: Radius.md,
    padding: Spacing['3'],
    marginBottom: Spacing['4'],
    borderWidth: 1,
    borderColor: 'rgba(15,51,70,0.12)',
  },
  bannerIcon: { marginRight: Spacing['2'], marginTop: r(2) },
  bannerText: { flex: 1, lineHeight: r(20) },

  // ── Section label ────────────────────────────────────────────────────────
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    marginBottom: Spacing['2'],
  },
  sectionTick: { width: r(3), height: r(14), backgroundColor: NAVY, borderRadius: r(2) },
  sectionLabel: { letterSpacing: 0.8 },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['4'],
    shadowColor: '#1a2e3b',
    shadowOffset: { width: r(0), height: r(2) },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: Spacing['4'],
  },

  // Saved card row
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
  },
  cardIconWrap: {
    width: r(42), height: r(42),
    borderRadius: Radius.md,
    backgroundColor: 'rgba(15,51,70,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1, gap: r(2) },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: Spacing['3'],
  },
  removeBtn: {
    width: r(32),
    height: r(32),
    borderRadius: Radius.sm,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: Spacing['4'] },
  emptyIconWrap: {
    width: r(64), height: r(64),
    borderRadius: Radius.full,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },
  emptyTitle: { marginBottom: Spacing['1'] },
  emptyBody: { textAlign: 'center', lineHeight: r(20) },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderRadius: Radius.md,
    padding: Spacing['3'],
    marginBottom: Spacing['3'],
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAVY,
    borderRadius: Radius.lg,
    paddingVertical: r(14),
    marginBottom: Spacing['3'],
    shadowColor: NAVY,
    shadowOffset: { width: r(0), height: r(3) },
    shadowOpacity: 0.2,
    shadowRadius: r(6),
    elevation: r(3),
  },
  continueBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: r(14),
    marginBottom: Spacing['3'],
    shadowColor: Colors.accent,
    shadowOffset: { width: r(0), height: r(3) },
    shadowOpacity: 0.25,
    shadowRadius: r(6),
    elevation: r(3),
  },

  // ── Security note ─────────────────────────────────────────────────────────
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing['2'],
    paddingHorizontal: Spacing['2'],
  },
  securityText: { flex: 1, lineHeight: r(18) },
});

export default PaymentMethodsScreen;
