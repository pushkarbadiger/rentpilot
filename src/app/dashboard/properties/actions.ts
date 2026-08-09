"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { propertySchema, flattenZodErrors } from "@/lib/validation";
import {
  createProperty,
  deleteProperty,
  updateProperty,
} from "@/lib/services/properties";

export interface PropertyFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parsePropertyForm(formData: FormData) {
  const raw = {
    name: String(formData.get("name") || ""),
    address: String(formData.get("address") || ""),
    city: String(formData.get("city") || ""),
    state: String(formData.get("state") || ""),
    postal_code: String(formData.get("postal_code") || ""),
    property_type: String(formData.get("property_type") || "apartment"),
    units: String(formData.get("units") || "1"),
    monthly_rent: String(formData.get("monthly_rent") || "0"),
    status: String(formData.get("status") || "active"),
    notes: String(formData.get("notes") || ""),
  };
  return propertySchema.safeParse(raw);
}

export async function createPropertyAction(
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const parsed = parsePropertyForm(formData);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const { data, error } = await createProperty(parsed.data);
  if (error || !data) {
    return { error: error ?? "Could not create property." };
  }

  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard");
  redirect(`/dashboard/properties/${data.id}`);
}

export async function updatePropertyAction(
  id: string,
  _prevState: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const parsed = parsePropertyForm(formData);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const { data, error } = await updateProperty(id, parsed.data);
  if (error || !data) {
    return { error: error ?? "Could not update property." };
  }

  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/properties/${id}`);
}

export async function deletePropertyAction(id: string) {
  const { error } = await deleteProperty(id);
  if (error) throw new Error(error);
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard");
  redirect("/dashboard/properties");
}
