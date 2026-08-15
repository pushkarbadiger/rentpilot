import type { PaymentCollectionStatus } from "../../types";
import { razorpayRequest } from "./client";
import type {
  RazorpayCreatePaymentLinkRequest,
  RazorpayPaymentLink,
  RazorpayPaymentLinkStatus,
} from "./types";

/** Minimum Razorpay charge for INR (100 paise = ₹1). */
export const RAZORPAY_INR_MINIMUM_MINOR = 100;

/**
 * Maps Razorpay Payment Link status to RentPilot collection session status.
 * @see https://razorpay.com/docs/api/payments/payment-links/create-standard/
 */
export function mapRazorpayPaymentLinkStatus(
  status: RazorpayPaymentLinkStatus
): PaymentCollectionStatus {
  switch (status) {
    case "created":
      return "open";
    case "partially_paid":
      return "open";
    case "paid":
      return "complete";
    case "expired":
      return "expired";
    case "cancelled":
      return "failed";
    default:
      return "created";
  }
}

/**
 * Builds a Razorpay reference_id (max 40 chars, unique per Payment Link).
 */
export function buildRazorpayReferenceId(collectionSessionId: string): string {
  const compact = collectionSessionId.replace(/-/g, "");
  return `rp${compact}`.slice(0, 40);
}

export interface CreateRazorpayPaymentLinkInput {
  amountMinor: number;
  collectionSessionId: string;
  rentPaymentId: string;
  ownerId: string;
  tenantId: string;
  description: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerContact?: string | null;
}

/**
 * Creates a Razorpay Standard Payment Link.
 * POST https://api.razorpay.com/v1/payment_links
 */
export async function createRazorpayPaymentLink(
  input: CreateRazorpayPaymentLinkInput
): Promise<RazorpayPaymentLink> {
  if (input.amountMinor < RAZORPAY_INR_MINIMUM_MINOR) {
    throw new Error("Amount is below the Razorpay minimum charge.");
  }

  const payload: RazorpayCreatePaymentLinkRequest = {
    amount: input.amountMinor,
    currency: "INR",
    accept_partial: false,
    description: input.description,
    reference_id: buildRazorpayReferenceId(input.collectionSessionId),
    reminder_enable: false,
    notes: {
      rent_payment_id: input.rentPaymentId,
      owner_id: input.ownerId,
      tenant_id: input.tenantId,
      collection_session_id: input.collectionSessionId,
    },
  };

  if (input.customerName || input.customerEmail || input.customerContact) {
    payload.customer = {
      name: input.customerName ?? undefined,
      email: input.customerEmail ?? undefined,
      contact: input.customerContact ?? undefined,
    };
  }

  return razorpayRequest<RazorpayPaymentLink>(
    "POST",
    "/payment_links",
    payload
  );
}
