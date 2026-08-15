import type { StripeCheckoutSession } from "@/lib/types/domain";
import type { PaymentCollectionSession } from "../../types";

/** Maps a legacy Stripe checkout session row to the provider-neutral model. */
export function stripeCheckoutSessionToCollectionSession(
  session: StripeCheckoutSession
): PaymentCollectionSession {
  return {
    id: session.id,
    owner_id: session.owner_id,
    rent_payment_id: session.rent_payment_id,
    tenant_id: session.tenant_id,
    provider: "stripe",
    provider_reference_id: session.stripe_checkout_session_id,
    provider_payment_id: session.stripe_payment_intent_id,
    amount_minor: session.amount_cents,
    currency: session.currency,
    status: session.status,
    idempotency_key: session.idempotency_key,
    collection_url: session.checkout_url,
    created_at: session.created_at,
    completed_at: session.completed_at,
    reconciled_at: session.reconciled_at,
    metadata: null,
  };
}

export function collectionSessionToStripeCheckoutSession(
  session: PaymentCollectionSession
): StripeCheckoutSession | null {
  if (session.provider !== "stripe" || !session.provider_reference_id) {
    return null;
  }

  return {
    id: session.id,
    owner_id: session.owner_id,
    rent_payment_id: session.rent_payment_id,
    tenant_id: session.tenant_id,
    stripe_checkout_session_id: session.provider_reference_id,
    stripe_payment_intent_id: session.provider_payment_id,
    amount_cents: session.amount_minor,
    currency: session.currency === "usd" ? "usd" : "usd",
    status: session.status,
    idempotency_key: session.idempotency_key,
    checkout_url: session.collection_url,
    created_at: session.created_at,
    completed_at: session.completed_at,
    reconciled_at: session.reconciled_at,
  };
}
