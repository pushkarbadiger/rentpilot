// Hand-authored type definitions matching supabase/migrations/0001_init.sql.
// Regenerate when the schema changes — see README "Generating Supabase types":
//   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts

import type {
  PaymentMethod,
  PaymentStatus,
  PropertyStatus,
  PropertyType,
  ReminderKind,
  ReminderLogStatus,
  StripeCheckoutSessionStatus,
  StripeConnectOnboardingStatus,
  StripeWebhookEventStatus,
  TenantStatus,
} from "./domain";
import type {
  PaymentCollectionStatus,
  PaymentCurrency,
  PaymentProvider,
  PaymentWebhookEventStatus,
} from "@/lib/services/payments/types";

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          company_name: string | null;
          avatar_url: string | null;
          stripe_connect_account_id: string | null;
          stripe_connect_onboarding_status: StripeConnectOnboardingStatus;
          stripe_connect_charges_enabled: boolean;
          stripe_connect_payouts_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          stripe_connect_account_id?: string | null;
          stripe_connect_onboarding_status?: StripeConnectOnboardingStatus;
          stripe_connect_charges_enabled?: boolean;
          stripe_connect_payouts_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          stripe_connect_account_id?: string | null;
          stripe_connect_onboarding_status?: StripeConnectOnboardingStatus;
          stripe_connect_charges_enabled?: boolean;
          stripe_connect_payouts_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          postal_code: string;
          property_type: PropertyType;
          units: number;
          monthly_rent: number;
          status: PropertyStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          postal_code: string;
          property_type: PropertyType;
          units?: number;
          monthly_rent?: number;
          status?: PropertyStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          unit: string | null;
          lease_start: string | null;
          lease_end: string | null;
          monthly_rent: number;
          security_deposit: number;
          status: TenantStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          property_id?: string | null;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          unit?: string | null;
          lease_start?: string | null;
          lease_end?: string | null;
          monthly_rent?: number;
          security_deposit?: number;
          status?: TenantStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      rent_payments: {
        Row: {
          id: string;
          owner_id: string;
          tenant_id: string;
          property_id: string;
          amount: number;
          due_date: string;
          billing_month: string | null;
          payment_date: string | null;
          status: PaymentStatus;
          payment_method: PaymentMethod | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          tenant_id: string;
          property_id: string;
          amount: number;
          due_date: string;
          billing_month?: string | null;
          payment_date?: string | null;
          status?: PaymentStatus;
          payment_method?: PaymentMethod | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["rent_payments"]["Insert"]
        >;
        Relationships: [];
      };
      rent_reminder_logs: {
        Row: {
          id: string;
          owner_id: string;
          rent_payment_id: string;
          tenant_id: string;
          reminder_kind: ReminderKind;
          channel: "email";
          recipient_email: string;
          subject: string;
          provider: string;
          provider_message_id: string | null;
          status: ReminderLogStatus;
          error_message: string | null;
          sent_at: string | null;
          reserved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          rent_payment_id: string;
          tenant_id: string;
          reminder_kind: ReminderKind;
          channel?: "email";
          recipient_email: string;
          subject: string;
          provider: string;
          provider_message_id?: string | null;
          status: ReminderLogStatus;
          error_message?: string | null;
          sent_at?: string | null;
          reserved_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["rent_reminder_logs"]["Insert"]
        >;
        Relationships: [];
      };
      payment_collection_sessions: {
        Row: {
          id: string;
          owner_id: string;
          rent_payment_id: string;
          tenant_id: string;
          provider: PaymentProvider;
          provider_reference_id: string | null;
          provider_payment_id: string | null;
          amount_minor: number;
          currency: PaymentCurrency;
          status: PaymentCollectionStatus;
          idempotency_key: string;
          collection_url: string | null;
          reconciled_at: string | null;
          completed_at: string | null;
          created_at: string;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          rent_payment_id: string;
          tenant_id: string;
          provider: PaymentProvider;
          provider_reference_id?: string | null;
          provider_payment_id?: string | null;
          amount_minor: number;
          currency?: PaymentCurrency;
          status: PaymentCollectionStatus;
          idempotency_key: string;
          collection_url?: string | null;
          reconciled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          metadata?: Record<string, unknown> | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["payment_collection_sessions"]["Insert"]
        >;
        Relationships: [];
      };
      payment_webhook_events: {
        Row: {
          id: string;
          provider: PaymentProvider;
          provider_event_id: string;
          event_type: string | null;
          status: PaymentWebhookEventStatus;
          error_message: string | null;
          provider_account_id: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          provider: PaymentProvider;
          provider_event_id: string;
          event_type?: string | null;
          status?: PaymentWebhookEventStatus;
          error_message?: string | null;
          provider_account_id?: string | null;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["payment_webhook_events"]["Insert"]
        >;
        Relationships: [];
      };
      stripe_checkout_sessions: {
        Row: {
          id: string;
          owner_id: string;
          rent_payment_id: string;
          tenant_id: string;
          stripe_checkout_session_id: string;
          stripe_payment_intent_id: string | null;
          amount_cents: number;
          currency: "usd";
          status: StripeCheckoutSessionStatus;
          idempotency_key: string;
          checkout_url: string | null;
          created_at: string;
          completed_at: string | null;
          reconciled_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          rent_payment_id: string;
          tenant_id: string;
          stripe_checkout_session_id: string;
          stripe_payment_intent_id?: string | null;
          amount_cents: number;
          currency?: "usd";
          status: StripeCheckoutSessionStatus;
          idempotency_key: string;
          checkout_url?: string | null;
          created_at?: string;
          completed_at?: string | null;
          reconciled_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["stripe_checkout_sessions"]["Insert"]
        >;
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          stripe_event_id: string;
          event_type: string;
          stripe_account_id: string | null;
          status: StripeWebhookEventStatus;
          error_message: string | null;
          received_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          stripe_event_id: string;
          event_type: string;
          stripe_account_id?: string | null;
          status?: StripeWebhookEventStatus;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["stripe_webhook_events"]["Insert"]
        >;
        Relationships: [];
      };
    };
  };
}
