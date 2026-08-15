import Stripe from "stripe";

export * from "./types";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export const isStripeConfigured = Boolean(STRIPE_SECRET_KEY);

export const isStripeWebhookConfigured = Boolean(
  STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET
);

export function getStripeWebhookSecret(): string {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook secret is not configured.");
  }
  return STRIPE_WEBHOOK_SECRET;
}

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
  }

  return stripeClient;
}
