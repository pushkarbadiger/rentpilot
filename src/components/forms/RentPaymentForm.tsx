"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { Property, RentPayment, Tenant } from "@/lib/types/domain";
import type { RentPaymentFormState } from "@/app/dashboard/rent/actions";

export function RentPaymentForm({
  action,
  payment,
  tenants,
  properties,
  submitLabel = "Save Payment",
}: {
  action: (
    state: RentPaymentFormState,
    formData: FormData
  ) => Promise<RentPaymentFormState>;
  payment?: RentPayment;
  tenants: Tenant[];
  properties: Property[];
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  const tenantById = useMemo(
    () => new Map(tenants.map((t) => [t.id, t])),
    [tenants]
  );

  const [tenantId, setTenantId] = useState(payment?.tenant_id ?? "");
  const [propertyId, setPropertyId] = useState(payment?.property_id ?? "");
  const [amount, setAmount] = useState(
    payment?.amount != null ? String(payment.amount) : ""
  );

  const selectedTenant = tenantId ? tenantById.get(tenantId) : undefined;
  const propertyLocked = Boolean(selectedTenant?.property_id);

  const availableProperties = selectedTenant?.property_id
    ? properties.filter((p) => p.id === selectedTenant.property_id)
    : properties;

  function handleTenantChange(nextTenantId: string) {
    setTenantId(nextTenantId);
    const tenant = nextTenantId ? tenantById.get(nextTenantId) : undefined;

    if (tenant?.property_id) {
      setPropertyId(tenant.property_id);
    } else if (!payment || nextTenantId !== payment.tenant_id) {
      setPropertyId("");
    }

    if (tenant && tenant.monthly_rent > 0) {
      setAmount(String(tenant.monthly_rent));
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Tenant"
          htmlFor="tenant_id"
          required
          error={errors.tenant_id}
        >
          <Select
            id="tenant_id"
            name="tenant_id"
            value={tenantId}
            onChange={(e) => handleTenantChange(e.target.value)}
          >
            <option value="">Select a tenant</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
                {t.property?.name ? ` · ${t.property.name}` : ""}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Property"
          htmlFor="property_id"
          required
          error={errors.property_id}
          hint={
            propertyLocked
              ? "Assigned from the selected tenant"
              : selectedTenant
                ? "Select a property for this payment"
                : undefined
          }
        >
          <Select
            id="property_id"
            name="property_id"
            value={propertyId}
            disabled={propertyLocked}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">Select a property</option>
            {availableProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Amount" htmlFor="amount" required error={errors.amount}>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </FormField>

        <FormField label="Status" htmlFor="status" required>
          <Select
            id="status"
            name="status"
            defaultValue={payment?.status ?? "pending"}
          >
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="late">Late</option>
            <option value="partial">Partial</option>
          </Select>
        </FormField>

        <FormField
          label="Due date"
          htmlFor="due_date"
          required
          error={errors.due_date}
        >
          <Input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={payment?.due_date ?? ""}
          />
        </FormField>

        <FormField label="Payment date" htmlFor="payment_date">
          <Input
            id="payment_date"
            name="payment_date"
            type="date"
            defaultValue={payment?.payment_date ?? ""}
          />
        </FormField>

        <FormField label="Payment method" htmlFor="payment_method">
          <Select
            id="payment_method"
            name="payment_method"
            defaultValue={payment?.payment_method ?? ""}
          >
            <option value="">Not specified</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="other">Other</option>
          </Select>
        </FormField>

        <div className="sm:col-span-2">
          <FormField label="Notes" htmlFor="notes" error={errors.notes}>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={payment?.notes ?? ""}
              placeholder="Optional notes about this payment"
            />
          </FormField>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
