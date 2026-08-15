import { createPaymentWebhookAdminClient } from "@/lib/supabase/payment-webhook-admin";
import type {
  PaymentCollectionSession,
  PaymentWebhookEvent,
} from "../../types";
import {
  RAZORPAY_PAYMENT_LINK_EVENTS,
  type RazorpayPaymentLink,
  type RazorpayPaymentLinkEventType,
  type RazorpayWebhookEventEnvelope,
} from "./types";
import { verifyRazorpayWebhookSignature } from "./signature";
import { getRazorpayWebhookSecret } from "./client";
import {
  reconcileRazorpayPaymentLinkPaid,
  validateProviderPaymentIdCorrelation,
} from "./reconciliation";

export type RazorpayWebhookProcessResult =
  | { ok: true }
  | { ok: false; retry: boolean };

const PERMANENT_FAILURE_PREFIX = "permanent:";

function permanentFailure(message: string): Error {
  return new Error(`${PERMANENT_FAILURE_PREFIX}${message}`);
}

function isPermanentFailure(err: unknown): boolean {
  return (
    err instanceof Error && err.message.startsWith(PERMANENT_FAILURE_PREFIX)
  );
}

function safeFailureMessage(err: unknown): string {
  if (
    err instanceof Error &&
    err.message.startsWith(PERMANENT_FAILURE_PREFIX)
  ) {
    return err.message.slice(PERMANENT_FAILURE_PREFIX.length);
  }
  return "Webhook processing failed.";
}

function normalizeCurrency(currency: string): string {
  return currency.trim().toLowerCase();
}

export function parseRazorpayWebhookEnvelope(
  rawBody: string
): RazorpayWebhookEventEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw permanentFailure("Invalid webhook JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw permanentFailure("Invalid webhook payload.");
  }

  const envelope = parsed as RazorpayWebhookEventEnvelope;
  if (envelope.entity !== "event" || typeof envelope.event !== "string") {
    throw permanentFailure("Invalid webhook event envelope.");
  }

  return envelope;
}

export function extractPaymentLinkEntity(
  envelope: RazorpayWebhookEventEnvelope
): RazorpayPaymentLink {
  const entity = envelope.payload?.payment_link?.entity;
  if (!entity?.id) {
    throw permanentFailure("Missing payment link entity in webhook payload.");
  }
  return entity;
}

export function extractProviderPaymentId(
  envelope: RazorpayWebhookEventEnvelope
): string | null {
  const paymentId = envelope.payload?.payment?.entity?.id;
  return paymentId ?? null;
}

export function validatePaidAmountAndCurrency(
  session: PaymentCollectionSession,
  paymentLink: RazorpayPaymentLink
): void {
  if (paymentLink.amount !== session.amount_minor) {
    throw permanentFailure("Payment link amount mismatch.");
  }

  if (
    normalizeCurrency(paymentLink.currency) !==
    normalizeCurrency(session.currency)
  ) {
    throw permanentFailure("Payment link currency mismatch.");
  }
}

export function shouldSkipSessionRegression(
  session: PaymentCollectionSession,
  targetStatus: PaymentCollectionSession["status"]
): boolean {
  if (session.reconciled_at) {
    return true;
  }

  if (session.status === "complete" && targetStatus !== "complete") {
    return true;
  }

  return false;
}

async function getWebhookEventByProviderId(
  providerEventId: string
): Promise<PaymentWebhookEvent | null> {
  const supabase = createPaymentWebhookAdminClient();
  const { data, error } = await supabase
    .from("payment_webhook_events")
    .select("*")
    .eq("provider", "razorpay")
    .eq("provider_event_id", providerEventId)
    .maybeSingle();

  if (error) {
    console.error("[razorpay-webhook] event lookup failed", error.message);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    provider: data.provider as PaymentWebhookEvent["provider"],
    provider_event_id: data.provider_event_id,
    event_type: data.event_type,
    status: data.status,
    error_message: data.error_message,
    provider_account_id: data.provider_account_id,
    created_at: data.created_at,
    processed_at: data.processed_at,
  };
}

async function claimWebhookEvent(input: {
  providerEventId: string;
  eventType: string;
  providerAccountId: string | null;
}): Promise<{ record: PaymentWebhookEvent; skip: boolean }> {
  const supabase = createPaymentWebhookAdminClient();

  const { data: inserted, error } = await supabase
    .from("payment_webhook_events")
    .insert({
      provider: "razorpay",
      provider_event_id: input.providerEventId,
      event_type: input.eventType,
      provider_account_id: input.providerAccountId,
      status: "pending",
    })
    .select("*")
    .maybeSingle();

  if (!error && inserted) {
    return {
      record: {
        id: inserted.id,
        provider: "razorpay",
        provider_event_id: inserted.provider_event_id,
        event_type: inserted.event_type,
        status: inserted.status,
        error_message: inserted.error_message,
        provider_account_id: inserted.provider_account_id,
        created_at: inserted.created_at,
        processed_at: inserted.processed_at,
      },
      skip: false,
    };
  }

  if (error?.code === "23505") {
    const existing = await getWebhookEventByProviderId(input.providerEventId);
    if (!existing) {
      throw new Error("Webhook event conflict without existing row.");
    }

    if (existing.status === "processed") {
      return { record: existing, skip: true };
    }

    return { record: existing, skip: false };
  }

  if (error) {
    console.error("[razorpay-webhook] event insert failed", error.message);
    throw error;
  }

  throw new Error("Webhook event insert returned no row.");
}

async function markWebhookEventProcessed(providerEventId: string): Promise<void> {
  const supabase = createPaymentWebhookAdminClient();
  const { error } = await supabase
    .from("payment_webhook_events")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("provider", "razorpay")
    .eq("provider_event_id", providerEventId);

  if (error) {
    console.error("[razorpay-webhook] mark processed failed", error.message);
    throw error;
  }
}

async function markWebhookEventFailed(
  providerEventId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createPaymentWebhookAdminClient();
  const { error } = await supabase
    .from("payment_webhook_events")
    .update({
      status: "failed",
      processed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq("provider", "razorpay")
    .eq("provider_event_id", providerEventId);

  if (error) {
    console.error("[razorpay-webhook] mark failed failed", error.message);
    throw error;
  }
}

function mapDbRowToSession(row: {
  id: string;
  owner_id: string;
  rent_payment_id: string;
  tenant_id: string;
  provider: string;
  provider_reference_id: string | null;
  provider_payment_id: string | null;
  amount_minor: number;
  currency: string;
  status: string;
  idempotency_key: string;
  collection_url: string | null;
  created_at: string;
  completed_at: string | null;
  reconciled_at: string | null;
  metadata: unknown;
}): PaymentCollectionSession {
  return {
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
  };
}

async function loadCorrelatedCollectionSession(
  paymentLink: RazorpayPaymentLink
): Promise<PaymentCollectionSession> {
  const supabase = createPaymentWebhookAdminClient();
  const notes = paymentLink.notes ?? {};
  const noteSessionId = notes.collection_session_id;
  const noteRentPaymentId = notes.rent_payment_id;
  const noteOwnerId = notes.owner_id;
  const noteTenantId = notes.tenant_id;

  let session: PaymentCollectionSession | null = null;

  if (noteSessionId) {
    const { data, error } = await supabase
      .from("payment_collection_sessions")
      .select("*")
      .eq("id", noteSessionId)
      .maybeSingle();

    if (error) {
      console.error(
        "[razorpay-webhook] session lookup by note id failed",
        error.message
      );
      throw error;
    }

    if (data) {
      session = mapDbRowToSession(data);
    }
  }

  if (!session) {
    const { data, error } = await supabase
      .from("payment_collection_sessions")
      .select("*")
      .eq("provider", "razorpay")
      .eq("provider_reference_id", paymentLink.id)
      .maybeSingle();

    if (error) {
      console.error(
        "[razorpay-webhook] session lookup by payment link id failed",
        error.message
      );
      throw error;
    }

    if (data) {
      session = mapDbRowToSession(data);
    }
  }

  if (!session) {
    throw permanentFailure("Collection session correlation failed.");
  }

  if (session.provider !== "razorpay") {
    throw permanentFailure("Collection session provider mismatch.");
  }

  if (session.provider_reference_id !== paymentLink.id) {
    throw permanentFailure("Payment link ID mismatch.");
  }

  if (noteRentPaymentId && session.rent_payment_id !== noteRentPaymentId) {
    throw permanentFailure("Rent payment note mismatch.");
  }

  if (noteOwnerId && session.owner_id !== noteOwnerId) {
    throw permanentFailure("Owner note mismatch.");
  }

  if (noteTenantId && session.tenant_id !== noteTenantId) {
    throw permanentFailure("Tenant note mismatch.");
  }

  return session;
}

async function updateCollectionSession(
  sessionId: string,
  currentStatus: PaymentCollectionSession["status"],
  fields: {
    status: PaymentCollectionSession["status"];
    provider_payment_id?: string | null;
    completed_at?: string | null;
  }
): Promise<"updated" | "already_updated"> {
  const supabase = createPaymentWebhookAdminClient();
  const { data, error } = await supabase
    .from("payment_collection_sessions")
    .update(fields)
    .eq("id", sessionId)
    .eq("status", currentStatus)
    .is("reconciled_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[razorpay-webhook] session update failed", error.message, {
      sessionId,
    });
    throw error;
  }

  if (data) {
    return "updated";
  }

  const { data: refreshed, error: refreshError } = await supabase
    .from("payment_collection_sessions")
    .select("status, reconciled_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (refreshError) {
    console.error(
      "[razorpay-webhook] session refresh after update failed",
      refreshError.message
    );
    throw refreshError;
  }

  if (
    refreshed &&
    refreshed.status === fields.status &&
    !refreshed.reconciled_at
  ) {
    return "already_updated";
  }

  throw permanentFailure("Collection session changed during webhook handling.");
}

async function markCollectionSessionFailed(sessionId: string): Promise<void> {
  const supabase = createPaymentWebhookAdminClient();
  const { error } = await supabase
    .from("payment_collection_sessions")
    .update({ status: "failed" })
    .eq("id", sessionId)
    .is("reconciled_at", null)
    .in("status", ["created", "open"]);

  if (error) {
    console.error(
      "[razorpay-webhook] session failed marker update failed",
      error.message,
      { sessionId }
    );
  }
}

async function handlePaymentLinkPaid(
  envelope: RazorpayWebhookEventEnvelope
): Promise<void> {
  const paymentLink = extractPaymentLinkEntity(envelope);
  const session = await loadCorrelatedCollectionSession(paymentLink);

  if (shouldSkipSessionRegression(session, "complete")) {
    return;
  }

  const providerPaymentId = extractProviderPaymentId(envelope);
  const completedAt = session.completed_at ?? new Date().toISOString();

  try {
    validatePaidAmountAndCurrency(session, paymentLink);
    validateProviderPaymentIdCorrelation(session, providerPaymentId);
  } catch (err) {
    if (isPermanentFailure(err)) {
      await markCollectionSessionFailed(session.id);
    }
    throw err;
  }

  let activeSession = session;

  if (session.status !== "complete") {
    try {
      await updateCollectionSession(session.id, session.status, {
        status: "complete",
        provider_payment_id: providerPaymentId,
        completed_at: completedAt,
      });
      activeSession = {
        ...session,
        status: "complete",
        provider_payment_id: providerPaymentId ?? session.provider_payment_id,
        completed_at: completedAt,
      };
    } catch (err) {
      if (isPermanentFailure(err)) {
        await markCollectionSessionFailed(session.id);
      }
      throw err;
    }
  }

  await reconcileRazorpayPaymentLinkPaid({
    session: activeSession,
    paymentLink,
    envelope,
    providerPaymentId,
    completedAt,
  });
}

async function handlePaymentLinkCancelled(
  envelope: RazorpayWebhookEventEnvelope
): Promise<void> {
  const paymentLink = extractPaymentLinkEntity(envelope);
  const session = await loadCorrelatedCollectionSession(paymentLink);

  if (shouldSkipSessionRegression(session, "failed")) {
    return;
  }

  if (session.status === "failed") {
    return;
  }

  await updateCollectionSession(session.id, session.status, {
    status: "failed",
  });
}

async function handlePaymentLinkExpired(
  envelope: RazorpayWebhookEventEnvelope
): Promise<void> {
  const paymentLink = extractPaymentLinkEntity(envelope);
  const session = await loadCorrelatedCollectionSession(paymentLink);

  if (shouldSkipSessionRegression(session, "expired")) {
    return;
  }

  if (session.status === "expired") {
    return;
  }

  await updateCollectionSession(session.id, session.status, {
    status: "expired",
  });
}

async function handlePaymentLinkPartiallyPaid(
  envelope: RazorpayWebhookEventEnvelope
): Promise<void> {
  const paymentLink = extractPaymentLinkEntity(envelope);
  await loadCorrelatedCollectionSession(paymentLink);
  throw permanentFailure(
    "Unexpected partial payment on a full-outstanding payment link."
  );
}

async function dispatchVerifiedEvent(
  envelope: RazorpayWebhookEventEnvelope
): Promise<void> {
  const eventType = envelope.event as RazorpayPaymentLinkEventType;

  switch (eventType) {
    case RAZORPAY_PAYMENT_LINK_EVENTS.PAID:
      await handlePaymentLinkPaid(envelope);
      return;
    case RAZORPAY_PAYMENT_LINK_EVENTS.CANCELLED:
      await handlePaymentLinkCancelled(envelope);
      return;
    case RAZORPAY_PAYMENT_LINK_EVENTS.EXPIRED:
      await handlePaymentLinkExpired(envelope);
      return;
    case RAZORPAY_PAYMENT_LINK_EVENTS.PARTIALLY_PAID:
      await handlePaymentLinkPartiallyPaid(envelope);
      return;
    default:
      console.info("[razorpay-webhook] unhandled event type", envelope.event);
      return;
  }
}

export function verifyRazorpayWebhookRequest(
  rawBody: string,
  signature: string | null
): RazorpayWebhookEventEnvelope {
  if (!signature) {
    throw permanentFailure("Missing Razorpay signature.");
  }

  const secret = getRazorpayWebhookSecret();
  if (!verifyRazorpayWebhookSignature(rawBody, signature, secret)) {
    throw permanentFailure("Invalid Razorpay signature.");
  }

  return parseRazorpayWebhookEnvelope(rawBody);
}

/**
 * Processes a signature-verified Razorpay webhook event with DB idempotency.
 * payment_link.paid reconciles rent_payments via reconciled_at.
 */
export async function processRazorpayWebhookEvent(input: {
  providerEventId: string;
  envelope: RazorpayWebhookEventEnvelope;
}): Promise<RazorpayWebhookProcessResult> {
  const { providerEventId, envelope } = input;

  const { record, skip } = await claimWebhookEvent({
    providerEventId,
    eventType: envelope.event,
    providerAccountId: envelope.account_id ?? null,
  });

  if (skip) {
    return { ok: true };
  }

  try {
    await dispatchVerifiedEvent(envelope);
    await markWebhookEventProcessed(record.provider_event_id);
    return { ok: true };
  } catch (err) {
    if (isPermanentFailure(err)) {
      const message = safeFailureMessage(err);
      console.warn("[razorpay-webhook] permanent processing failure", {
        providerEventId,
        eventType: envelope.event,
        message,
      });
      await markWebhookEventFailed(record.provider_event_id, message);
      return { ok: true };
    }

    console.error("[razorpay-webhook] transient processing failure", {
      providerEventId,
      eventType: envelope.event,
      error: err,
    });
    return { ok: false, retry: true };
  }
}
