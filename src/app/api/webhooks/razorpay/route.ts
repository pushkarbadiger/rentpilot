import { isRazorpayWebhookConfigured } from "@/lib/services/payments/providers/razorpay/client";
import {
  processRazorpayWebhookEvent,
  verifyRazorpayWebhookRequest,
} from "@/lib/services/payments/providers/razorpay/webhooks";
import { isPaymentWebhookDbConfigured } from "@/lib/supabase/payment-webhook-admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !isRazorpayWebhookConfigured()) {
    return new Response("Webhook not configured.", { status: 503 });
  }

  if (!isPaymentWebhookDbConfigured()) {
    return new Response("Webhook database not configured.", { status: 503 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  const providerEventId = request.headers.get("x-razorpay-event-id");

  if (!providerEventId) {
    return new Response("Missing Razorpay event id.", { status: 400 });
  }

  const rawBody = await request.text();

  let envelope;
  try {
    envelope = verifyRazorpayWebhookRequest(rawBody, signature);
  } catch (err) {
    console.warn("[razorpay-webhook] signature verification failed", err);
    return new Response("Invalid Razorpay signature.", { status: 400 });
  }

  try {
    const result = await processRazorpayWebhookEvent({
      providerEventId,
      envelope,
    });

    if (!result.ok) {
      return new Response("Webhook processing failed.", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[razorpay-webhook] unhandled processing error", err);
    return new Response("Webhook processing failed.", { status: 500 });
  }
}
