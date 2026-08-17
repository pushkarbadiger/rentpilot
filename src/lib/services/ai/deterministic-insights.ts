import type { Property, RentPayment, Tenant } from "@/lib/types/domain";
import {
  getEffectivePaymentStatus,
} from "@/lib/services/payment-status";
import {
  getPaymentOutstandingAmount,
} from "@/lib/services/metrics";

export interface DeterministicInsight {
  type:
    | "overdue_payment"
    | "vacancy"
    | "low_collection"
    | "high_performer"
    | "partial_payment";
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  amount?: number;
  tenantId?: string;
  tenantName?: string;
  propertyId?: string;
  propertyName?: string;
  paymentId?: string;
  link?: string;
}

function daysBetween(date1: Date, date2: Date): number {
  const diff = date1.getTime() - date2.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function calculateDeterministicInsights(
  properties: Property[],
  tenants: Tenant[],
  payments: RentPayment[],
  referenceDate: Date = new Date()
): DeterministicInsight[] {
  const insights: DeterministicInsight[] = [];
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const activeTenants = tenants.filter((t) => t.status === "active");
  const tenantRentById = new Map(
    tenants.map((t) => [t.id, t.monthly_rent] as const)
  );

  const overduePayments = payments
    .filter((p) => getEffectivePaymentStatus(p, referenceDate) === "late")
    .sort(
      (a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

  for (const payment of overduePayments.slice(0, 5)) {
    const daysOverdue = daysBetween(
      today,
      new Date(payment.due_date + "T00:00:00")
    );
    const outstanding = getPaymentOutstandingAmount(
      payment,
      tenantRentById.get(payment.tenant_id),
      referenceDate
    );
    insights.push({
      type: "overdue_payment",
      severity: daysOverdue > 30 ? "high" : daysOverdue > 7 ? "medium" : "low",
      title: `${payment.tenant?.full_name ?? "Tenant"} — ${daysOverdue} days overdue`,
      detail: `${payment.property?.name ?? "Property"}: ₹${outstanding.toLocaleString("en-IN")} outstanding since ${payment.due_date}`,
      amount: outstanding,
      tenantId: payment.tenant_id,
      tenantName: payment.tenant?.full_name ?? undefined,
      propertyId: payment.property_id,
      propertyName: payment.property?.name ?? undefined,
      paymentId: payment.id,
      link: `/dashboard/rent/${payment.id}`,
    });
  }

  for (const property of properties) {
    if (property.status !== "active") continue;
    const propTenants = activeTenants.filter(
      (t) => t.property_id === property.id
    );
    const propOccupied = Math.min(propTenants.length, property.units || 0);
    const propVacant = Math.max((property.units || 0) - propOccupied, 0);

    if (propVacant > 0) {
      const vacancyRate =
        property.units > 0
          ? Math.round((propVacant / property.units) * 100)
          : 0;
      insights.push({
        type: "vacancy",
        severity: vacancyRate > 50 ? "high" : vacancyRate > 25 ? "medium" : "low",
        title: `${property.name} — ${propVacant} vacant unit${propVacant === 1 ? "" : "s"}`,
        detail: `${propOccupied} of ${property.units} units occupied (${100 - vacancyRate}% occupancy)`,
        propertyId: property.id,
        propertyName: property.name,
        link: `/dashboard/properties/${property.id}`,
      });
    }
  }

  const partialPayments = payments.filter((p) => {
    const effective = getEffectivePaymentStatus(p, referenceDate);
    return effective === "partial";
  });

  for (const payment of partialPayments.slice(0, 3)) {
    const tenantRent = tenantRentById.get(payment.tenant_id);
    const outstanding = getPaymentOutstandingAmount(
      payment,
      tenantRent,
      referenceDate
    );
    if (outstanding > 0) {
      insights.push({
        type: "partial_payment",
        severity: "medium",
        title: `${payment.tenant?.full_name ?? "Tenant"} — partial payment`,
        detail: `Paid ₹${payment.amount.toLocaleString("en-IN")} of ₹${(tenantRent ?? payment.amount).toLocaleString("en-IN")}. ₹${outstanding.toLocaleString("en-IN")} remaining.`,
        amount: outstanding,
        tenantId: payment.tenant_id,
        tenantName: payment.tenant?.full_name ?? undefined,
        propertyId: payment.property_id,
        propertyName: payment.property?.name ?? undefined,
        paymentId: payment.id,
        link: `/dashboard/rent/${payment.id}`,
      });
    }
  }

  const propertyCollectionRates = properties
    .filter((p) => p.status === "active")
    .map((property) => {
      const propTenants = activeTenants.filter(
        (t) => t.property_id === property.id
      );
      const propMonthlyRent = propTenants.reduce(
        (sum, t) => sum + (t.monthly_rent || 0),
        0
      );
      const propPayments = payments.filter(
        (p) => p.property_id === property.id
      );
      let propCollected = 0;
      for (const payment of propPayments) {
        if (
          getEffectivePaymentStatus(payment, referenceDate) === "paid"
        ) {
          propCollected += payment.amount;
        }
      }
      return {
        property,
        monthlyRent: propMonthlyRent,
        collected: propCollected,
        rate:
          propMonthlyRent > 0
            ? Math.round((propCollected / propMonthlyRent) * 100)
            : 0,
      };
    })
    .filter((p) => p.monthlyRent > 0);

  if (propertyCollectionRates.length > 0) {
    const best = propertyCollectionRates.reduce((a, b) =>
      a.rate > b.rate ? a : b
    );
    if (best.rate >= 80 && propertyCollectionRates.length > 1) {
      insights.push({
        type: "high_performer",
        severity: "low",
        title: `${best.property.name} — best collection rate`,
        detail: `${best.rate}% collection rate, ₹${best.collected.toLocaleString("en-IN")} collected of ₹${best.monthlyRent.toLocaleString("en-IN")} expected.`,
        propertyId: best.property.id,
        propertyName: best.property.name,
        link: `/dashboard/properties/${best.property.id}`,
      });
    }

    const worst = propertyCollectionRates.reduce((a, b) =>
      a.rate < b.rate ? a : b
    );
    if (worst.rate < 60 && worst.monthlyRent > 0) {
      insights.push({
        type: "low_collection",
        severity: "high",
        title: `${worst.property.name} — low collection rate`,
        detail: `Only ${worst.rate}% collected. ₹${worst.collected.toLocaleString("en-IN")} of ₹${worst.monthlyRent.toLocaleString("en-IN")} expected.`,
        propertyId: worst.property.id,
        propertyName: worst.property.name,
        link: `/dashboard/properties/${worst.property.id}`,
      });
    }
  }

  insights.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return insights;
}
