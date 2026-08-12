import { createClient } from "@/lib/supabase/server";
import { demoProperties, demoTenants } from "@/lib/demo-data";
import type { ListQuery, PaginatedResult } from "@/lib/list-query";
import { paginateArray, sortArray } from "@/lib/list-query";
import type { Tenant, TenantStatus } from "@/lib/types/domain";
import type { TenantFormValues } from "@/lib/validation";
import { getCurrentUser } from "./auth";
import { validatePropertyOwnership } from "./entity-validation";
import type { ServiceResult } from "./properties";

const TENANT_SORT_FIELDS = {
  full_name: (t: Tenant) => t.full_name.toLowerCase(),
  monthly_rent: (t: Tenant) => t.monthly_rent,
  lease_end: (t: Tenant) => t.lease_end ?? "",
  created_at: (t: Tenant) => t.created_at,
  status: (t: Tenant) => t.status,
} as const;

function filterTenants(items: Tenant[], query: ListQuery): Tenant[] {
  let result = items.map(withDemoProperty);

  if (query.q) {
    const q = query.q.toLowerCase();
    result = result.filter(
      (t) =>
        t.full_name.toLowerCase().includes(q) ||
        (t.email?.toLowerCase().includes(q) ?? false) ||
        (t.phone?.toLowerCase().includes(q) ?? false)
    );
  }

  if (query.status) {
    result = result.filter((t) => t.status === query.status);
  }

  if (query.propertyId) {
    result = result.filter((t) => t.property_id === query.propertyId);
  }

  return sortArray(
    result,
    query.sort && query.sort in TENANT_SORT_FIELDS ? query.sort : "created_at",
    query.order ?? "desc",
    TENANT_SORT_FIELDS
  );
}

function isTenantStatus(value: string): value is TenantStatus {
  return value === "active" || value === "pending" || value === "former";
}

export async function listTenantsPage(
  query: ListQuery
): Promise<ServiceResult<PaginatedResult<Tenant>>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;

  if (user.isDemo) {
    const filtered = filterTenants(demoTenants, query);
    return { data: paginateArray(filtered, page, pageSize), error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const sortKey =
    query.sort && query.sort in TENANT_SORT_FIELDS ? query.sort : "created_at";
  const ascending = query.order === "asc";

  let dbQuery = supabase
    .from("tenants")
    .select("*, property:properties(id, name, address)", { count: "exact" })
    .eq("owner_id", user.id);

  if (query.q) {
    const term = `%${query.q}%`;
    dbQuery = dbQuery.or(
      `full_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`
    );
  }

  if (query.status && isTenantStatus(query.status)) {
    dbQuery = dbQuery.eq("status", query.status);
  }

  if (query.propertyId) {
    dbQuery = dbQuery.eq("property_id", query.propertyId);
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
      items: (data as unknown as Tenant[]) ?? [],
      total,
      page: Math.min(page, totalPages),
      pageSize,
      totalPages,
    },
    error: null,
  };
}

function withDemoProperty(tenant: Tenant): Tenant {
  const property = demoProperties.find((p) => p.id === tenant.property_id);
  return {
    ...tenant,
    property: property
      ? { id: property.id, name: property.name, address: property.address }
      : null,
  };
}

export async function listTenants(): Promise<ServiceResult<Tenant[]>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    return { data: demoTenants.map(withDemoProperty), error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("tenants")
    .select("*, property:properties(id, name, address)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: data as unknown as Tenant[], error: null };
}

export async function getTenant(id: string): Promise<ServiceResult<Tenant>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    const tenant = demoTenants.find((t) => t.id === id) ?? null;
    if (!tenant) return { data: null, error: "Tenant not found" };
    return { data: withDemoProperty(tenant), error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("tenants")
    .select("*, property:properties(id, name, address)")
    .eq("owner_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Tenant not found" };
  return { data: data as unknown as Tenant, error: null };
}

function cleanTenantValues(values: TenantFormValues) {
  return {
    full_name: values.full_name,
    email: values.email || null,
    phone: values.phone || null,
    property_id: values.property_id || null,
    unit: values.unit || null,
    lease_start: values.lease_start || null,
    lease_end: values.lease_end || null,
    monthly_rent: values.monthly_rent,
    security_deposit: values.security_deposit,
    status: values.status,
    notes: values.notes || null,
  };
}

export async function createTenant(
  values: TenantFormValues
): Promise<ServiceResult<Tenant>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const cleaned = cleanTenantValues(values);

  if (cleaned.property_id) {
    const propertyError = await validatePropertyOwnership(
      user.id,
      cleaned.property_id,
      user.isDemo
    );
    if (propertyError) return { data: null, error: propertyError };
  }

  if (user.isDemo) {
    const now = new Date().toISOString();
    const created: Tenant = {
      id: `demo-${Date.now()}`,
      owner_id: user.id,
      created_at: now,
      updated_at: now,
      ...cleaned,
    };
    return { data: withDemoProperty(created), error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("tenants")
    .insert({ ...cleaned, owner_id: user.id })
    .select("*, property:properties(id, name, address)")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as unknown as Tenant, error: null };
}

export async function updateTenant(
  id: string,
  values: TenantFormValues
): Promise<ServiceResult<Tenant>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const cleaned = cleanTenantValues(values);

  if (cleaned.property_id) {
    const propertyError = await validatePropertyOwnership(
      user.id,
      cleaned.property_id,
      user.isDemo
    );
    if (propertyError) return { data: null, error: propertyError };
  }

  if (user.isDemo) {
    const existing = demoTenants.find((t) => t.id === id);
    if (!existing) return { data: null, error: "Tenant not found" };
    return {
      data: withDemoProperty({
        ...existing,
        ...cleaned,
        updated_at: new Date().toISOString(),
      }),
      error: null,
    };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("tenants")
    .update(cleaned)
    .eq("owner_id", user.id)
    .eq("id", id)
    .select("*, property:properties(id, name, address)")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as unknown as Tenant, error: null };
}

export async function deleteTenant(id: string): Promise<ServiceResult<true>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) return { data: true, error: null };

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { error } = await supabase
    .from("tenants")
    .delete()
    .eq("owner_id", user.id)
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
}
