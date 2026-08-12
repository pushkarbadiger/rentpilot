"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { tenantSchema, flattenZodErrors } from "@/lib/validation";
import { pathWithDemoNoticeIfNeeded } from "@/lib/demo-write";
import { createTenant, deleteTenant, updateTenant } from "@/lib/services/tenants";

export interface TenantFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseTenantForm(formData: FormData) {
  const raw = {
    full_name: String(formData.get("full_name") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    property_id: String(formData.get("property_id") || ""),
    unit: String(formData.get("unit") || ""),
    lease_start: String(formData.get("lease_start") || ""),
    lease_end: String(formData.get("lease_end") || ""),
    monthly_rent: String(formData.get("monthly_rent") || "0"),
    security_deposit: String(formData.get("security_deposit") || "0"),
    status: String(formData.get("status") || "active"),
    notes: String(formData.get("notes") || ""),
  };
  return tenantSchema.safeParse(raw);
}

export async function createTenantAction(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  const parsed = parseTenantForm(formData);
  if (!parsed.success) return { fieldErrors: flattenZodErrors(parsed.error) };

  const { data, error } = await createTenant(parsed.data);
  if (error || !data) return { error: error ?? "Could not create tenant." };

  revalidatePath("/dashboard/tenants");
  revalidatePath("/dashboard");
  redirect(await pathWithDemoNoticeIfNeeded(`/dashboard/tenants/${data.id}`));
}

export async function updateTenantAction(
  id: string,
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  const parsed = parseTenantForm(formData);
  if (!parsed.success) return { fieldErrors: flattenZodErrors(parsed.error) };

  const { data, error } = await updateTenant(id, parsed.data);
  if (error || !data) return { error: error ?? "Could not update tenant." };

  revalidatePath("/dashboard/tenants");
  revalidatePath(`/dashboard/tenants/${id}`);
  revalidatePath("/dashboard");
  redirect(await pathWithDemoNoticeIfNeeded(`/dashboard/tenants/${id}`));
}

export async function deleteTenantAction(id: string) {
  const { error } = await deleteTenant(id);
  if (error) throw new Error(error);
  revalidatePath("/dashboard/tenants");
  revalidatePath("/dashboard");
  redirect(await pathWithDemoNoticeIfNeeded("/dashboard/tenants"));
}
