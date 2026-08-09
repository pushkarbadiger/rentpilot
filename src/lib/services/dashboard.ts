import type { DashboardStats } from "@/lib/types/domain";
import { listProperties } from "./properties";
import { listTenants } from "./tenants";
import { listRentPayments } from "./rent-payments";
import type { ServiceResult } from "./properties";

export async function getDashboardStats(): Promise<
  ServiceResult<DashboardStats>
> {
  const [propertiesResult, tenantsResult, paymentsResult] = await Promise.all([
    listProperties(),
    listTenants(),
    listRentPayments(),
  ]);

  if (propertiesResult.error) {
    return { data: null, error: propertiesResult.error };
  }
  if (tenantsResult.error) {
    return { data: null, error: tenantsResult.error };
  }
  if (paymentsResult.error) {
    return { data: null, error: paymentsResult.error };
  }

  const properties = propertiesResult.data ?? [];
  const tenants = tenantsResult.data ?? [];
  const payments = paymentsResult.data ?? [];

  const totalUnits = properties.reduce((sum, p) => sum + (p.units || 0), 0);
  const occupiedUnits = tenants.filter((t) => t.status === "active").length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const paymentsThisMonth = payments.filter((p) => {
    const due = new Date(p.due_date);
    return due.getMonth() === currentMonth && due.getFullYear() === currentYear;
  });

  const monthlyRent = tenants
    .filter((t) => t.status === "active")
    .reduce((sum, t) => sum + (t.monthly_rent || 0), 0);

  const rentCollected = paymentsThisMonth
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const outstandingRent = paymentsThisMonth
    .filter((p) => p.status === "pending" || p.status === "late" || p.status === "partial")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const latePayments = payments.filter((p) => p.status === "late").length;

  const stats: DashboardStats = {
    totalProperties: properties.length,
    totalUnits,
    occupiedUnits,
    vacantUnits: Math.max(totalUnits - occupiedUnits, 0),
    monthlyRent,
    rentCollected,
    outstandingRent,
    latePayments,
  };

  return { data: stats, error: null };
}
