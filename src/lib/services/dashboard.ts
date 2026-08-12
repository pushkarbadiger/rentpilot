import type { DashboardStats } from "@/lib/types/domain";
import {
  calculatePortfolioMetrics,
  calculateRentMonthMetrics,
  type RentMonthMetrics,
} from "./metrics";
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

  const metrics = calculatePortfolioMetrics(
    propertiesResult.data ?? [],
    tenantsResult.data ?? [],
    paymentsResult.data ?? []
  );

  const stats: DashboardStats = {
    totalProperties: metrics.totalProperties,
    totalUnits: metrics.totalUnits,
    occupiedUnits: metrics.occupiedUnits,
    vacantUnits: metrics.vacantUnits,
    monthlyRent: metrics.monthlyRent,
    rentCollected: metrics.rentCollected,
    outstandingRent: metrics.outstandingRent,
    latePayments: metrics.latePayments,
  };

  return { data: stats, error: null };
}

/** Shared rent-month metrics for the rent tracking page. */
export async function getRentMonthMetrics(): Promise<
  ServiceResult<RentMonthMetrics>
> {
  const [tenantsResult, paymentsResult] = await Promise.all([
    listTenants(),
    listRentPayments(),
  ]);

  if (tenantsResult.error) {
    return { data: null, error: tenantsResult.error };
  }
  if (paymentsResult.error) {
    return { data: null, error: paymentsResult.error };
  }

  return {
    data: calculateRentMonthMetrics(
      paymentsResult.data ?? [],
      tenantsResult.data ?? []
    ),
    error: null,
  };
}
