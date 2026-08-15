// Core domain types shared across the app (UI, services, API routes).
// These mirror the Supabase schema defined in supabase/migrations/0001_init.sql.

export type PropertyType =
  | "apartment"
  | "house"
  | "condo"
  | "duplex"
  | "commercial"
  | "other";

export type PropertyStatus = "active" | "inactive";

export interface Property {
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
}

export type TenantStatus = "active" | "pending" | "former";

export interface Tenant {
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
  // Populated by joins for display purposes
  property?: Pick<Property, "id" | "name" | "address"> | null;
}

export type PaymentStatus = "paid" | "pending" | "late" | "partial";

export type PaymentMethod =
  | "bank_transfer"
  | "card"
  | "cash"
  | "check"
  | "other";

export interface RentPayment {
  id: string;
  owner_id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  due_date: string;
  /** YYYY-MM billing period; used for idempotent recurring generation. */
  billing_month: string | null;
  payment_date: string | null;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Populated by joins for display purposes
  tenant?: Pick<Tenant, "id" | "full_name"> | null;
  property?: Pick<Property, "id" | "name"> | null;
}

export interface Profile {
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
}

export interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyRent: number;
  rentCollected: number;
  outstandingRent: number;
  latePayments: number;
}

export type ReminderKind = "upcoming" | "due" | "late";

export type ReminderLogStatus = "pending" | "sent" | "failed" | "simulated";

export interface RentReminderLog {
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
  /** Set when status becomes pending; used for stale-reservation recovery. */
  reserved_at: string | null;
  created_at: string;
}

export type StripeConnectOnboardingStatus =
  | "not_started"
  | "pending"
  | "complete";

export type StripeCheckoutSessionStatus =
  | "created"
  | "open"
  | "complete"
  | "expired"
  | "failed";

export type StripeWebhookEventStatus = "pending" | "processed" | "failed";

export interface StripeCheckoutSession {
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
  /** Set when checkout.session.completed has been reconciled into rent_payments. */
  reconciled_at: string | null;
}

export interface StripeWebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  stripe_account_id: string | null;
  status: StripeWebhookEventStatus;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
}
