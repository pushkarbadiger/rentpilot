"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { rentPaymentSchema, flattenZodErrors } from "@/lib/validation";
import {
  createRentPayment,
  deleteRentPayment,
  updateRentPayment,
} from "@/lib/services/rent-payments";

export interface RentPaymentFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parsePaymentForm(formData: FormData) {
  const raw = {
    tenant_id: String(formData.get("tenant_id") || ""),
    property_id: String(formData.get("property_id") || ""),
    amount: String(formData.get("amount") || "0"),
    due_date: String(formData.get("due_date") || ""),
    payment_date: String(formData.get("payment_date") || ""),
    status: String(formData.get("status") || "pending"),
    payment_method: String(formData.get("payment_method") || ""),
    notes: String(formData.get("notes") || ""),
  };
  return rentPaymentSchema.safeParse(raw);
}

export async function createRentPaymentAction(
  _prevState: RentPaymentFormState,
  formData: FormData
): Promise<RentPaymentFormState> {
  const parsed = parsePaymentForm(formData);
  if (!parsed.success) return { fieldErrors: flattenZodErrors(parsed.error) };

  const { error } = await createRentPayment(parsed.data);
  if (error) return { error };

  revalidatePath("/dashboard/rent");
  revalidatePath("/dashboard");
  redirect("/dashboard/rent");
}

export async function updateRentPaymentAction(
  id: string,
  _prevState: RentPaymentFormState,
  formData: FormData
): Promise<RentPaymentFormState> {
  const parsed = parsePaymentForm(formData);
  if (!parsed.success) return { fieldErrors: flattenZodErrors(parsed.error) };

  const { error } = await updateRentPayment(id, parsed.data);
  if (error) return { error };

  revalidatePath("/dashboard/rent");
  revalidatePath("/dashboard");
  redirect("/dashboard/rent");
}

export async function deleteRentPaymentAction(id: string) {
  const { error } = await deleteRentPayment(id);
  if (error) throw new Error(error);
  revalidatePath("/dashboard/rent");
  revalidatePath("/dashboard");
  redirect("/dashboard/rent");
}
