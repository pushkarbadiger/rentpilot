/**
 * Legacy Stripe provider adapter (frozen — no new Stripe features).
 * Re-exports Stripe-specific services for backward compatibility.
 */
export {
  stripeCheckoutSessionToCollectionSession,
  collectionSessionToStripeCheckoutSession,
} from "./adapter";

export { isStripeConfigured, isStripeWebhookConfigured } from "@/lib/services/stripe";
