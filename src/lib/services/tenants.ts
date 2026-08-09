import { createClient } from "@/lib/supabase/server";
import { demoProperties, demoTenants } from "@/lib/demo-data";
import type { Tenant } from "@/lib/types/domain";
import type { TenantFormValues } from "@/lib/validation";
import { getCurrentUser } from "./auth";
import type { ServiceResult } from "./properties";

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
