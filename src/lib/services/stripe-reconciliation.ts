import type Stripe from "stripe";
import type { RentPayment, StripeCheckoutSession } from "@/lib/types/domain";
import { createStripeWebhookAdminClient } from "@/lib/supabase/stripe-webhook-admin";
import {
  computeReconciledPaymentFields,
  paymentReflectsReconciliation,
  permanentReconciliationFailure,
  type ReconciledPaymentFields,
  type ReconciliationComputeResult,
} from "./payments/reconciliation";
import { toLocalDateKey } from "./payment-status";

export {
  computeReconciledPaymentFields,
  paymentReflectsReconciliation,
  type ReconciledPaymentFields,
  type ReconciliationComputeResult,
};

export { verifyStripeReconciliationLogic } from "./payments/verify-stripe-reconciliation";

function paymentIntentId(
  paymentIntent: string | { id: string } | null | undefined
): string | null {
  if (!paymentIntent) return null;
  if (typeof paymentIntent === "string") return paymentIntent;
  return paymentIntent.id ?? null;
}

function validateStripeCheckoutAmounts(
  stripeSession: Stripe.Checkout.Session,
  internal: StripeCheckoutSession
): number {
  const currency = stripeSession.currency ?? internal.currency;
  if (currency !== "usd") {
    throw permanentReconciliationFailure("Unsupported checkout currency.");
  }

  const stripeAmountTotal = stripeSession.amount_total;
  if (stripeAmountTotal == null || stripeAmountTotal <= 0) {
    throw permanentReconciliationFailure("Invalid Stripe checkout amount.");
  }

  if (stripeAmountTotal !== internal.amount_cents) {
    throw permanentReconciliationFailure(
      "Stripe amount does not match checkout session."
    );
  }

  if (internal.currency !== "usd" || internal.amount_cents <= 0) {
    throw permanentReconciliationFailure("Invalid stored checkout session amount.");
  }

  return stripeAmountTotal;
}

async function loadRentPaymentForReconciliation(
  ownerId: string,
  rentPaymentId: string,
  tenantId: string
): Promise<RentPayment> {
  const supabase = createStripeWebhookAdminClient();
  const { data, error } = await supabase
    .from("rent_payments")
    .select("*")
    .eq("id", rentPaymentId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error("[stripe-reconciliation] rent payment lookup failed", error.message);
    throw error;
  }

  if (!data) {
    throw permanentReconciliationFailure("Rent payment not found for reconciliation.");
  }

  const payment = data as RentPayment;
  if (payment.tenant_id !== tenantId) {
    throw permanentReconciliationFailure("Rent payment tenant mismatch.");
  }

  return payment;
}

async function loadTenantMonthlyRent(
  ownerId: string,
  tenantId: string
): Promise<number> {
  const supabase = createStripeWebhookAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("monthly_rent")
    .eq("id", tenantId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error("[stripe-reconciliation] tenant lookup failed", error.message);
    throw error;
  }

  if (!data) {
    throw permanentReconciliationFailure("Tenant not found for reconciliation.");
  }

  return data.monthly_rent;
}

async function applyRentPaymentReconciliation(
  payment: RentPayment,
  ownerId: string,
  fields: ReconciledPaymentFields
): Promise<"applied" | "already_applied"> {
  if (paymentReflectsReconciliation(payment, fields)) {
    return "already_applied";
  }

  const supabase = createStripeWebhookAdminClient();
  const { data, error } = await supabase
    .from("rent_payments")
    .update({
      status: fields.status,
      amount: fields.amount,
      payment_date: fields.payment_date,
      payment_method: fields.payment_method,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("owner_id", ownerId)
    .eq("status", payment.status)
    .eq("amount", payment.amount)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[stripe-reconciliation] rent payment update failed", error.message);
    throw error;
  }

  if (data) {
    return "applied";
  }

  const refreshed = await loadRentPaymentForReconciliation(
    ownerId,
    payment.id,
    payment.tenant_id
  );

  if (paymentReflectsReconciliation(refreshed, fields)) {
    return "already_applied";
  }

  throw permanentReconciliationFailure("Rent payment changed during reconciliation.");
}

async function markCheckoutSessionReconciled(
  internal: StripeCheckoutSession,
  stripeSession: Stripe.Checkout.Session,
  eventCreatedAt: number
): Promise<"marked" | "already_marked"> {
  const supabase = createStripeWebhookAdminClient();
  const completedAt = new Date(eventCreatedAt * 1000).toISOString();
  const intentId =
    paymentIntentId(stripeSession.payment_intent) ??
    internal.stripe_payment_intent_id;

  const { data, error } = await supabase
    .from("stripe_checkout_sessions")
    .update({
      status: "complete",
      completed_at: completedAt,
      stripe_payment_intent_id: intentId,
      reconciled_at: new Date().toISOString(),
    })
    .eq("id", internal.id)
    .is("reconciled_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "[stripe-reconciliation] checkout reconcile marker failed",
      error.message,
      { checkoutSessionId: internal.id }
    );
    throw error;
  }

  if (data) {
    return "marked";
  }

  return "already_marked";
}

async function markCheckoutSessionFailed(checkoutSessionId: string): Promise<void> {
  const supabase = createStripeWebhookAdminClient();
  const { error } = await supabase
    .from("stripe_checkout_sessions")
    .update({ status: "failed" })
    .eq("id", checkoutSessionId)
    .is("reconciled_at", null);

  if (error) {
    console.error(
      "[stripe-reconciliation] checkout failed marker update failed",
      error.message,
      { checkoutSessionId }
    );
  }
}

/**
 * Reconciles a verified checkout.session.completed event into rent_payments.
 * Idempotent per checkout session via reconciled_at.
 */
export async function reconcileStripeCheckoutCompleted(input: {
  stripeSession: Stripe.Checkout.Session;
  internal: StripeCheckoutSession;
  eventCreatedAt: number;
}): Promise<void> {
  const { stripeSession, internal, eventCreatedAt } = input;

  if (internal.reconciled_at) {
    return;
  }

  try {
    const receivedCents = validateStripeCheckoutAmounts(stripeSession, internal);
    const payment = await loadRentPaymentForReconciliation(
      internal.owner_id,
      internal.rent_payment_id,
      internal.tenant_id
    );
    const tenantMonthlyRent = await loadTenantMonthlyRent(
      internal.owner_id,
      internal.tenant_id
    );

    const paymentDateKey = toLocalDateKey(new Date(eventCreatedAt * 1000));
    const computed = computeReconciledPaymentFields(
      payment,
      tenantMonthlyRent,
      receivedCents,
      paymentDateKey,
      "card"
    );

    if (computed.kind === "overpayment") {
      throw permanentReconciliationFailure(
        "Stripe amount exceeds outstanding balance."
      );
    }

    if (computed.kind === "already_settled") {
      await markCheckoutSessionReconciled(internal, stripeSession, eventCreatedAt);
      return;
    }

    await applyRentPaymentReconciliation(
      payment,
      internal.owner_id,
      computed.fields
    );
    await markCheckoutSessionReconciled(internal, stripeSession, eventCreatedAt);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("permanent:")) {
      await markCheckoutSessionFailed(internal.id);
    }
    throw err;
  }
}
