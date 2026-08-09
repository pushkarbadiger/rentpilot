import { createClient } from "@/lib/supabase/server";
import { demoProperties } from "@/lib/demo-data";
import type { Property } from "@/lib/types/domain";
import type { PropertyFormValues } from "@/lib/validation";
import { getCurrentUser } from "./auth";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
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
