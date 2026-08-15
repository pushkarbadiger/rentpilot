/**
 * Legacy Stripe checkout display helpers — delegates to provider-neutral layer.
 * Frozen: no new Stripe-specific display logic.
 */
import type { PaymentCurrency } from "@/lib/services/payments/types";
import {
  derivePaymentDisplayState,
  deriveRentCollectionHeadline,
  paymentDisplayLabel,
  paymentDisplayMessage,
  toPaymentCollectionSessionDisplay,
  verifyCollectionDisplayLogic,
} from "@/lib/services/payments/collection-display";
import type { PaymentDisplayState } from "@/lib/services/payments/types";
import type { StripeCheckoutSessionStatus } from "@/lib/types/domain";

/** @deprecated Use PaymentDisplayState */
export type CheckoutDisplayState = PaymentDisplayState;

export interface CheckoutSessionSummary {
  id: string;
  amountCents: number;
  currency: PaymentCurrency;
  status: StripeCheckoutSessionStatus;
  checkoutUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  reconciledAt: string | null;
}

export interface CheckoutSessionDisplay extends CheckoutSessionSummary {
  displayState: CheckoutDisplayState;
  message: string;
}

export type RentCheckoutHeadlineState = CheckoutDisplayState | "none";

export const checkoutDisplayMessage = paymentDisplayMessage;
export const checkoutDisplayLabel = paymentDisplayLabel;

export function deriveCheckoutDisplayState(
  session: CheckoutSessionSummary,
  currentOutstandingCents: number
): CheckoutDisplayState {
  return derivePaymentDisplayState(
    {
      id: session.id,
      provider: "stripe",
      amountMinor: session.amountCents,
      currency: session.currency,
      status: session.status,
      collectionUrl: session.checkoutUrl,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      reconciledAt: session.reconciledAt,
    },
    currentOutstandingCents
  );
}

export function toCheckoutSessionDisplay(
  session: CheckoutSessionSummary,
  currentOutstandingCents: number
): CheckoutSessionDisplay {
  const display = toPaymentCollectionSessionDisplay(
    {
      id: session.id,
      provider: "stripe",
      amountMinor: session.amountCents,
      currency: session.currency,
      status: session.status,
      collectionUrl: session.checkoutUrl,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      reconciledAt: session.reconciledAt,
    },
    currentOutstandingCents
  );

  return {
    id: display.id,
    amountCents: display.amountMinor,
    currency: display.currency,
    status: display.status,
    checkoutUrl: display.collectionUrl,
    createdAt: display.createdAt,
    completedAt: display.completedAt,
    reconciledAt: display.reconciledAt,
    displayState: display.displayState,
    message: display.message,
  };
}

export function deriveRentCheckoutHeadline(
  sessions: CheckoutSessionDisplay[]
): { headline: string; headlineState: RentCheckoutHeadlineState } {
  return deriveRentCollectionHeadline(
    sessions.map((session) => ({
      id: session.id,
      provider: "stripe" as const,
      amountMinor: session.amountCents,
      currency: session.currency,
      status: session.status,
      collectionUrl: session.checkoutUrl,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      reconciledAt: session.reconciledAt,
      displayState: session.displayState,
      message: session.message,
    }))
  );
}

/** @internal Executable self-check for checkout display-state derivation. */
export function verifyCheckoutDisplayLogic(): string[] {
  return verifyCollectionDisplayLogic();
}
