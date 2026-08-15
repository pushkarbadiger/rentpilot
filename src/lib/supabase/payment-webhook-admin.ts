/**
 * Privileged Supabase client for payment webhook processing ONLY.
 *
 * Do not import from landlord-facing routes, Server Actions, or components.
 * Webhook tables have RLS enabled with no landlord policies (migrations 0008, 0011).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { SUPABASE_URL, isSupabaseConfigured } from "./config";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isPaymentWebhookDbConfigured(): boolean {
  return isSupabaseConfigured && SERVICE_ROLE_KEY.length > 0;
}

let webhookAdminClient: SupabaseClient<Database> | null = null;

export function createPaymentWebhookAdminClient(): SupabaseClient<Database> {
  if (!isPaymentWebhookDbConfigured()) {
    throw new Error("Payment webhook database access is not configured.");
  }

  if (!webhookAdminClient) {
    webhookAdminClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return webhookAdminClient;
}
