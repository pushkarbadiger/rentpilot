import type { PaymentMethod, PaymentStatus, RentPayment } from "@/lib/types/domain";
import {
  getPaymentExpectedAmount,
  getPaymentOutstandingAmount,
} from "../metrics";

const AMOUNT_TOLERANCE = 0.005;

export type ReconciliationComputeResult =
  | { kind: "update"; fields: ReconciledPaymentFields }
  | { kind: "already_settled" }
  | { kind: "overpayment" };

export interface ReconciledPaymentFields {
  status: PaymentStatus;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
}

function centsToMajor(minorUnits: number): number {
  return minorUnits / 100;
}

function amountsMatch(a: number, b: number): boolean {
  return Math.abs(a - b) < AMOUNT_TOLERANCE;
}

/**
 * Pure reconciliation math using existing domain helpers.
 * Does not mutate inputs. Provider-agnostic — payment method is supplied by caller.
 */
export function computeReconciledPaymentFields(
  payment: RentPayment,
  tenantMonthlyRent: number,
  receivedMinor: number,
  paymentDateKey: string,
  paymentMethod: PaymentMethod = "card"
): ReconciliationComputeResult {
  if (receivedMinor <= 0) {
    return { kind: "overpayment" };
  }

  const outstandingMinor = Math.round(
    getPaymentOutstandingAmount(payment, tenantMonthlyRent) * 100
  );

  if (outstandingMinor <= 0) {
    return { kind: "already_settled" };
  }

  if (receivedMinor > outstandingMinor) {
    return { kind: "overpayment" };
  }

  const expectedMinor = Math.round(
    getPaymentExpectedAmount(payment, tenantMonthlyRent) * 100
  );

  if (payment.status === "partial") {
    const collectedMinor = Math.round(payment.amount * 100);
    const newCollectedMinor = collectedMinor + receivedMinor;

    if (newCollectedMinor >= expectedMinor) {
      return {
        kind: "update",
        fields: {
          status: "paid",
          amount: centsToMajor(newCollectedMinor),
          payment_date: paymentDateKey,
          payment_method: paymentMethod,
        },
      };
    }

    return {
      kind: "update",
      fields: {
        status: "partial",
        amount: centsToMajor(newCollectedMinor),
        payment_date: paymentDateKey,
        payment_method: paymentMethod,
      },
    };
  }

  if (receivedMinor >= outstandingMinor) {
    return {
      kind: "update",
      fields: {
        status: "paid",
        amount: payment.amount,
        payment_date: paymentDateKey,
        payment_method: paymentMethod,
      },
    };
  }

  return {
    kind: "update",
    fields: {
      status: "partial",
      amount: centsToMajor(receivedMinor),
      payment_date: paymentDateKey,
      payment_method: paymentMethod,
    },
  };
}

/** True when the payment row already reflects an expected reconciliation outcome. */
export function paymentReflectsReconciliation(
  payment: RentPayment,
  expected: ReconciledPaymentFields
): boolean {
  if (payment.status !== expected.status) return false;
  if (!amountsMatch(payment.amount, expected.amount)) return false;
  if (payment.payment_method !== expected.payment_method) return false;
  if (expected.status === "paid" || expected.status === "partial") {
    return payment.payment_date === expected.payment_date;
  }
  return true;
}

export function isPermanentReconciliationFailure(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith("permanent:");
}

export function permanentReconciliationFailure(message: string): Error {
  return new Error(`permanent:${message}`);
}
