import { getRentPaymentCollectionStatus } from "@/lib/services/payments/collection-sessions";
import type { PaymentCollectionSessionDisplay } from "@/lib/services/payments/types";
import type {
  CheckoutSessionDisplay,
  RentCheckoutHeadlineState,
} from "./stripe/checkout-display";
import type { ServiceResult } from "./properties";

/** @deprecated Use RentPaymentCollectionStatus from payments/collection-sessions. */
export interface RentPaymentStripeStatus {
  isDemo: boolean;
  stripeConfigured: boolean;
  outstandingCents: number;
  sessions: CheckoutSessionDisplay[];
  latestSession: CheckoutSessionDisplay | null;
  latestOpenSession: CheckoutSessionDisplay | null;
  headline: string;
  headlineState: RentCheckoutHeadlineState;
  hasReconciledSession: boolean;
}

function toLegacySessionDisplay(
  session: PaymentCollectionSessionDisplay
): CheckoutSessionDisplay {
  return {
    id: session.id,
    amountCents: session.amountMinor,
    currency: session.currency,
    status: session.status,
    checkoutUrl: session.collectionUrl,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    reconciledAt: session.reconciledAt,
    displayState: session.displayState,
    message: session.message,
  };
}

/** Owner-scoped checkout status for the rent payment detail page. */
export async function getRentPaymentStripeStatus(
  paymentId: string
): Promise<ServiceResult<RentPaymentStripeStatus>> {
  const result = await getRentPaymentCollectionStatus(paymentId);
  if (result.error || !result.data) {
    return { data: null, error: result.error ?? "Payment not found" };
  }

  const data = result.data;
  const sessions = data.sessions.map(toLegacySessionDisplay);

  return {
    data: {
      isDemo: data.isDemo,
      stripeConfigured: data.providerConfigured,
      outstandingCents: data.outstandingMinor,
      sessions,
      latestSession: sessions[0] ?? null,
      latestOpenSession:
        sessions.find(
          (session) =>
            session.displayState === "awaiting_payment" &&
            Boolean(session.checkoutUrl)
        ) ?? null,
      headline: data.headline,
      headlineState: data.headlineState,
      hasReconciledSession: data.hasReconciledSession,
    },
    error: null,
  };
}
