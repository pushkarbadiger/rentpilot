import type { PaymentMethod, RentPayment } from "@/lib/types/domain";
import { createPaymentWebhookAdminClient } from "@/lib/supabase/payment-webhook-admin";
import { toLocalDateKey } from "@/lib/services/payment-status";
import {
  computeReconciledPaymentFields,
  paymentReflectsReconciliation,
  permanentReconciliationFailure,
  type ReconciledPaymentFields,
} from "../../reconciliation";
import type { PaymentCollectionSession } from "../../types";
import type {
  RazorpayPaymentEntity,
  RazorpayPaymentLink,
  RazorpayWebhookEventEnvelope,
} from "./types";

function normalizeCurrency(currency: string): string {
  return currency.trim().toLowerCase();
}

/**
 * Maps verified Razorpay payment method to domain payment_method.
 * Schema supports: bank_transfer, card, cash, check, other.
 */
export function mapRazorpayPaymentMethod(
  razorpayMethod: string | null | undefined
): PaymentMethod {
  const method = razorpayMethod?.trim().toLowerCase();
  if (method === "card" || method === "credit" || method === "debit") {
    return "card";
  }
  return "other";
}

export function validateRazorpayReconciliationAmountAndCurrency(
  session: PaymentCollectionSession,
  paymentLink: RazorpayPaymentLink
): number {
  if (session.provider !== "razorpay") {
    throw permanentReconciliationFailure("Collection session provider mismatch.");
  }

  if (paymentLink.amount !== session.amount_minor) {
    throw permanentReconciliationFailure("Payment link amount mismatch.");
  }

  if (
    normalizeCurrency(paymentLink.currency) !==
    normalizeCurrency(session.currency)
  ) {
    throw permanentReconciliationFailure("Payment link currency mismatch.");
  }

  if (session.currency !== "inr") {
    throw permanentReconciliationFailure("Unsupported collection currency.");
  }

  if (session.amount_minor <= 0) {
    throw permanentReconciliationFailure("Invalid stored collection session amount.");
  }

  return session.amount_minor;
}

export function validateProviderPaymentIdCorrelation(
  session: PaymentCollectionSession,
  providerPaymentId: string | null
): void {
  if (!providerPaymentId) {
    return;
  }

  if (
    session.provider_payment_id &&
    session.provider_payment_id !== providerPaymentId
  ) {
    throw permanentReconciliationFailure("Provider payment ID mismatch.");
  }
}

async function loadRentPaymentForReconciliation(
  ownerId: string,
  rentPaymentId: string,
  tenantId: string
): Promise<RentPayment> {
  const supabase = createPaymentWebhookAdminClient();
  const { data, error } = await supabase
    .from("rent_payments")
    .select("*")
    .eq("id", rentPaymentId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error(
      "[razorpay-reconciliation] rent payment lookup failed",
      error.message
    );
    throw error;
  }

  if (!data) {
    throw permanentReconciliationFailure(
      "Rent payment not found for reconciliation."
    );
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
  const supabase = createPaymentWebhookAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("monthly_rent")
    .eq("id", tenantId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error(
      "[razorpay-reconciliation] tenant lookup failed",
      error.message
    );
    throw error;
  }

  if (!data) {
    throw permanentReconciliationFailure(
      "Tenant not found for reconciliation."
    );
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

  const supabase = createPaymentWebhookAdminClient();
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
    console.error(
      "[razorpay-reconciliation] rent payment update failed",
      error.message
    );
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

  throw permanentReconciliationFailure(
    "Rent payment changed during reconciliation."
  );
}

async function markCollectionSessionReconciled(
  session: PaymentCollectionSession,
  providerPaymentId: string | null,
  completedAt: string
): Promise<"marked" | "already_marked"> {
  const supabase = createPaymentWebhookAdminClient();
  const updateFields: {
    status: PaymentCollectionSession["status"];
    reconciled_at: string;
    completed_at: string;
    provider_payment_id?: string;
  } = {
    status: "complete",
    reconciled_at: new Date().toISOString(),
    completed_at: completedAt,
  };

  if (providerPaymentId && !session.provider_payment_id) {
    updateFields.provider_payment_id = providerPaymentId;
  }

  const { data, error } = await supabase
    .from("payment_collection_sessions")
    .update(updateFields)
    .eq("id", session.id)
    .is("reconciled_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "[razorpay-reconciliation] session reconcile marker failed",
      error.message,
      { sessionId: session.id }
    );
    throw error;
  }

  if (data) {
    return "marked";
  }

  return "already_marked";
}

async function markCollectionSessionFailed(sessionId: string): Promise<void> {
  const supabase = createPaymentWebhookAdminClient();
  const { error } = await supabase
    .from("payment_collection_sessions")
    .update({ status: "failed" })
    .eq("id", sessionId)
    .is("reconciled_at", null);

  if (error) {
    console.error(
      "[razorpay-reconciliation] session failed marker update failed",
      error.message,
      { sessionId }
    );
  }
}

function extractPaymentEntity(
  envelope: RazorpayWebhookEventEnvelope
): RazorpayPaymentEntity | null {
  return envelope.payload?.payment?.entity ?? null;
}

/**
 * Authoritative reconciliation for a verified payment_link.paid webhook.
 * Mutates rent_payments and sets payment_collection_sessions.reconciled_at.
 */
export async function reconcileRazorpayPaymentLinkPaid(input: {
  session: PaymentCollectionSession;
  paymentLink: RazorpayPaymentLink;
  envelope: RazorpayWebhookEventEnvelope;
  providerPaymentId: string | null;
  completedAt: string;
}): Promise<void> {
  const { session, paymentLink, envelope, providerPaymentId, completedAt } =
    input;

  if (session.reconciled_at) {
    return;
  }

  if (session.provider_reference_id !== paymentLink.id) {
    throw permanentReconciliationFailure("Payment link ID mismatch.");
  }

  try {
    validateProviderPaymentIdCorrelation(session, providerPaymentId);
    const receivedMinor = validateRazorpayReconciliationAmountAndCurrency(
      session,
      paymentLink
    );

    const payment = await loadRentPaymentForReconciliation(
      session.owner_id,
      session.rent_payment_id,
      session.tenant_id
    );
    const tenantMonthlyRent = await loadTenantMonthlyRent(
      session.owner_id,
      session.tenant_id
    );

    const paymentEntity = extractPaymentEntity(envelope);
    const paymentMethod = mapRazorpayPaymentMethod(paymentEntity?.method);
    const paymentDateKey = toLocalDateKey(new Date(completedAt));

    const computed = computeReconciledPaymentFields(
      payment,
      tenantMonthlyRent,
      receivedMinor,
      paymentDateKey,
      paymentMethod
    );

    if (computed.kind === "overpayment") {
      throw permanentReconciliationFailure(
        "Payment amount exceeds outstanding balance."
      );
    }

    if (computed.kind === "already_settled") {
      await markCollectionSessionReconciled(
        session,
        providerPaymentId,
        completedAt
      );
      return;
    }

    await applyRentPaymentReconciliation(
      payment,
      session.owner_id,
      computed.fields
    );
    await markCollectionSessionReconciled(
      session,
      providerPaymentId,
      completedAt
    );
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.startsWith("permanent:")
    ) {
      await markCollectionSessionFailed(session.id);
    }
    throw err;
  }
}
