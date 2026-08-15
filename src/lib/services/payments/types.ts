/**
 * Provider-neutral rent collection types (P2.8H).
 * Does not expose Stripe/Razorpay implementation details to core services.
 */

/** Active rent-collection provider for this deployment (server-configured). */
export type PaymentProvider = "razorpay" | "stripe" | "none";

/** Lifecycle status for a collection session (checkout / payment link). */
export type PaymentCollectionStatus =
  | "created"
  | "open"
  | "complete"
  | "expired"
  | "failed";

/** Landlord-facing display state for a collection session. */
export type PaymentDisplayState =
  | "awaiting_payment"
  | "expired"
  | "reconciled"
  | "failed"
  | "stale"
  | "processing_uncertain";

export type PaymentWebhookEventStatus = "pending" | "processed" | "failed";

/** Supported collection currencies (minor units: cents / paise). */
export type PaymentCurrency = "inr" | "usd";

export interface PaymentCollectionSession {
  id: string;
  owner_id: string;
  rent_payment_id: string;
  tenant_id: string;
  provider: PaymentProvider;
  provider_reference_id: string | null;
  provider_payment_id: string | null;
  amount_minor: number;
  currency: PaymentCurrency;
  status: PaymentCollectionStatus;
  idempotency_key: string;
  collection_url: string | null;
  created_at: string;
  completed_at: string | null;
  /** Set when webhook reconciliation has updated rent_payments. */
  reconciled_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface PaymentWebhookEvent {
  id: string;
  provider: PaymentProvider;
  provider_event_id: string;
  event_type: string | null;
  status: PaymentWebhookEventStatus;
  error_message: string | null;
  provider_account_id: string | null;
  created_at: string;
  processed_at: string | null;
}

/** Subset used for display-state derivation. */
export interface PaymentCollectionSessionSummary {
  id: string;
  provider: PaymentProvider;
  amountMinor: number;
  currency: PaymentCurrency;
  status: PaymentCollectionStatus;
  collectionUrl: string | null;
  createdAt: string;
  completedAt: string | null;
  reconciledAt: string | null;
}

export interface PaymentCollectionSessionDisplay
  extends PaymentCollectionSessionSummary {
  displayState: PaymentDisplayState;
  message: string;
}

export type RentCollectionHeadlineState = PaymentDisplayState | "none";

export interface RentCollectionSessionResult {
  collectionUrl: string;
  amountMinor: number;
  currency: PaymentCurrency;
  simulated: boolean;
}

export type RentCollectBlockReason =
  | "paid"
  | "no_outstanding"
  | "below_minimum"
  | "provider_unconfigured"
  | "provider_unavailable"
  | "not_connected"
  | "connect_not_ready"
  /** @deprecated Legacy Stripe-specific reason — mapped from provider adapters. */
  | "stripe_unconfigured";

export type RentCollectEligibility =
  | { canCollect: true; simulated: boolean; provider: PaymentProvider }
  | {
      canCollect: false;
      reason: RentCollectBlockReason;
      provider: PaymentProvider;
    };
