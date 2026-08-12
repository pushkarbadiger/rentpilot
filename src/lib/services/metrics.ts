import type { Property, RentPayment, Tenant } from "@/lib/types/domain";
import {
  getEffectivePaymentStatus,
} from "./payment-status";

/** Rent collection metrics for a single calendar month. */
export interface RentMonthMetrics {
  /** Total rent expected from payment records due this month. */
  expectedRent: number;
  rentCollected: number;
  outstandingRent: number;
  /** Late payment records due in the current month (effective status). */
  latePayments: number;
}

export interface PortfolioMetrics extends RentMonthMetrics {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  /** Sum of monthly_rent for all active tenants. */
  monthlyRent: number;
}

/**
 * Counts active tenants assigned to a property as occupied units.
 *
 * LIMITATION: The schema has no per-unit occupancy tracking. Each active
 * tenant with a property_id counts as one occupied unit; unassigned active
 * tenants are excluded. Multiple tenants at one property each add to the
 * count. The result is capped at totalUnits.
 */
export function calculateOccupiedUnits(
  tenants: Tenant[],
  totalUnits: number
): number {
  const count = tenants.filter(
    (t) => t.status === "active" && t.property_id
  ).length;
  return Math.min(count, totalUnits);
}

/**
 * Returns the outstanding balance for a payment record.
 * Uses effective status for paid detection; partial math is unchanged.
 */
export function getPaymentOutstandingAmount(
  payment: RentPayment,
  tenantMonthlyRent?: number,
  referenceDate: Date = new Date()
): number {
  const effective = getEffectivePaymentStatus(payment, referenceDate);
  if (effective === "paid") return 0;

  if (payment.status === "partial") {
    const expected = tenantMonthlyRent ?? payment.amount;
    return Math.max(expected - payment.amount, 0);
  }

  return payment.amount;
}

/** Amount collected toward a payment (paid in full or partial received). */
export function getPaymentCollectedAmount(payment: RentPayment): number {
  if (payment.status === "paid" || payment.status === "partial") {
    return payment.amount;
  }
  return 0;
}

/**
 * Expected rent for a single payment record due this month.
 * Uses tenant monthly rent when available; otherwise falls back to amount.
 */
export function getPaymentExpectedAmount(
  payment: RentPayment,
  tenantMonthlyRent?: number
): number {
  return tenantMonthlyRent ?? payment.amount;
}

export function isPaymentDueInMonth(
  payment: RentPayment,
  referenceDate: Date
): boolean {
  const dueKey = payment.due_date.slice(0, 7);
  const refKey = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;
  return dueKey === refKey;
}

export function isPaymentLate(
  payment: RentPayment,
  referenceDate: Date = new Date()
): boolean {
  return getEffectivePaymentStatus(payment, referenceDate) === "late";
}

/** True when the payment still has an outstanding balance. */
export function isPaymentOpen(
  payment: RentPayment,
  referenceDate: Date = new Date()
): boolean {
  return getEffectivePaymentStatus(payment, referenceDate) !== "paid";
}

/** Matches stored or effective status against a filter value. */
export function paymentMatchesStatusFilter(
  payment: RentPayment,
  filter: string | undefined,
  referenceDate: Date = new Date()
): boolean {
  if (!filter) return true;
  const effective = getEffectivePaymentStatus(payment, referenceDate);
  if (filter === "late") {
    return effective === "late";
  }
  if (filter === "open") {
    return isPaymentOpen(payment, referenceDate);
  }
  return payment.status === filter || effective === filter;
}

export function isPaymentDueInMonthFilter(
  payment: RentPayment,
  month: string | undefined
): boolean {
  if (!month) return true;
  return payment.due_date.slice(0, 7) === month;
}

export function calculateRentMonthMetrics(
  payments: RentPayment[],
  tenants: Tenant[],
  referenceDate: Date = new Date()
): RentMonthMetrics {
  const tenantRentById = new Map(
    tenants.map((t) => [t.id, t.monthly_rent] as const)
  );

  const paymentsThisMonth = payments.filter((p) =>
    isPaymentDueInMonth(p, referenceDate)
  );

  const expectedRent = paymentsThisMonth.reduce(
    (sum, p) =>
      sum + getPaymentExpectedAmount(p, tenantRentById.get(p.tenant_id)),
    0
  );

  const rentCollected = paymentsThisMonth.reduce(
    (sum, p) => sum + getPaymentCollectedAmount(p),
    0
  );

  const outstandingRent = paymentsThisMonth.reduce(
    (sum, p) =>
      sum +
      getPaymentOutstandingAmount(
        p,
        tenantRentById.get(p.tenant_id),
        referenceDate
      ),
    0
  );

  const latePayments = paymentsThisMonth.filter((p) =>
    isPaymentLate(p, referenceDate)
  ).length;

  return { expectedRent, rentCollected, outstandingRent, latePayments };
}

export function calculatePortfolioMetrics(
  properties: Property[],
  tenants: Tenant[],
  payments: RentPayment[],
  referenceDate: Date = new Date()
): PortfolioMetrics {
  const totalUnits = properties.reduce((sum, p) => sum + (p.units || 0), 0);
  const occupiedUnits = calculateOccupiedUnits(tenants, totalUnits);

  const monthlyRent = tenants
    .filter((t) => t.status === "active")
    .reduce((sum, t) => sum + (t.monthly_rent || 0), 0);

  const rentMonth = calculateRentMonthMetrics(
    payments,
    tenants,
    referenceDate
  );

  return {
    totalProperties: properties.length,
    totalUnits,
    occupiedUnits,
    vacantUnits: Math.max(totalUnits - occupiedUnits, 0),
    monthlyRent,
    ...rentMonth,
  };
}

export { getEffectivePaymentStatus, isPaymentOverdue } from "./payment-status";
