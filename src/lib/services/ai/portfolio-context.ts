import type { Property, RentPayment, Tenant } from "@/lib/types/domain";
import {
  getEffectivePaymentStatus,
} from "@/lib/services/payment-status";
import {
  getPaymentOutstandingAmount,
  getPaymentCollectedAmount,
  calculateOccupiedUnits,
  isPaymentDueInMonth,
} from "@/lib/services/metrics";

export interface PortfolioContext {
  asOf: string;
  portfolio: {
    totalProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
  };
  financials: {
    expectedRent: number;
    rentCollected: number;
    outstandingRent: number;
    overdueAmount: number;
    collectionRate: number;
  };
  tenants: {
    id: string;
    name: string;
    property: string;
    monthlyRent: number;
    status: string;
  }[];
  overduePayments: {
    tenantName: string;
    propertyName: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
    paymentId: string;
    tenantId: string;
    propertyId: string;
  }[];
  upcomingPayments: {
    tenantName: string;
    propertyName: string;
    amount: number;
    dueDate: string;
    paymentId: string;
    tenantId: string;
    propertyId: string;
  }[];
  propertyPerformance: {
    name: string;
    id: string;
    units: number;
    occupiedUnits: number;
    totalRent: number;
    collectedRent: number;
    outstandingRent: number;
    collectionRate: number;
  }[];
}

function daysBetween(date1: Date, date2: Date): number {
  const diff = date1.getTime() - date2.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function buildPortfolioContext(
  properties: Property[],
  tenants: Tenant[],
  payments: RentPayment[],
  referenceDate: Date = new Date()
): PortfolioContext {
  const totalUnits = properties.reduce((sum, p) => sum + (p.units || 0), 0);
  const occupiedUnits = calculateOccupiedUnits(tenants, totalUnits);
  const vacantUnits = Math.max(totalUnits - occupiedUnits, 0);
  const occupancyRate =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const activeTenants = tenants.filter((t) => t.status === "active");

  const tenantRentById = new Map(
    tenants.map((t) => [t.id, t.monthly_rent] as const)
  );

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  let expectedRent = 0;
  let rentCollected = 0;
  let outstandingRent = 0;
  let overdueAmount = 0;
  const overduePayments: PortfolioContext["overduePayments"] = [];
  const upcomingPayments: PortfolioContext["upcomingPayments"] = [];

  for (const payment of payments) {
    const effective = getEffectivePaymentStatus(payment, referenceDate);
    const tenantRent = tenantRentById.get(payment.tenant_id);
    const expected = tenantRent ?? payment.amount;
    const outstanding = getPaymentOutstandingAmount(
      payment,
      tenantRent,
      referenceDate
    );
    const collected = getPaymentCollectedAmount(payment);

    if (isPaymentDueInMonth(payment, referenceDate)) {
      expectedRent += expected;
      rentCollected += collected;
      outstandingRent += outstanding;
    }

    if (effective === "late") {
      overdueAmount += outstanding;
      const daysOverdue = daysBetween(
        today,
        new Date(payment.due_date + "T00:00:00")
      );
      overduePayments.push({
        tenantName: payment.tenant?.full_name ?? "Unknown",
        propertyName: payment.property?.name ?? "Unknown",
        amount: outstanding,
        dueDate: payment.due_date,
        daysOverdue,
        paymentId: payment.id,
        tenantId: payment.tenant_id,
        propertyId: payment.property_id,
      });
    }

    if (effective === "pending") {
      const due = new Date(payment.due_date + "T00:00:00");
      if (due >= today) {
        upcomingPayments.push({
          tenantName: payment.tenant?.full_name ?? "Unknown",
          propertyName: payment.property?.name ?? "Unknown",
          amount: payment.amount,
          dueDate: payment.due_date,
          paymentId: payment.id,
          tenantId: payment.tenant_id,
          propertyId: payment.property_id,
        });
      }
    }
  }

  overduePayments.sort((a, b) => b.daysOverdue - a.daysOverdue);
  upcomingPayments.sort(
    (a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const collectionRate =
    expectedRent > 0
      ? Math.round((rentCollected / expectedRent) * 100)
      : 0;

  const propertyPerformance: PortfolioContext["propertyPerformance"] = [];

  for (const property of properties) {
    const propTenants = activeTenants.filter(
      (t) => t.property_id === property.id
    );
    const propPayments = payments.filter(
      (p) => p.property_id === property.id
    );

    const propOccupiedUnits = Math.min(
      propTenants.length,
      property.units || 0
    );
    const propMonthlyRent = propTenants.reduce(
      (sum, t) => sum + (t.monthly_rent || 0),
      0
    );

    let propCollected = 0;
    let propOutstanding = 0;

    for (const payment of propPayments) {
      propCollected += getPaymentCollectedAmount(payment);
      propOutstanding += getPaymentOutstandingAmount(
        payment,
        tenantRentById.get(payment.tenant_id),
        referenceDate
      );
    }

    const propCollectionRate =
      propMonthlyRent > 0
        ? Math.round((propCollected / propMonthlyRent) * 100)
        : 0;

    propertyPerformance.push({
      name: property.name,
      id: property.id,
      units: property.units || 0,
      occupiedUnits: propOccupiedUnits,
      totalRent: propMonthlyRent,
      collectedRent: propCollected,
      outstandingRent: propOutstanding,
      collectionRate: propCollectionRate,
    });
  }

  return {
    asOf: referenceDate.toISOString().slice(0, 10),
    portfolio: {
      totalProperties: properties.length,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
    },
    financials: {
      expectedRent,
      rentCollected,
      outstandingRent,
      overdueAmount,
      collectionRate,
    },
    tenants: activeTenants.map((t) => ({
      id: t.id,
      name: t.full_name,
      property:
        properties.find((p) => p.id === t.property_id)?.name ?? "Unassigned",
      monthlyRent: t.monthly_rent,
      status: t.status,
    })),
    overduePayments,
    upcomingPayments,
    propertyPerformance,
  };
}
