import type Stripe from "stripe";
import type {
  StripeCheckoutSession,
  StripeWebhookEvent,
} from "@/lib/types/domain";
import { createStripeWebhookAdminClient } from "@/lib/supabase/stripe-webhook-admin";
import { mapStripeAccountToProfileFields } from "./stripe-connect";
import { reconcileStripeCheckoutCompleted } from "./stripe-reconciliation";

export type StripeWebhookProcessResult =
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

async function getWebhookEventByStripeId(
  stripeEventId: string
): Promise<StripeWebhookEvent | null> {
  const supabase = createStripeWebhookAdminClient();
  const { data, error } = await supabase
    .from("stripe_webhook_events")
    .select("*")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();

  if (error) {
    console.error("[stripe-webhook] event lookup failed", error.message);
    throw error;
  }

  return (data as StripeWebhookEvent | null) ?? null;
}

async function claimWebhookEvent(
  event: Stripe.Event
): Promise<{ record: StripeWebhookEvent; skip: boolean }> {
  const supabase = createStripeWebhookAdminClient();

  const { data: inserted, error } = await supabase
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      stripe_account_id: event.account ?? null,
      status: "pending",
    })
    .select("*")
    .maybeSingle();

  if (!error && inserted) {
    return { record: inserted as StripeWebhookEvent, skip: false };
  }

  if (error?.code === "23505") {
    const existing = await getWebhookEventByStripeId(event.id);
    if (!existing) {
      throw new Error("Webhook event conflict without existing row.");
    }

    if (existing.status === "processed") {
      return { record: existing, skip: true };
    }

    return { record: existing, skip: false };
  }

  if (error) {
    console.error("[stripe-webhook] event insert failed", error.message);
    throw error;
  }

  throw new Error("Webhook event insert returned no row.");
}

async function markWebhookEventProcessed(stripeEventId: string): Promise<void> {
  const supabase = createStripeWebhookAdminClient();
  const { error } = await supabase
    .from("stripe_webhook_events")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("stripe_event_id", stripeEventId);

  if (error) {
    console.error("[stripe-webhook] mark processed failed", error.message);
    throw error;
  }
}

async function markWebhookEventFailed(
  stripeEventId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createStripeWebhookAdminClient();
  const { error } = await supabase
    .from("stripe_webhook_events")
    .update({
      status: "failed",
      processed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq("stripe_event_id", stripeEventId);

  if (error) {
    console.error("[stripe-webhook] mark failed failed", error.message);
    throw error;
  }
}

async function loadCorrelatedCheckoutSession(
  stripeSession: Stripe.Checkout.Session,
  connectedAccountId: string | null
): Promise<StripeCheckoutSession> {
  const metadata = stripeSession.metadata ?? {};
  const metadataOwnerId = metadata.owner_id;
  const metadataRentPaymentId = metadata.rent_payment_id;
  const metadataRowId = metadata.rentpilot_checkout_row_id;

  const supabase = createStripeWebhookAdminClient();
  let internal: StripeCheckoutSession | null = null;

  if (metadataRowId) {
    const { data, error } = await supabase
      .from("stripe_checkout_sessions")
      .select("*")
      .eq("id", metadataRowId)
      .maybeSingle();

    if (error) {
      console.error("[stripe-webhook] checkout lookup by row id failed", error.message);
      throw error;
    }

    internal = (data as StripeCheckoutSession | null) ?? null;
  }

  if (!internal) {
    const { data, error } = await supabase
      .from("stripe_checkout_sessions")
      .select("*")
      .eq("stripe_checkout_session_id", stripeSession.id)
      .maybeSingle();

    if (error) {
      console.error(
        "[stripe-webhook] checkout lookup by stripe session id failed",
        error.message
      );
      throw error;
    }

    internal = (data as StripeCheckoutSession | null) ?? null;
  }

  if (!internal) {
    throw permanentFailure("Checkout session correlation failed.");
  }

  if (internal.stripe_checkout_session_id !== stripeSession.id) {
    throw permanentFailure("Checkout session ID mismatch.");
  }

  if (metadataOwnerId && internal.owner_id !== metadataOwnerId) {
    throw permanentFailure("Checkout owner metadata mismatch.");
  }

  if (
    metadataRentPaymentId &&
    internal.rent_payment_id !== metadataRentPaymentId
  ) {
    throw permanentFailure("Checkout rent payment metadata mismatch.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, stripe_connect_account_id")
    .eq("id", internal.owner_id)
    .maybeSingle();

  if (profileError) {
    console.error("[stripe-webhook] profile lookup failed", profileError.message);
    throw profileError;
  }

  if (!profile) {
    throw permanentFailure("Checkout owner profile not found.");
  }

  if (!profile.stripe_connect_account_id) {
    throw permanentFailure("Checkout owner has no connected Stripe account.");
  }

  if (
    connectedAccountId &&
    profile.stripe_connect_account_id !== connectedAccountId
  ) {
    throw permanentFailure("Connected Stripe account mismatch.");
  }

  return internal;
}

async function handleCheckoutSessionCompleted(
  event: Stripe.Event
): Promise<void> {
  if (!event.account) {
    throw permanentFailure("Missing connected account on checkout event.");
  }

  const stripeSession = event.data.object as Stripe.Checkout.Session;
  const internal = await loadCorrelatedCheckoutSession(
    stripeSession,
    event.account
  );

  await reconcileStripeCheckoutCompleted({
    stripeSession,
    internal,
    eventCreatedAt: event.created,
  });
}

async function handleCheckoutSessionExpired(
  event: Stripe.Event
): Promise<void> {
  if (!event.account) {
    throw permanentFailure("Missing connected account on checkout event.");
  }

  const stripeSession = event.data.object as Stripe.Checkout.Session;
  const internal = await loadCorrelatedCheckoutSession(
    stripeSession,
    event.account
  );

  const supabase = createStripeWebhookAdminClient();
  const { error } = await supabase
    .from("stripe_checkout_sessions")
    .update({ status: "expired" })
    .eq("id", internal.id)
    .in("status", ["created", "open", "expired"]);

  if (error) {
    console.error(
      "[stripe-webhook] checkout expired update failed",
      error.message,
      { checkoutSessionId: internal.id }
    );
    throw error;
  }
}

async function handleAccountUpdated(event: Stripe.Event): Promise<void> {
  const account = event.data.object as Stripe.Account;
  const supabase = createStripeWebhookAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_connect_account_id", account.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "[stripe-webhook] account.updated profile lookup failed",
      profileError.message
    );
    throw profileError;
  }

  if (!profile) {
    console.info(
      "[stripe-webhook] account.updated with no matching profile",
      account.id
    );
    return;
  }

  const fields = mapStripeAccountToProfileFields(account);
  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", profile.id);

  if (error) {
    console.error(
      "[stripe-webhook] account.updated profile sync failed",
      error.message,
      { profileId: profile.id }
    );
    throw error;
  }
}

async function dispatchVerifiedEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event);
      return;
    case "checkout.session.expired":
      await handleCheckoutSessionExpired(event);
      return;
    case "account.updated":
      await handleAccountUpdated(event);
      return;
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
      return;
    default:
      console.info("[stripe-webhook] unhandled event type", event.type);
      return;
  }
}

/**
 * Processes a signature-verified Stripe webhook event with DB idempotency.
 * checkout.session.completed reconciles rent_payments (P2.8E).
 */
export async function processStripeWebhookEvent(
  event: Stripe.Event
): Promise<StripeWebhookProcessResult> {
  const { record, skip } = await claimWebhookEvent(event);

  if (skip) {
    return { ok: true };
  }

  try {
    await dispatchVerifiedEvent(event);
    await markWebhookEventProcessed(record.stripe_event_id);
    return { ok: true };
  } catch (err) {
    if (isPermanentFailure(err)) {
      const message = safeFailureMessage(err);
      console.warn("[stripe-webhook] permanent processing failure", {
        stripeEventId: event.id,
        eventType: event.type,
        message,
      });
      await markWebhookEventFailed(record.stripe_event_id, message);
      return { ok: true };
    }

    console.error("[stripe-webhook] transient processing failure", {
      stripeEventId: event.id,
      eventType: event.type,
      error: err,
    });
    return { ok: false, retry: true };
  }
}
