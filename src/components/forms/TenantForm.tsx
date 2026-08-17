"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { Property, Tenant } from "@/lib/types/domain";
import type { TenantFormState } from "@/app/dashboard/tenants/actions";

export function TenantForm({
  action,
  tenant,
  properties,
  submitLabel = "Save Tenant",
}: {
  action: (
    state: TenantFormState,
    formData: FormData
  ) => Promise<TenantFormState>;
  tenant?: Tenant;
  properties: Property[];
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField
            label="Full name"
            htmlFor="full_name"
            required
            error={errors.full_name}
          >
            <Input
              id="full_name"
              name="full_name"
              defaultValue={tenant?.full_name}
              placeholder="Jordan Blake"
            />
          </FormField>
        </div>

        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={tenant?.email ?? ""}
            placeholder="jordan@example.com"
          />
        </FormField>

        <FormField label="Phone" htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            defaultValue={tenant?.phone ?? ""}
            placeholder="(512) 555-0143"
          />
        </FormField>

        <FormField label="Property" htmlFor="property_id">
          <Select
            id="property_id"
            name="property_id"
            defaultValue={tenant?.property_id ?? ""}
          >
            <option value="">No property assigned</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Unit" htmlFor="unit" error={errors.unit}>
          <Input
            id="unit"
            name="unit"
            defaultValue={tenant?.unit ?? ""}
            placeholder="Unit 2"
          />
        </FormField>

        <FormField label="Lease start" htmlFor="lease_start">
          <Input
            id="lease_start"
            name="lease_start"
            type="date"
            defaultValue={tenant?.lease_start ?? ""}
          />
        </FormField>

        <FormField label="Lease end" htmlFor="lease_end">
          <Input
            id="lease_end"
            name="lease_end"
            type="date"
            defaultValue={tenant?.lease_end ?? ""}
          />
        </FormField>

        <FormField
          label="Monthly rent"
          htmlFor="monthly_rent"
          required
          error={errors.monthly_rent}
        >
          <Input
            id="monthly_rent"
            name="monthly_rent"
            type="number"
            min={0}
            step="0.01"
            defaultValue={tenant?.monthly_rent ?? 0}
          />
        </FormField>

        <FormField
          label="Security deposit"
          htmlFor="security_deposit"
          required
          error={errors.security_deposit}
        >
          <Input
            id="security_deposit"
            name="security_deposit"
            type="number"
            min={0}
            step="0.01"
            defaultValue={tenant?.security_deposit ?? 0}
          />
        </FormField>

        <FormField label="Status" htmlFor="status" required>
          <Select
            id="status"
            name="status"
            defaultValue={tenant?.status ?? "active"}
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="former">Former</option>
          </Select>
        </FormField>

        <div className="sm:col-span-2">
          <FormField label="Notes" htmlFor="notes" error={errors.notes}>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={tenant?.notes ?? ""}
              placeholder="Optional internal notes about this tenant"
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
