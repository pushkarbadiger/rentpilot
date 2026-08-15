/**
 * Privileged Supabase client for Stripe webhook processing ONLY.
 *
 * @deprecated Use createPaymentWebhookAdminClient from payment-webhook-admin.
 */
export {
  createPaymentWebhookAdminClient as createStripeWebhookAdminClient,
  isPaymentWebhookDbConfigured as isStripeWebhookDbConfigured,
} from "./payment-webhook-admin";
