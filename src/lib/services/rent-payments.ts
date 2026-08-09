import { createClient } from "@/lib/supabase/server";
import { demoProperties, demoRentPayments, demoTenants } from "@/lib/demo-data";
import type { RentPayment } from "@/lib/types/domain";
import type { RentPaymentFormValues } from "@/lib/validation";
import { getCurrentUser } from "./auth";
import type { ServiceResult } from "./properties";

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
  return {
    tenant_id: values.tenant_id,
    property_id: values.property_id,
    amount: values.amount,
    due_date: values.due_date,
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

  if (user.isDemo) {
    const now = new Date().toISOString();
    const created: RentPayment = {
      id: `demo-${Date.now()}`,
      owner_id: user.id,
      created_at: now,
      updated_at: now,
      ...cleaned,
    };
    return { data: withDemoRelations(created), error: null };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("rent_payments")
    .insert({ ...cleaned, owner_id: user.id })
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

  if (user.isDemo) {
    const existing = demoRentPayments.find((p) => p.id === id);
    if (!existing) return { data: null, error: "Payment not found" };
    return {
      data: withDemoRelations({
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
    .from("rent_payments")
    .update(cleaned)
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
