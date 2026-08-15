import { createClient } from "@/lib/supabase/server";
import { demoRentPayments } from "@/lib/demo-data";
import type { RentPayment, Tenant } from "@/lib/types/domain";
import { getCurrentUser } from "./auth";
import { validatePropertyOwnership } from "./entity-validation";
import type { ServiceResult } from "./properties";
import { listProperties } from "./properties";
import { listTenants } from "./tenants";

const BILLING_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface RecurringRentPreview {
  billingMonth: string;
  eligible: number;
  existing: number;
  toCreate: number;
}

export interface RecurringRentGenerationResult {
  billingMonth: string;
  eligible: number;
  created: number;
  skippedExisting: number;
}

/** Validates and normalizes a YYYY-MM billing month string. */
export function parseBillingMonth(month: string): string | null {
  const trimmed = month.trim();
  return BILLING_MONTH_PATTERN.test(trimmed) ? trimmed : null;
}

/** Returns the current calendar month as YYYY-MM (local time). */
export function getCurrentBillingMonth(referenceDate = new Date()): string {
  return `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;
}

/** True when billingMonth is after the current calendar month. */
export function isBillingMonthInFuture(
  billingMonth: string,
  referenceDate = new Date()
): boolean {
  return billingMonth > getCurrentBillingMonth(referenceDate);
}

/** Due date for generated rent: first day of the billing month. */
export function billingMonthDueDate(billingMonth: string): string {
  return `${billingMonth}-01`;
}

/**
 * Whether an active tenant should receive a generated rent record for the month.
 * Respects lease_start / lease_end month boundaries when present.
 */
export function isTenantEligibleForBillingMonth(
  tenant: Tenant,
  billingMonth: string,
  activePropertyIds?: Set<string>
): boolean {
  if (tenant.status !== "active") return false;
  if (!tenant.property_id) return false;
  if (tenant.monthly_rent <= 0) return false;
  if (activePropertyIds && !activePropertyIds.has(tenant.property_id)) return false;

  if (tenant.lease_start) {
    const startMonth = tenant.lease_start.slice(0, 7);
    if (billingMonth < startMonth) return false;
  }

  if (tenant.lease_end) {
    const endMonth = tenant.lease_end.slice(0, 7);
    if (billingMonth > endMonth) return false;
  }

  return true;
}

/** Whether a payment record already covers the billing month for tenant + property. */
export function paymentMatchesBillingMonth(
  payment: Pick<RentPayment, "tenant_id" | "property_id" | "due_date" | "billing_month">,
  tenantId: string,
  propertyId: string,
  billingMonth: string
): boolean {
  if (payment.tenant_id !== tenantId || payment.property_id !== propertyId) {
    return false;
  }
  if (payment.billing_month) {
    return payment.billing_month === billingMonth;
  }
  return payment.due_date.slice(0, 7) === billingMonth;
}

function validateBillingMonthInput(billingMonth: string): string | null {
  const parsed = parseBillingMonth(billingMonth);
  if (!parsed) return "Select a valid billing month.";
  if (isBillingMonthInFuture(parsed)) {
    return "Cannot generate rent for a future month.";
  }
  return null;
}

interface EligibleTenant {
  tenant: Tenant;
  propertyId: string;
}

async function resolveEligibleTenants(
  ownerId: string,
  billingMonth: string,
  isDemo: boolean
): Promise<ServiceResult<EligibleTenant[]>> {
  const [tenantsResult, propertiesResult] = await Promise.all([
    listTenants(),
    listProperties(),
  ]);

  if (tenantsResult.error || !tenantsResult.data) {
    return { data: null, error: tenantsResult.error ?? "Could not load tenants." };
  }
  if (propertiesResult.error || !propertiesResult.data) {
    return { data: null, error: propertiesResult.error ?? "Could not load properties." };
  }

  const activePropertyIds = new Set(
    propertiesResult.data
      .filter((p) => p.status === "active")
      .map((p) => p.id)
  );

  const eligible: EligibleTenant[] = [];

  for (const tenant of tenantsResult.data) {
    if (!isTenantEligibleForBillingMonth(tenant, billingMonth, activePropertyIds)) {
      continue;
    }

    const propertyId = tenant.property_id!;
    const propertyError = await validatePropertyOwnership(
      ownerId,
      propertyId,
      isDemo
    );
    if (propertyError) continue;

    eligible.push({ tenant, propertyId });
  }

  return { data: eligible, error: null };
}

function countExistingForMonth(
  payments: Pick<RentPayment, "tenant_id" | "property_id" | "due_date" | "billing_month">[],
  eligible: EligibleTenant[],
  billingMonth: string
): number {
  return eligible.filter(({ tenant, propertyId }) =>
    payments.some((p) =>
      paymentMatchesBillingMonth(p, tenant.id, propertyId, billingMonth)
    )
  ).length;
}

export async function previewRecurringRentGeneration(
  billingMonth: string
): Promise<ServiceResult<RecurringRentPreview>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const monthError = validateBillingMonthInput(billingMonth);
  if (monthError) return { data: null, error: monthError };

  const parsedMonth = parseBillingMonth(billingMonth)!;

  if (user.isDemo) {
    const eligibleResult = await resolveEligibleTenants(
      user.id,
      parsedMonth,
      true
    );
    if (eligibleResult.error || !eligibleResult.data) {
      return { data: null, error: eligibleResult.error ?? "Could not evaluate tenants." };
    }

    const existing = countExistingForMonth(
      demoRentPayments,
      eligibleResult.data,
      parsedMonth
    );
    const eligible = eligibleResult.data.length;

    return {
      data: {
        billingMonth: parsedMonth,
        eligible,
        existing,
        toCreate: Math.max(eligible - existing, 0),
      },
      error: null,
    };
  }

  const eligibleResult = await resolveEligibleTenants(
    user.id,
    parsedMonth,
    false
  );
  if (eligibleResult.error || !eligibleResult.data) {
    return { data: null, error: eligibleResult.error ?? "Could not evaluate tenants." };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const [year, month] = parsedMonth.split("-").map(Number);
  const start = `${parsedMonth}-01`;
  const endDay = new Date(year, month, 0).getDate();
  const end = `${parsedMonth}-${String(endDay).padStart(2, "0")}`;

  const { data: payments, error } = await supabase
    .from("rent_payments")
    .select("tenant_id, property_id, due_date, billing_month")
    .eq("owner_id", user.id)
    .or(`billing_month.eq.${parsedMonth},and(due_date.gte.${start},due_date.lte.${end})`);

  if (error) {
    console.error("[recurring-rent] preview fetch failed", error.message);
    return { data: null, error: "Could not preview rent generation. Please try again." };
  }

  const existing = countExistingForMonth(
    (payments ?? []) as Pick<RentPayment, "tenant_id" | "property_id" | "due_date" | "billing_month">[],
    eligibleResult.data,
    parsedMonth
  );
  const eligible = eligibleResult.data.length;

  return {
    data: {
      billingMonth: parsedMonth,
      eligible,
      existing,
      toCreate: Math.max(eligible - existing, 0),
    },
    error: null,
  };
}

export async function generateRecurringRentForMonth(
  billingMonth: string
): Promise<ServiceResult<RecurringRentGenerationResult>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const monthError = validateBillingMonthInput(billingMonth);
  if (monthError) return { data: null, error: monthError };

  const parsedMonth = parseBillingMonth(billingMonth)!;

  const eligibleResult = await resolveEligibleTenants(
    user.id,
    parsedMonth,
    user.isDemo
  );
  if (eligibleResult.error || !eligibleResult.data) {
    return { data: null, error: eligibleResult.error ?? "Could not evaluate tenants." };
  }

  const eligible = eligibleResult.data;

  if (user.isDemo) {
    const existing = countExistingForMonth(demoRentPayments, eligible, parsedMonth);
    const toCreate = Math.max(eligible.length - existing, 0);
    return {
      data: {
        billingMonth: parsedMonth,
        eligible: eligible.length,
        created: toCreate,
        skippedExisting: existing,
      },
      error: null,
    };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { data: null, error: "Not authenticated" };
  }

  if (eligible.length === 0) {
    return {
      data: {
        billingMonth: parsedMonth,
        eligible: 0,
        created: 0,
        skippedExisting: 0,
      },
      error: null,
    };
  }

  const rows = eligible.map(({ tenant, propertyId }) => ({
    owner_id: authUser.id,
    tenant_id: tenant.id,
    property_id: propertyId,
    amount: tenant.monthly_rent,
    due_date: billingMonthDueDate(parsedMonth),
    billing_month: parsedMonth,
    status: "pending" as const,
    payment_date: null,
    payment_method: null,
    notes: null,
  }));

  const { data, error } = await supabase
    .from("rent_payments")
    .upsert(rows, {
      onConflict: "owner_id,tenant_id,property_id,billing_month",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    console.error("[recurring-rent] generate failed", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return {
      data: null,
      error: "Could not generate rent records. Please try again.",
    };
  }

  const created = data?.length ?? 0;
  const skippedExisting = eligible.length - created;

  return {
    data: {
      billingMonth: parsedMonth,
      eligible: eligible.length,
      created,
      skippedExisting,
    },
    error: null,
  };
}
