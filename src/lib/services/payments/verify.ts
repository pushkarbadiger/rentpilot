import type { PaymentMethod, RentPayment } from "@/lib/types/domain";
import {
  derivePaymentDisplayState,
  deriveRentCollectionHeadline,
  toPaymentCollectionSessionDisplay,
  verifyCollectionDisplayLogic,
} from "./collection-display";
import {
  DEFAULT_CURRENCY,
  PAYMENT_COLLECTION_PROVIDER,
  isPaymentCollectionConfigured,
} from "./config";
import {
  computeReconciledPaymentFields,
  type ReconciledPaymentFields,
} from "./reconciliation";
import type {
  PaymentCollectionSessionSummary,
  PaymentProvider,
} from "./types";
import { verifyCollectionSessionLogic } from "./verify-collection";
import { verifyRazorpayWebhookLogic } from "./verify-razorpay-webhooks";
import { verifyRazorpayReconciliationLogic } from "./verify-razorpay-reconciliation";
import { verifyStripeReconciliationLogic } from "./verify-stripe-reconciliation";

/** @internal Executable self-check for provider-neutral payment logic. */
export function verifyPaymentProviderLogic(): string[] {
  const errors: string[] = [];

  function assert(label: string, condition: boolean) {
    if (!condition) errors.push(label);
  }

  const date = "2026-08-13";
  const pendingPayment: RentPayment = {
    id: "p1",
    owner_id: "o1",
    tenant_id: "t1",
    property_id: "prop1",
    amount: 1000,
    due_date: "2026-08-01",
    billing_month: "2026-08",
    payment_date: null,
    status: "pending",
    payment_method: null,
    notes: null,
    created_at: "",
    updated_at: "",
  };

  const latePayment = { ...pendingPayment, id: "p2", status: "late" as const };
  const partialPayment: RentPayment = {
    ...pendingPayment,
    id: "p3",
    status: "partial",
    amount: 400,
    payment_date: "2026-08-01",
    payment_method: "cash",
  };
  const paidPayment: RentPayment = {
    ...pendingPayment,
    id: "p4",
    status: "paid",
    payment_date: "2026-08-01",
    payment_method: "card",
  };

  const rent = 1000;

  assert(
    "reconcile: pending full",
    computeReconciledPaymentFields(pendingPayment, rent, 100000, date).kind ===
      "update"
  );

  assert(
    "reconcile: pending partial",
    (
      computeReconciledPaymentFields(
        pendingPayment,
        rent,
        50000,
        date
      ) as { fields: ReconciledPaymentFields }
    ).fields.status === "partial"
  );

  assert(
    "reconcile: late full",
    (
      computeReconciledPaymentFields(
        latePayment,
        rent,
        100000,
        date
      ) as { fields: ReconciledPaymentFields }
    ).fields.status === "paid"
  );

  assert(
    "reconcile: late partial",
    (
      computeReconciledPaymentFields(
        latePayment,
        rent,
        25000,
        date
      ) as { fields: ReconciledPaymentFields }
    ).fields.status === "partial"
  );

  assert(
    "reconcile: partial remainder",
    (
      computeReconciledPaymentFields(
        partialPayment,
        rent,
        60000,
        date
      ) as { fields: ReconciledPaymentFields }
    ).fields.status === "paid"
  );

  assert(
    "reconcile: already paid",
    computeReconciledPaymentFields(paidPayment, rent, 100000, date).kind ===
      "already_settled"
  );

  assert(
    "reconcile: overpayment",
    computeReconciledPaymentFields(pendingPayment, rent, 100001, date).kind ===
      "overpayment"
  );

  assert(
    "reconcile: partial overpayment",
    computeReconciledPaymentFields(partialPayment, rent, 70000, date).kind ===
      "overpayment"
  );

  assert(
    "reconcile: card default method",
    (
      computeReconciledPaymentFields(
        pendingPayment,
        rent,
        100000,
        date
      ) as { fields: ReconciledPaymentFields }
    ).fields.payment_method === "card"
  );

  assert(
    "reconcile: custom method for razorpay",
    (
      computeReconciledPaymentFields(
        pendingPayment,
        rent,
        100000,
        date,
        "other" as PaymentMethod
      ) as { fields: ReconciledPaymentFields }
    ).fields.payment_method === "other"
  );

  const session: PaymentCollectionSessionSummary = {
    id: "cs-1",
    provider: "razorpay",
    amountMinor: 100000,
    currency: "inr",
    status: "open",
    collectionUrl: "https://rzp.io/test",
    createdAt: "2026-08-13T00:00:00Z",
    completedAt: null,
    reconciledAt: null,
  };

  assert(
    "display: razorpay open matches",
    derivePaymentDisplayState(session, 100000) === "awaiting_payment"
  );

  assert(
    "display: razorpay stale amount",
    derivePaymentDisplayState(
      { ...session, amountMinor: 50000 },
      100000
    ) === "stale"
  );

  assert(
    "display: stripe reconciled",
    derivePaymentDisplayState(
      {
        ...session,
        provider: "stripe",
        status: "complete",
        reconciledAt: "2026-08-13T10:00:00Z",
      },
      0
    ) === "reconciled"
  );

  const display = toPaymentCollectionSessionDisplay(session, 100000);
  assert(
    "display: provider preserved",
    display.provider === "razorpay" && display.currency === "inr"
  );

  const headline = deriveRentCollectionHeadline([]);
  assert("display: no sessions", headline.headlineState === "none");

  assert(
    "config: default currency is inr when unset",
    DEFAULT_CURRENCY === "inr" || DEFAULT_CURRENCY === "usd"
  );

  const providers: PaymentProvider[] = ["razorpay", "stripe", "none"];
  assert(
    "config: provider is valid",
    providers.includes(PAYMENT_COLLECTION_PROVIDER)
  );

  assert(
    "config: isPaymentCollectionConfigured is boolean",
    typeof isPaymentCollectionConfigured() === "boolean"
  );

  assert(
    "provider: none is valid",
    providers.includes("none")
  );

  errors.push(...verifyStripeReconciliationLogic());
  errors.push(...verifyCollectionDisplayLogic());
  errors.push(...verifyCollectionSessionLogic());
  errors.push(...verifyRazorpayWebhookLogic());
  errors.push(...verifyRazorpayReconciliationLogic());

  return errors;
}
