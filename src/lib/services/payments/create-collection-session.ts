import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { StripeCheckoutSession } from "@/lib/types/domain";
import { getAppOrigin } from "../stripe/app-origin";
import { getStripeClient, isStripeConfigured } from "../stripe";
import type { ServiceResult } from "../properties";
import { loadRentCollectionContext } from "./checkout-context";
import {
  DEFAULT_CURRENCY,
  PAYMENT_COLLECTION_PROVIDER,
} from "./config";
import {
  createRazorpayPaymentLink,
  mapRazorpayPaymentLinkStatus,
} from "./providers/razorpay/checkout";
import { isRazorpayConfigured, RazorpayApiError } from "./providers/razorpay/client";
import type {
  PaymentCollectionSession,
  PaymentCollectionStatus,
  RentCollectionSessionResult,
} from "./types";

function formatDueDateLabel(dueDate: string): string {
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return dueDate.slice(0, 10);
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildCollectionIdempotencyKey(
  provider: "razorpay" | "stripe",
  rentPaymentId: string,
  amountMinor: number
): string {
  return `rent-collect:${provider}:${rentPaymentId}:${amountMinor}:${randomUUID()}`;
}

async function findReusableCollectionSession(
  ownerId: string,
  rentPaymentId: string,
  provider: "razorpay" | "stripe",
  amountMinor: number
): Promise<PaymentCollectionSession | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("payment_collection_sessions")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("rent_payment_id", rentPaymentId)
    .eq("provider", provider)
    .in("status", ["created", "open"])
    .not("collection_url", "is", null)
    .eq("amount_minor", amountMinor)
    .is("reconciled_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "[create-collection-session] reusable session lookup failed",
      error.message
    );
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    owner_id: data.owner_id,
    rent_payment_id: data.rent_payment_id,
    tenant_id: data.tenant_id,
    provider: data.provider as PaymentCollectionSession["provider"],
    provider_reference_id: data.provider_reference_id,
    provider_payment_id: data.provider_payment_id,
    amount_minor: data.amount_minor,
    currency: data.currency as PaymentCollectionSession["currency"],
    status: data.status as PaymentCollectionStatus,
    idempotency_key: data.idempotency_key,
    collection_url: data.collection_url,
    created_at: data.created_at,
    completed_at: data.completed_at,
    reconciled_at: data.reconciled_at,
    metadata: (data.metadata as Record<string, unknown> | null) ?? null,
  };
}

async function findReusableStripeLegacySession(
  ownerId: string,
  rentPaymentId: string,
  amountCents: number
): Promise<StripeCheckoutSession | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("stripe_checkout_sessions")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("rent_payment_id", rentPaymentId)
    .in("status", ["created", "open"])
    .not("checkout_url", "is", null)
    .eq("amount_cents", amountCents)
    .is("reconciled_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "[create-collection-session] stripe legacy reusable lookup failed",
      error.message
    );
    return null;
  }

  if (!data) return null;
  return data as StripeCheckoutSession;
}

function mapStripeSessionStatus(status: string | null | undefined): PaymentCollectionStatus {
  switch (status) {
    case "open":
      return "open";
    case "complete":
      return "complete";
    case "expired":
      return "expired";
    case "failed":
      return "failed";
    default:
      return "created";
  }
}

function paymentIntentId(
  paymentIntent: string | { id: string } | null | undefined
): string | null {
  if (!paymentIntent) return null;
  if (typeof paymentIntent === "string") return paymentIntent;
  return paymentIntent.id ?? null;
}

async function createRazorpayCollectionSession(
  ctx: NonNullable<Awaited<ReturnType<typeof loadRentCollectionContext>>["data"]>
): Promise<ServiceResult<RentCollectionSessionResult>> {
  if (!isRazorpayConfigured()) {
    return {
      data: null,
      error: "Payment collection is not configured. Contact your administrator.",
    };
  }

  const reusable = await findReusableCollectionSession(
    ctx.userId,
    ctx.payment.id,
    "razorpay",
    ctx.amountMinor
  );
  if (reusable?.collection_url) {
    return {
      data: {
        collectionUrl: reusable.collection_url,
        amountMinor: reusable.amount_minor,
        currency: reusable.currency,
        simulated: false,
      },
      error: null,
    };
  }

  const internalRowId = randomUUID();
  const idempotencyKey = buildCollectionIdempotencyKey(
    "razorpay",
    ctx.payment.id,
    ctx.amountMinor
  );
  const propertyName = ctx.payment.property?.name ?? "Rent";
  const dueLabel = formatDueDateLabel(ctx.payment.due_date);
  const description = `Rent — ${propertyName} · Due ${dueLabel}`;

  try {
    const paymentLink = await createRazorpayPaymentLink({
      amountMinor: ctx.amountMinor,
      collectionSessionId: internalRowId,
      rentPaymentId: ctx.payment.id,
      ownerId: ctx.userId,
      tenantId: ctx.payment.tenant_id,
      description,
      customerName: ctx.tenantName,
      customerEmail: ctx.tenantEmail,
      customerContact: ctx.tenantPhone,
    });

    if (!paymentLink.id || !paymentLink.short_url) {
      console.error("[create-collection-session] Razorpay link missing id or short_url");
      return {
        data: null,
        error: "Could not create payment link. Please try again.",
      };
    }

    const supabase = await createClient();
    if (!supabase) {
      console.error(
        "[create-collection-session] DB unavailable after Razorpay link",
        paymentLink.id
      );
      return {
        data: null,
        error: "Could not save payment link. Please try again.",
      };
    }

    const status = mapRazorpayPaymentLinkStatus(paymentLink.status);
    const { error: insertError } = await supabase
      .from("payment_collection_sessions")
      .insert({
        id: internalRowId,
        owner_id: ctx.userId,
        rent_payment_id: ctx.payment.id,
        tenant_id: ctx.payment.tenant_id,
        provider: "razorpay",
        provider_reference_id: paymentLink.id,
        provider_payment_id: null,
        amount_minor: ctx.amountMinor,
        currency: "inr",
        status,
        idempotency_key: idempotencyKey,
        collection_url: paymentLink.short_url,
        metadata: {
          razorpay_reference_id: paymentLink.reference_id,
          razorpay_status: paymentLink.status,
        },
      });

    if (insertError) {
      console.error(
        "[create-collection-session] session persist failed",
        insertError.message,
        { razorpayPaymentLinkId: paymentLink.id }
      );
      return {
        data: null,
        error: "Could not save payment link. Please try again.",
      };
    }

    return {
      data: {
        collectionUrl: paymentLink.short_url,
        amountMinor: ctx.amountMinor,
        currency: "inr",
        simulated: false,
      },
      error: null,
    };
  } catch (err) {
    if (err instanceof RazorpayApiError) {
      console.error("[create-collection-session] Razorpay API failed", err.message);
      return {
        data: null,
        error: "Could not create payment link. Please try again.",
      };
    }
    console.error("[create-collection-session] Razorpay create failed", err);
    return {
      data: null,
      error: "Could not create payment link. Please try again.",
    };
  }
}

async function createStripeLegacyCollectionSession(
  ctx: NonNullable<Awaited<ReturnType<typeof loadRentCollectionContext>>["data"]>
): Promise<ServiceResult<RentCollectionSessionResult>> {
  if (!isStripeConfigured) {
    return {
      data: null,
      error: "Payment collection is not configured. Contact your administrator.",
    };
  }

  if (!ctx.connectedAccountId || !ctx.chargesEnabled) {
    return {
      data: null,
      error:
        "Complete Stripe setup in Settings before collecting rent online.",
    };
  }

  const reusable = await findReusableStripeLegacySession(
    ctx.userId,
    ctx.payment.id,
    ctx.amountMinor
  );
  if (reusable?.checkout_url) {
    return {
      data: {
        collectionUrl: reusable.checkout_url,
        amountMinor: reusable.amount_cents,
        currency: "usd",
        simulated: false,
      },
      error: null,
    };
  }

  const idempotencyKey = buildCollectionIdempotencyKey(
    "stripe",
    ctx.payment.id,
    ctx.amountMinor
  );
  const internalRowId = randomUUID();
  const origin = await getAppOrigin();
  const propertyName = ctx.payment.property?.name ?? "Rent";
  const dueLabel = formatDueDateLabel(ctx.payment.due_date);

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: ctx.amountMinor,
              product_data: {
                name: "Rent payment",
                description: `${propertyName} · Due ${dueLabel}`,
              },
            },
          },
        ],
        success_url: `${origin}/dashboard/rent/${ctx.payment.id}?checkout=success`,
        cancel_url: `${origin}/dashboard/rent/${ctx.payment.id}?checkout=cancel`,
        metadata: {
          rent_payment_id: ctx.payment.id,
          owner_id: ctx.userId,
          rentpilot_checkout_row_id: internalRowId,
        },
      },
      {
        stripeAccount: ctx.connectedAccountId,
        idempotencyKey,
      }
    );

    if (!session.url || !session.id) {
      console.error("[create-collection-session] Stripe session missing url or id");
      return {
        data: null,
        error: "Could not create checkout session. Please try again.",
      };
    }

    const supabase = await createClient();
    if (!supabase) {
      console.error(
        "[create-collection-session] DB unavailable after Stripe session",
        session.id
      );
      return {
        data: null,
        error: "Could not save checkout session. Please try again.",
      };
    }

    const { error: insertError } = await supabase
      .from("stripe_checkout_sessions")
      .insert({
        id: internalRowId,
        owner_id: ctx.userId,
        rent_payment_id: ctx.payment.id,
        tenant_id: ctx.payment.tenant_id,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId(session.payment_intent),
        amount_cents: ctx.amountMinor,
        currency: "usd",
        status: mapStripeSessionStatus(session.status),
        idempotency_key: idempotencyKey,
        checkout_url: session.url,
      });

    if (insertError) {
      console.error(
        "[create-collection-session] stripe legacy persist failed",
        insertError.message,
        { stripeSessionId: session.id }
      );
      return {
        data: null,
        error: "Could not save checkout session. Please try again.",
      };
    }

    return {
      data: {
        collectionUrl: session.url,
        amountMinor: ctx.amountMinor,
        currency: "usd",
        simulated: false,
      },
      error: null,
    };
  } catch (err) {
    console.error("[create-collection-session] Stripe create failed", err);
    return {
      data: null,
      error: "Could not create checkout session. Please try again.",
    };
  }
}

/**
 * Creates a provider-neutral rent collection session for the outstanding balance.
 * Does not modify rent_payments or set reconciled_at.
 */
export async function createRentCollectionSession(
  paymentId: string
): Promise<ServiceResult<RentCollectionSessionResult>> {
  const ctx = await loadRentCollectionContext(paymentId);
  if (ctx.error || !ctx.data) {
    return { data: null, error: ctx.error ?? "Could not create collection session." };
  }

  if (ctx.data.isDemo) {
    return {
      data: {
        collectionUrl: "",
        amountMinor: ctx.data.amountMinor,
        currency: ctx.data.currency ?? DEFAULT_CURRENCY,
        simulated: true,
      },
      error: null,
    };
  }

  if (PAYMENT_COLLECTION_PROVIDER === "none") {
    return {
      data: null,
      error: "Online rent collection is not available.",
    };
  }

  if (PAYMENT_COLLECTION_PROVIDER === "razorpay") {
    return createRazorpayCollectionSession(ctx.data);
  }

  if (PAYMENT_COLLECTION_PROVIDER === "stripe") {
    return createStripeLegacyCollectionSession(ctx.data);
  }

  return {
    data: null,
    error: "Online rent collection is not available.",
  };
}
