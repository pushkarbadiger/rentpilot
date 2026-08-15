import { createClient } from "@/lib/supabase/server";
import { demoProperties, demoRentPayments, demoTenants } from "@/lib/demo-data";
import type { ListQuery, PaginatedResult } from "@/lib/list-query";
import { paginateArray, sortArray } from "@/lib/list-query";
import type { RentPayment, PaymentStatus } from "@/lib/types/domain";
import type { RentPaymentFormValues } from "@/lib/validation";
import { getCurrentUser } from "./auth";
import { resolveRentPaymentPropertyId } from "./entity-validation";
import {
  isPaymentDueInMonthFilter,
  paymentMatchesStatusFilter,
} from "./metrics";
import type { ServiceResult } from "./properties";

const RENT_SORT_FIELDS = {
  due_date: (p: RentPayment) => p.due_date,
  amount: (p: RentPayment) => p.amount,
  status: (p: RentPayment) => p.status,
  created_at: (p: RentPayment) => p.created_at,
} as const;

function filterRentPayments(
  items: RentPayment[],
  query: ListQuery,
  referenceDate = new Date()
): RentPayment[] {
  let result = items.map(withDemoRelations);

  if (query.q) {
    const q = query.q.toLowerCase();
    result = result.filter(
      (p) =>
        (p.tenant?.full_name.toLowerCase().includes(q) ?? false) ||
        (p.property?.name.toLowerCase().includes(q) ?? false)
    );
  }

  if (query.status) {
    result = result.filter((p) =>
      paymentMatchesStatusFilter(p, query.status, referenceDate)
    );
  }

  if (query.propertyId) {
    result = result.filter((p) => p.property_id === query.propertyId);
  }

  if (query.month) {
    result = result.filter((p) => isPaymentDueInMonthFilter(p, query.month));
  }

  return sortArray(
    result,
    query.sort && query.sort in RENT_SORT_FIELDS ? query.sort : "due_date",
    query.order ?? "desc",
    RENT_SORT_FIELDS
  );
}

function isStoredPaymentStatus(value: string): value is PaymentStatus {
  return (
    value === "paid" ||
    value === "pending" ||
    value === "late" ||
    value === "partial"
  );
}

export async function listRentPaymentsPage(
  query: ListQuery
): Promise<ServiceResult<PaginatedResult<RentPayment>>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;

  if (user.isDemo) {
    const filtered = filterRentPayments(demoRentPayments, query);
    return { data: paginateArray(filtered, page, pageSize), error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const sortKey =
    query.sort && query.sort in RENT_SORT_FIELDS ? query.sort : "due_date";
  const ascending = query.order === "asc";
  const needsEffectiveFilter =
    query.status === "late" || query.status === "open" || Boolean(query.q);

  let dbQuery = supabase
    .from("rent_payments")
    .select("*, tenant:tenants(id, full_name), property:properties(id, name)", {
      count: needsEffectiveFilter ? undefined : "exact",
    })
    .eq("owner_id", user.id);

  if (query.q) {
    const term = `%${query.q}%`;
    const [{ data: tenantMatches }, { data: propertyMatches }] = await Promise.all([
      supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .ilike("full_name", term),
      supabase
        .from("properties")
        .select("id")
        .eq("owner_id", user.id)
        .ilike("name", term),
    ]);

    const tenantIds = tenantMatches?.map((t) => t.id) ?? [];
    const propertyIds = propertyMatches?.map((p) => p.id) ?? [];

    if (tenantIds.length === 0 && propertyIds.length === 0) {
      return {
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize,
          totalPages: 1,
        },
        error: null,
      };
    }

    const parts: string[] = [];
    if (tenantIds.length > 0) {
      parts.push(`tenant_id.in.(${tenantIds.join(",")})`);
    }
    if (propertyIds.length > 0) {
      parts.push(`property_id.in.(${propertyIds.join(",")})`);
    }
    dbQuery = dbQuery.or(parts.join(","));
  }

  if (
    query.status &&
    query.status !== "late" &&
    query.status !== "open" &&
    isStoredPaymentStatus(query.status)
  ) {
    dbQuery = dbQuery.eq("status", query.status);
  }

  if (query.propertyId) {
    dbQuery = dbQuery.eq("property_id", query.propertyId);
  }

  if (query.month) {
    const [year, month] = query.month.split("-").map(Number);
    if (year && month) {
      const start = `${query.month}-01`;
      const endDay = new Date(year, month, 0).getDate();
      const end = `${query.month}-${String(endDay).padStart(2, "0")}`;
      dbQuery = dbQuery.gte("due_date", start).lte("due_date", end);
    }
  }

  if (needsEffectiveFilter) {
    const { data, error } = await dbQuery.order(sortKey, { ascending });
    if (error) return { data: null, error: error.message };

    let items = (data as unknown as RentPayment[]) ?? [];
    if (query.status) {
      items = items.filter((p) =>
        paymentMatchesStatusFilter(p, query.status, new Date())
      );
    }

    const sorted = sortArray(
      items,
      sortKey,
      query.order ?? "desc",
      RENT_SORT_FIELDS
    );
    return { data: paginateArray(sorted, page, pageSize), error: null };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await dbQuery
    .order(sortKey, { ascending })
    .range(from, to);

  if (error) return { data: null, error: error.message };

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  return {
    data: {
      items: (data as unknown as RentPayment[]) ?? [],
      total,
      page: Math.min(page, totalPages),
      pageSize,
      totalPages,
    },
    error: null,
  };
}

function withDemoRelations(payment: RentPayment): RentPayment {
  const tenant = demoTenants.find((t) => t.id === payment.tenant_id);
  const property = demoProperties.find((p) => p.id === payment.property_id);
  return {
    ...payment,
    tenant: tenant ? { id: tenant.id, full_name: tenant.full_name } : null,
    property: property ? { id: property.id, name: property.name } : null,
  };
}

export async function listRentPayments(): Promise<
  ServiceResult<RentPayment[]>
> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    const sorted = [...demoRentPayments].sort(
      (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
    );
    return { data: sorted.map(withDemoRelations), error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("rent_payments")
    .select("*, tenant:tenants(id, full_name), property:properties(id, name)")
    .eq("owner_id", user.id)
    .order("due_date", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: data as unknown as RentPayment[], error: null };
}

export async function getRentPayment(
  id: string
): Promise<ServiceResult<RentPayment>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    const payment = demoRentPayments.find((p) => p.id === id) ?? null;
    if (!payment) return { data: null, error: "Payment not found" };
    return { data: withDemoRelations(payment), error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("rent_payments")
    .select("*, tenant:tenants(id, full_name), property:properties(id, name)")
    .eq("owner_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Payment not found" };
  return { data: data as unknown as RentPayment, error: null };
}

function cleanPaymentValues(values: RentPaymentFormValues) {
  const dueDate = values.due_date;
  return {
    tenant_id: values.tenant_id,
    property_id: values.property_id,
    amount: values.amount,
    due_date: dueDate,
    billing_month: dueDate.slice(0, 7),
    payment_date: values.payment_date || null,
    status: values.status,
    payment_method: values.payment_method || null,
    notes: values.notes || null,
  };
}

export async function createRentPayment(
  values: RentPaymentFormValues
): Promise<ServiceResult<RentPayment>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const cleaned = cleanPaymentValues(values);

  const { propertyId, error: relationError } = await resolveRentPaymentPropertyId(
    user.id,
    cleaned.tenant_id,
    cleaned.property_id,
    user.isDemo
  );
  if (relationError || !propertyId) {
    return { data: null, error: relationError ?? "Invalid tenant or property." };
  }

  const paymentData = { ...cleaned, property_id: propertyId };

  if (user.isDemo) {
    const now = new Date().toISOString();
    const created: RentPayment = {
      id: `demo-${Date.now()}`,
      owner_id: user.id,
      created_at: now,
      updated_at: now,
      ...paymentData,
    };
    return { data: withDemoRelations(created), error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("rent_payments")
    .insert({ ...paymentData, owner_id: user.id })
    .select("*, tenant:tenants(id, full_name), property:properties(id, name)")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as unknown as RentPayment, error: null };
}

export async function updateRentPayment(
  id: string,
  values: RentPaymentFormValues
): Promise<ServiceResult<RentPayment>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const cleaned = cleanPaymentValues(values);

  const { propertyId, error: relationError } = await resolveRentPaymentPropertyId(
    user.id,
    cleaned.tenant_id,
    cleaned.property_id,
    user.isDemo
  );
  if (relationError || !propertyId) {
    return { data: null, error: relationError ?? "Invalid tenant or property." };
  }

  const paymentData = { ...cleaned, property_id: propertyId };

  if (user.isDemo) {
    const existing = demoRentPayments.find((p) => p.id === id);
    if (!existing) return { data: null, error: "Payment not found" };
    return {
      data: withDemoRelations({
        ...existing,
        ...paymentData,
        updated_at: new Date().toISOString(),
      }),
      error: null,
    };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("rent_payments")
    .update(paymentData)
    .eq("owner_id", user.id)
    .eq("id", id)
    .select("*, tenant:tenants(id, full_name), property:properties(id, name)")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as unknown as RentPayment, error: null };
}

export async function deleteRentPayment(
  id: string
): Promise<ServiceResult<true>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) return { data: true, error: null };

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { error } = await supabase
    .from("rent_payments")
    .delete()
    .eq("owner_id", user.id)
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
}
