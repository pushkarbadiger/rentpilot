import type { PaymentStatus, RentPayment } from "@/lib/types/domain";

/**
 * Returns a YYYY-MM-DD key for a Date using the local timezone.
 * Payment due dates are stored as date-only strings; comparing keys
 * avoids UTC midnight boundary surprises.
 */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Normalizes a due_date value to a YYYY-MM-DD comparison key. */
export function toDueDateKey(dueDate: string): string {
  return dueDate.slice(0, 10);
}

/** True when the due date is strictly before today (local calendar). */
export function isPaymentOverdue(
  dueDate: string,
  referenceDate: Date = new Date()
): boolean {
  return toDueDateKey(dueDate) < toLocalDateKey(referenceDate);
}

/**
 * Derives the display/metrics status for a payment without mutating the DB.
 *
 * Rules:
 * - paid → paid
 * - stored late → late
 * - pending + overdue → late
 * - partial + overdue → late (still partially paid; outstanding handled separately)
 * - partial + not overdue → partial
 * - pending + due today or future → pending
 */
export function getEffectivePaymentStatus(
  payment: RentPayment,
  referenceDate: Date = new Date()
): PaymentStatus {
  if (payment.status === "paid") return "paid";
  if (payment.status === "late") return "late";

  const overdue = isPaymentOverdue(payment.due_date, referenceDate);

  if (payment.status === "partial") {
    return overdue ? "late" : "partial";
  }

  if (payment.status === "pending") {
    return overdue ? "late" : "pending";
  }

  return payment.status;
}

/** True when the payment still has an outstanding balance. */
export function isPaymentOpen(
  payment: RentPayment,
  referenceDate: Date = new Date()
): boolean {
  const status = getEffectivePaymentStatus(payment, referenceDate);
  return status !== "paid";
}
