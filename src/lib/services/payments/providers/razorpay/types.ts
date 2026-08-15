/**
 * Razorpay API types — aligned with official Payment Links documentation.
 * @see https://razorpay.com/docs/api/payments/payment-links/create-standard/
 */

/** Razorpay Payment Link status values from the official API. */
export type RazorpayPaymentLinkStatus =
  | "created"
  | "paid"
  | "partially_paid"
  | "expired"
  | "cancelled";

export interface RazorpayPaymentLinkCustomer {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpayCreatePaymentLinkRequest {
  amount: number;
  currency: "INR";
  accept_partial?: boolean;
  description?: string;
  reference_id?: string;
  customer?: RazorpayPaymentLinkCustomer;
  notes?: Record<string, string>;
  reminder_enable?: boolean;
}

export interface RazorpayPaymentLink {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  description: string | null;
  reference_id: string | null;
  short_url: string;
  status: RazorpayPaymentLinkStatus;
  created_at: number;
  updated_at: number;
  expire_by: number | null;
  expired_at: number | null;
  cancelled_at: number | null;
  notes: Record<string, string> | null;
  payments: unknown[] | null;
}

export interface RazorpayApiErrorBody {
  error?: {
    code?: string;
    description?: string;
    field?: string;
    source?: string;
    step?: string;
    reason?: string;
  };
}

/** Razorpay payment entity subset from webhook payloads. */
export interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  method?: string | null;
}

/**
 * Razorpay webhook event envelope.
 * @see https://razorpay.com/docs/webhooks/payment-links/
 */
export interface RazorpayWebhookEventEnvelope {
  entity: "event";
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment_link?: {
      entity: RazorpayPaymentLink;
    };
    payment?: {
      entity: RazorpayPaymentEntity;
    };
  };
  created_at: number;
}

export const RAZORPAY_PAYMENT_LINK_EVENTS = {
  PAID: "payment_link.paid",
  PARTIALLY_PAID: "payment_link.partially_paid",
  CANCELLED: "payment_link.cancelled",
  EXPIRED: "payment_link.expired",
} as const;

export type RazorpayPaymentLinkEventType =
  (typeof RAZORPAY_PAYMENT_LINK_EVENTS)[keyof typeof RAZORPAY_PAYMENT_LINK_EVENTS];
