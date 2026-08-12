import { createClient } from "@/lib/supabase/server";
import { demoProperties } from "@/lib/demo-data";
import type { ListQuery, PaginatedResult } from "@/lib/list-query";
import { paginateArray, sortArray } from "@/lib/list-query";
import type { Property, PropertyStatus } from "@/lib/types/domain";
import type { PropertyFormValues } from "@/lib/validation";
import { getCurrentUser } from "./auth";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

const PROPERTY_SORT_FIELDS = {
  name: (p: Property) => p.name.toLowerCase(),
  monthly_rent: (p: Property) => p.monthly_rent,
  units: (p: Property) => p.units,
  created_at: (p: Property) => p.created_at,
  status: (p: Property) => p.status,
} as const;

function filterProperties(items: Property[], query: ListQuery): Property[] {
  let result = items;

  if (query.q) {
    const q = query.q.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.postal_code.toLowerCase().includes(q)
    );
  }

  if (query.status) {
    result = result.filter((p) => p.status === query.status);
  }

  return sortArray(
    result,
    query.sort && query.sort in PROPERTY_SORT_FIELDS ? query.sort : "created_at",
    query.order ?? "desc",
    PROPERTY_SORT_FIELDS
  );
}

function isPropertyStatus(value: string): value is PropertyStatus {
  return value === "active" || value === "inactive";
}

export async function listPropertiesPage(
  query: ListQuery
): Promise<ServiceResult<PaginatedResult<Property>>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;

  if (user.isDemo) {
    const filtered = filterProperties(demoProperties, query);
    return { data: paginateArray(filtered, page, pageSize), error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const sortKey =
    query.sort && query.sort in PROPERTY_SORT_FIELDS ? query.sort : "created_at";
  const ascending = query.order === "asc";

  let dbQuery = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("owner_id", user.id);

  if (query.q) {
    const term = `%${query.q}%`;
    dbQuery = dbQuery.or(
      `name.ilike.${term},address.ilike.${term},city.ilike.${term},state.ilike.${term},postal_code.ilike.${term}`
    );
  }

  if (query.status && isPropertyStatus(query.status)) {
    dbQuery = dbQuery.eq("status", query.status);
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
      items: (data as Property[]) ?? [],
      total,
      page: Math.min(page, totalPages),
      pageSize,
      totalPages,
    },
    error: null,
  };
}

export async function listProperties(): Promise<ServiceResult<Property[]>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    return { data: demoProperties, error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data: data as Property[], error: null };
}

export async function getProperty(
  id: string
): Promise<ServiceResult<Property>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    const property = demoProperties.find((p) => p.id === id) ?? null;
    if (!property) return { data: null, error: "Property not found" };
    return { data: property, error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Property not found" };
  return { data: data as Property, error: null };
}

export async function createProperty(
  values: PropertyFormValues
): Promise<ServiceResult<Property>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    const now = new Date().toISOString();
    const created: Property = {
      id: `demo-${Date.now()}`,
      owner_id: user.id,
      notes: values.notes || null,
      created_at: now,
      updated_at: now,
      ...values,
    };
    return { data: created, error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("properties")
    .insert({ ...values, notes: values.notes || null, owner_id: user.id })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Property, error: null };
}

export async function updateProperty(
  id: string,
  values: PropertyFormValues
): Promise<ServiceResult<Property>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    const existing = demoProperties.find((p) => p.id === id);
    if (!existing) return { data: null, error: "Property not found" };
    return {
      data: {
        ...existing,
        ...values,
        notes: values.notes || null,
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("properties")
    .update({ ...values, notes: values.notes || null })
    .eq("owner_id", user.id)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Property, error: null };
}

export async function deleteProperty(
  id: string
): Promise<ServiceResult<true>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    return { data: true, error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("owner_id", user.id)
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return { data: true, error: null };
}
