import { createClient } from "@/lib/supabase/server";
import { demoStripeCheckoutSessions } from "@/lib/demo-data";
import type { RentPayment } from "@/lib/types/domain";
import { getCurrentUser } from "../auth";
import { getPaymentOutstandingAmount } from "../metrics";
import type { ServiceResult } from "../properties";
import { getRentPayment } from "../rent-payments";
import { getTenant } from "../tenants";
import {
  deriveRentCollectionHeadline,
  toPaymentCollectionSessionDisplay,
} from "./collection-display";
import {
  DEFAULT_CURRENCY,
  PAYMENT_COLLECTION_PROVIDER,
  isPaymentCollectionConfigured,
  toMinorUnits,
} from "./config";
import { stripeCheckoutSessionToCollectionSession } from "./providers/stripe/adapter";
import type {
  PaymentCollectionSession,
  PaymentCollectionSessionDisplay,
  PaymentCollectionSessionSummary,
  RentCollectionHeadlineState,
} from "./types";

export interface RentPaymentCollectionStatus {
  isDemo: boolean;
  provider: typeof PAYMENT_COLLECTION_PROVIDER;
  providerConfigured: boolean;
  outstandingMinor: number;
  currency: typeof DEFAULT_CURRENCY;
  sessions: PaymentCollectionSessionDisplay[];
  latestSession: PaymentCollectionSessionDisplay | null;
  latestOpenSession: PaymentCollectionSessionDisplay | null;
  headline: string;
  headlineState: RentCollectionHeadlineState;
  hasReconciledSession: boolean;
}

function toSummary(
  session: PaymentCollectionSession
): PaymentCollectionSessionSummary {
  return {
    id: session.id,
    provider: session.provider,
    amountMinor: session.amount_minor,
    currency: session.currency,
    status: session.status,
    collectionUrl: session.collection_url,
    createdAt: session.created_at,
    completedAt: session.completed_at,
    reconciledAt: session.reconciled_at,
  };
}

function findLatestOpenSession(
  sessions: PaymentCollectionSessionDisplay[]
): PaymentCollectionSessionDisplay | null {
  return (
    sessions.find(
      (session) =>
        session.displayState === "awaiting_payment" &&
        Boolean(session.collectionUrl)
    ) ?? null
  );
}

async function listStripeLegacySessions(
  ownerId: string,
  rentPaymentId: string,
  isDemo: boolean
): Promise<PaymentCollectionSession[]> {
  if (isDemo) {
    return demoStripeCheckoutSessions
      .filter(
        (session) =>
          session.owner_id === ownerId &&
          session.rent_payment_id === rentPaymentId
      )
      .map((session) =>
        stripeCheckoutSessionToCollectionSession(
          session as Parameters<typeof stripeCheckoutSessionToCollectionSession>[0]
        )
      );
  }

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("stripe_checkout_sessions")
    .select(
      "id, owner_id, rent_payment_id, tenant_id, stripe_checkout_session_id, stripe_payment_intent_id, amount_cents, currency, status, idempotency_key, checkout_url, created_at, completed_at, reconciled_at"
    )
    .eq("owner_id", ownerId)
    .eq("rent_payment_id", rentPaymentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[collection-sessions] stripe legacy list failed",
      error.message,
      { rentPaymentId }
    );
    return [];
  }

  return (data ?? []).map((row) =>
    stripeCheckoutSessionToCollectionSession({
      id: row.id,
      owner_id: row.owner_id,
      rent_payment_id: row.rent_payment_id,
      tenant_id: row.tenant_id,
      stripe_checkout_session_id: row.stripe_checkout_session_id,
      stripe_payment_intent_id: row.stripe_payment_intent_id,
      amount_cents: row.amount_cents,
      currency: row.currency,
      status: row.status,
      idempotency_key: row.idempotency_key,
      checkout_url: row.checkout_url,
      created_at: row.created_at,
      completed_at: row.completed_at,
      reconciled_at: row.reconciled_at,
    })
  );
}

async function listProviderNeutralSessions(
  ownerId: string,
  rentPaymentId: string,
  isDemo: boolean
): Promise<PaymentCollectionSession[]> {
  if (isDemo) {
    return [];
  }

  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("payment_collection_sessions")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("rent_payment_id", rentPaymentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[collection-sessions] provider-neutral list failed",
      error.message,
      { rentPaymentId }
    );
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    owner_id: row.owner_id,
    rent_payment_id: row.rent_payment_id,
    tenant_id: row.tenant_id,
    provider: row.provider as PaymentCollectionSession["provider"],
    provider_reference_id: row.provider_reference_id,
    provider_payment_id: row.provider_payment_id,
    amount_minor: row.amount_minor,
    currency: row.currency as PaymentCollectionSession["currency"],
    status: row.status as PaymentCollectionSession["status"],
    idempotency_key: row.idempotency_key,
    collection_url: row.collection_url,
    created_at: row.created_at,
    completed_at: row.completed_at,
    reconciled_at: row.reconciled_at,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  }));
}

/**
 * Lists collection sessions for a rent payment from the active provider store.
 * Stripe legacy rows are read when provider is stripe; neutral table when razorpay.
 */
export async function listCollectionSessionsForPayment(
  ownerId: string,
  rentPaymentId: string,
  isDemo: boolean
): Promise<PaymentCollectionSession[]> {
  if (isDemo) {
    return listStripeLegacySessions(ownerId, rentPaymentId, true);
  }

  if (PAYMENT_COLLECTION_PROVIDER === "stripe") {
    return listStripeLegacySessions(ownerId, rentPaymentId, false);
  }

  if (PAYMENT_COLLECTION_PROVIDER === "razorpay") {
    return listProviderNeutralSessions(ownerId, rentPaymentId, false);
  }

  return [];
}

/** Owner-scoped collection status for the rent payment detail page. */
export async function getRentPaymentCollectionStatus(
  paymentId: string
): Promise<ServiceResult<RentPaymentCollectionStatus>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const paymentResult = await getRentPayment(paymentId);
  if (paymentResult.error || !paymentResult.data) {
    return {
      data: null,
      error: paymentResult.error ?? "Payment not found",
    };
  }

  const payment: RentPayment = paymentResult.data;
  const tenantResult = await getTenant(payment.tenant_id);
  const tenantMonthlyRent = tenantResult.data?.monthly_rent;
  const outstanding = getPaymentOutstandingAmount(payment, tenantMonthlyRent);
  const outstandingMinor = toMinorUnits(outstanding, DEFAULT_CURRENCY);

  const rawSessions = await listCollectionSessionsForPayment(
    user.id,
    payment.id,
    user.isDemo
  );

  const sessions = rawSessions.map((session) =>
    toPaymentCollectionSessionDisplay(toSummary(session), outstandingMinor)
  );

  const { headline, headlineState } = deriveRentCollectionHeadline(sessions);
  const latestSession = sessions[0] ?? null;
  const latestOpenSession = findLatestOpenSession(sessions);
  const hasReconciledSession = sessions.some(
    (session) => session.displayState === "reconciled"
  );

  return {
    data: {
      isDemo: user.isDemo,
      provider: PAYMENT_COLLECTION_PROVIDER,
      providerConfigured: user.isDemo || isPaymentCollectionConfigured(),
      outstandingMinor,
      currency: DEFAULT_CURRENCY,
      sessions,
      latestSession,
      latestOpenSession,
      headline,
      headlineState,
      hasReconciledSession,
    },
    error: null,
  };
}
