import type { RentPayment } from "@/lib/types/domain";
import {
  computeReconciledPaymentFields,
  type ReconciledPaymentFields,
} from "./reconciliation";

/** @internal Legacy Stripe reconciliation self-check (scenarios A–J). */
export function verifyStripeReconciliationLogic(): string[] {
  const errors: string[] = [];
  const date = "2026-08-13";

  function assert(label: string, condition: boolean) {
    if (!condition) errors.push(label);
  }

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
    "A pending full",
    computeReconciledPaymentFields(pendingPayment, rent, 100000, date).kind ===
      "update" &&
      (
        computeReconciledPaymentFields(
          pendingPayment,
          rent,
          100000,
          date
        ) as { fields: ReconciledPaymentFields }
      ).fields.status === "paid"
  );

  assert(
    "B pending partial",
    (
      computeReconciledPaymentFields(
        pendingPayment,
        rent,
        50000,
        date
      ) as { fields: ReconciledPaymentFields }
    ).fields.status === "partial" &&
      (
        computeReconciledPaymentFields(
          pendingPayment,
          rent,
          50000,
          date
        ) as { fields: ReconciledPaymentFields }
      ).fields.amount === 500
  );

  assert(
    "C late full",
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
    "D late partial",
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
    "E partial remainder",
    (
      computeReconciledPaymentFields(
        partialPayment,
        rent,
        60000,
        date
      ) as { fields: ReconciledPaymentFields }
    ).fields.status === "paid" &&
      (
        computeReconciledPaymentFields(
          partialPayment,
          rent,
          60000,
          date
        ) as { fields: ReconciledPaymentFields }
      ).fields.amount === 1000
  );

  assert(
    "F already paid",
    computeReconciledPaymentFields(paidPayment, rent, 100000, date).kind ===
      "already_settled"
  );

  assert(
    "I overpayment",
    computeReconciledPaymentFields(pendingPayment, rent, 100001, date).kind ===
      "overpayment"
  );

  assert(
    "J partial overpayment",
    computeReconciledPaymentFields(partialPayment, rent, 70000, date).kind ===
      "overpayment"
  );

  return errors;
}
