"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  rentPaymentSchema,
  recurringRentMonthSchema,
  reminderKindSchema,
  flattenZodErrors,
} from "@/lib/validation";
import { pathWithDemoNoticeIfNeeded } from "@/lib/demo-write";
import {
  createRentPayment,
  deleteRentPayment,
  updateRentPayment,
} from "@/lib/services/rent-payments";
import { generateRecurringRentForMonth } from "@/lib/services/recurring-rent";
import {
  getBatchRentReminderPreview,
  getRentReminderPreview,
  sendRentReminder,
  sendRentReminderBatch,
} from "@/lib/services/rent-reminders";
import type {
  BatchReminderPreview,
  PaymentReminderPreview,
} from "@/lib/services/rent-reminders";
import { createRentCollectionSession } from "@/lib/services/payments/create-collection-session";
import type { RentCollectionSessionResult } from "@/lib/services/payments/types";

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
  redirect(await pathWithDemoNoticeIfNeeded("/dashboard/rent"));
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
  redirect(await pathWithDemoNoticeIfNeeded("/dashboard/rent"));
}

export async function deleteRentPaymentAction(id: string) {
  const { error } = await deleteRentPayment(id);
  if (error) throw new Error(error);
  revalidatePath("/dashboard/rent");
  revalidatePath("/dashboard");
  redirect(await pathWithDemoNoticeIfNeeded("/dashboard/rent"));
}

export async function generateRecurringRentAction(
  formData: FormData
): Promise<{ error?: string }> {
  const raw = String(formData.get("billing_month") || "");
  const parsed = recurringRentMonthSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Select a valid billing month." };
  }

  const { data, error } = await generateRecurringRentForMonth(parsed.data);
  if (error || !data) {
    return { error: error ?? "Could not generate rent records. Please try again." };
  }

  revalidatePath("/dashboard/rent");
  revalidatePath("/dashboard");

  const params = new URLSearchParams({
    generated: "1",
    month: data.billingMonth,
    created: String(data.created),
  });

  redirect(
    await pathWithDemoNoticeIfNeeded(`/dashboard/rent?${params.toString()}`)
  );
}

export async function previewRentReminderAction(
  paymentId: string
): Promise<{ data?: PaymentReminderPreview; error?: string }> {
  const { data, error } = await getRentReminderPreview(paymentId);
  if (error || !data) return { error: error ?? "Could not load reminder preview." };
  return { data };
}

export async function previewBatchRentReminderAction(
  reminderKind: string
): Promise<{ data?: BatchReminderPreview; error?: string }> {
  const parsed = reminderKindSchema.safeParse(reminderKind);
  if (!parsed.success) return { error: "Select a valid reminder type." };

  const { data, error } = await getBatchRentReminderPreview(parsed.data);
  if (error || !data) return { error: error ?? "Could not load batch preview." };
  return { data };
}

export async function sendRentReminderAction(
  paymentId: string,
  reminderKind: string
): Promise<{ error?: string }> {
  const parsed = reminderKindSchema.safeParse(reminderKind);
  if (!parsed.success) return { error: "Select a valid reminder type." };

  const { data, error } = await sendRentReminder(paymentId, parsed.data);
  if (error || !data) return { error: error ?? "Could not send reminder." };

  revalidatePath("/dashboard/rent");
  revalidatePath(`/dashboard/rent/${paymentId}`);

  const path = `/dashboard/rent/${paymentId}?reminderSent=${parsed.data}`;
  redirect(
    await pathWithDemoNoticeIfNeeded(path)
  );
}

export async function sendBatchRentReminderAction(
  reminderKind: string
): Promise<{ error?: string }> {
  const parsed = reminderKindSchema.safeParse(reminderKind);
  if (!parsed.success) return { error: "Select a valid reminder type." };

  const { data, error } = await sendRentReminderBatch(parsed.data);
  if (error || !data) {
    return { error: error ?? "Could not send batch reminders." };
  }

  revalidatePath("/dashboard/rent");

  const params = new URLSearchParams({
    batchReminder: "1",
    kind: parsed.data,
    eligible: String(data.eligible),
    sent: String(data.sent),
    failed: String(data.failed),
    skipped: String(data.skipped),
    missingEmail: String(data.missingEmail),
    alreadyReminded: String(data.alreadyReminded),
  });
  redirect(
    await pathWithDemoNoticeIfNeeded(`/dashboard/rent?${params.toString()}`)
  );
}

export async function createRentCheckoutSessionAction(
  rentPaymentId: string
): Promise<{ data?: RentCollectionSessionResult; error?: string }> {
  const { data, error } = await createRentCollectionSession(rentPaymentId);
  if (error || !data) {
    return { error: error ?? "Could not create payment link." };
  }

  if (data.simulated) {
    redirect(
      await pathWithDemoNoticeIfNeeded(
        `/dashboard/rent/${rentPaymentId}?checkout=simulated`
      )
    );
  }

  revalidatePath(`/dashboard/rent/${rentPaymentId}`);
  return { data };
}
