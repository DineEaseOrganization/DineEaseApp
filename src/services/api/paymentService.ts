// src/services/api/paymentService.ts
import { apiClient } from './apiClient';
import { API_CONFIG } from '../../config/api.config';
import {
  CustomerSetupResponse,
  CreatePaymentIntentResponse,
  EphemeralKeyResponse,
  ListPaymentMethodsResponse,
  PaymentPolicyResponse,
} from '../../types/api.types';

/**
 * PaymentService — client-facing payment API.
 *
 * All calls go through the API gateway to DineEasePayments.
 * The base URL points to the /payments/* namespace.
 *
 * NOTE: Stripe card-collection UI requires @stripe/stripe-react-native.
 * Install with:  npx expo install @stripe/stripe-react-native
 * Then wrap <App> in <StripeProvider publishableKey={...}> inside App.tsx.
 */
class PaymentService {
  private readonly BASE_URL = API_CONFIG.PAYMENTS_SERVICE_URL;

  // ─── Customer / SetupIntent ────────────────────────────────────────────────

  /**
   * Create (or retrieve) a Stripe Customer for the authenticated user
   * and generate a SetupIntent so the customer can save a card.
   *
   * POST /payments/customer/setup
   *
   * Returns a clientSecret that is passed to the Stripe SDK's
   * presentPaymentSheet() / initPaymentSheet() to collect card details.
   */
  async setupStripeCustomer(): Promise<CustomerSetupResponse> {
    return apiClient.post<CustomerSetupResponse>(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMER_SETUP}`
    );
  }

  // ─── List saved cards ──────────────────────────────────────────────────────

  /**
   * Fetch the authenticated customer's saved card PaymentMethods from Stripe.
   * Called on every visit to the Payment Methods screen so the UI always reflects
   * the real Stripe state rather than transient local React state.
   *
   * GET /payments/customer/me/payment-methods
   */
  async getPaymentMethods(): Promise<ListPaymentMethodsResponse> {
    return apiClient.get<ListPaymentMethodsResponse>(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMER_PAYMENT_METHODS}`
    );
  }

  // ─── Ephemeral key ─────────────────────────────────────────────────────────

  /**
   * Create a short-lived Stripe Ephemeral Key for the authenticated customer.
   *
   * The key secret (+ customerId) must be passed to initPaymentSheet() so the
   * Stripe Payment Sheet can display the customer's pre-saved cards.
   *
   * Throws a 404 (CustomerNotFoundException) if the customer has never saved
   * a card — callers should catch this and proceed without the ephemeral key
   * (the Payment Sheet still works in card-entry mode).
   *
   * GET /payments/customer/me/ephemeral-key
   */
  async getEphemeralKey(): Promise<EphemeralKeyResponse> {
    return apiClient.get<EphemeralKeyResponse>(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMER_EPHEMERAL_KEY}`
    );
  }

  // ─── Payment Policy ────────────────────────────────────────────────────────

  /**
   * Fetch the historical payment policy that was active when a reservation was booked.
   *
   * Call lazily — only when the customer is about to cancel a payment-enabled reservation
   * and needs to see the exact refund/cancellation terms. Returns the policy version that
   * was in effect at booking time, even if the restaurant has since changed their policy.
   *
   * GET /payments/customer/me/policy/{policyId}
   */
  async getReservationPolicy(policyId: number): Promise<PaymentPolicyResponse> {
    return apiClient.get<PaymentPolicyResponse>(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMER_POLICY}/${policyId}`
    );
  }

  /**
   * Fetch the effective payment policy for a restaurant.
   * If there is a section-level override the backend returns that,
   * otherwise the restaurant-level policy is returned.
   *
   * GET /payments/policy/{restaurantId}/effective[?sectionId=]
   */
  async getEffectivePolicy(
    restaurantId: number,
    sectionId?: number
  ): Promise<PaymentPolicyResponse | null> {
    try {
      const params = sectionId ? `?sectionId=${sectionId}` : '';
      return await apiClient.get<PaymentPolicyResponse>(
        `${this.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT_POLICY_EFFECTIVE}/${restaurantId}/effective${params}`
      );
    } catch {
      // Fail-open: return null if no policy is configured
      return null;
    }
  }

  // ─── Payment Intent ────────────────────────────────────────────────────────

  /**
   * Retry a failed payment intent for a reservation.
   * POST /payments/intent/retry/{reservationId}
   */
  async retryPaymentIntent(reservationId: number): Promise<CreatePaymentIntentResponse> {
    return apiClient.post<CreatePaymentIntentResponse>(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT_INTENT_RETRY}/${reservationId}`
    );
  }

  // ─── Remove saved card ─────────────────────────────────────────────────────

  /**
   * Detach (remove) a saved card from the authenticated customer's Stripe account.
   * The card can no longer be used for payments after this call.
   *
   * DELETE /payments/customer/me/payment-methods/{paymentMethodId}
   */
  async removePaymentMethod(paymentMethodId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMER_PAYMENT_METHODS}/${paymentMethodId}`
    );
  }

  // ─── Card removal guard ────────────────────────────────────────────────────

  /**
   * Check whether the authenticated customer has upcoming CANCELLATION_FEE reservations.
   *
   * Returns true if the customer should NOT be allowed to remove their saved card
   * (an off-session charge may be needed if they cancel a far-future booking).
   *
   * Fails safe: if the backend is unreachable, returns true to block removal.
   *
   * GET /processing/mobile/reservations/has-upcoming-cancellation-fee
   */
  async hasUpcomingCancellationFee(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ hasUpcomingCancellationFee: boolean }>(
        `${API_CONFIG.PROCESSING_SERVICE_URL}${API_CONFIG.ENDPOINTS.HAS_UPCOMING_CANCELLATION_FEE}`
      );
      return response.hasUpcomingCancellationFee;
    } catch {
      // Fail-safe: block removal if the check cannot be completed
      return true;
    }
  }

  // ─── Cancellation evaluation ───────────────────────────────────────────────

  /**
   * Ask the backend whether a cancellation fee should be charged.
   * POST /payments/cancel/evaluate
   */
  async evaluateCancellation(
    reservationId: number,
    restaurantId: number
  ): Promise<{ chargeApplicable: boolean; amount: number; currency: string; reason: string }> {
    return apiClient.post(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.CANCEL_EVALUATE}`,
      { reservationId, restaurantId }
    );
  }

  // ─── Refund ────────────────────────────────────────────────────────────────

  /**
   * Issue a refund for a transaction.
   * POST /payments/refund/{transactionId}
   */
  async refund(
    transactionId: number,
    amountMinorUnits?: number
  ): Promise<{ success: boolean; refundId: string }> {
    return apiClient.post(
      `${this.BASE_URL}${API_CONFIG.ENDPOINTS.PAYMENT_REFUND}/${transactionId}`,
      amountMinorUnits !== undefined ? { amountMinorUnits } : {}
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Format a minor-unit amount (pence/cents) to a display string.
   * e.g. formatAmount(1050, 'GBP') → '£10.50'
   */
  formatAmount(amountMajorUnits: number, currency: string): string {
    const symbol: Record<string, string> = { GBP: '£', EUR: '€', USD: '$' };
    const prefix = symbol[currency.toUpperCase()] ?? currency;
    return `${prefix}${amountMajorUnits.toFixed(2)}`;
  }
}

export const paymentService = new PaymentService();
export { PaymentService };
