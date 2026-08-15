import {
  getStripeClient,
  getStripeWebhookSecret,
  isStripeWebhookConfigured,
} from "@/lib/services/stripe";
import { processStripeWebhookEvent } from "@/lib/services/stripe-webhooks";
import { isStripeWebhookDbConfigured } from "@/lib/supabase/stripe-webhook-admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !isStripeWebhookConfigured) {
    return new Response("Webhook not configured.", { status: 503 });
  }

  if (!isStripeWebhookDbConfigured()) {
    return new Response("Webhook database not configured.", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing Stripe signature.", { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret()
    );
  } catch (err) {
    console.warn("[stripe-webhook] signature verification failed", err);
    return new Response("Invalid Stripe signature.", { status: 400 });
  }

  try {
    const result = await processStripeWebhookEvent(event);
    if (!result.ok) {
      return new Response("Webhook processing failed.", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[stripe-webhook] unhandled processing error", err);
    return new Response("Webhook processing failed.", { status: 500 });
  }
}
