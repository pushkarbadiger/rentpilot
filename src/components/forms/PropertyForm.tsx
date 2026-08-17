"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { Property } from "@/lib/types/domain";
import type { PropertyFormState } from "@/app/dashboard/properties/actions";

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "duplex", label: "Duplex" },
  { value: "commercial", label: "Commercial" },
  { value: "other", label: "Other" },
];

export function PropertyForm({
  action,
  property,
  submitLabel = "Save Property",
}: {
  action: (
    state: PropertyFormState,
    formData: FormData
  ) => Promise<PropertyFormState>;
  property?: Property;
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
            label="Property name"
            htmlFor="name"
            required
            error={errors.name}
          >
            <Input
              id="name"
              name="name"
              defaultValue={property?.name}
              placeholder="Maple Ridge Apartments"
            />
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField
            label="Address"
            htmlFor="address"
            required
            error={errors.address}
          >
            <Input
              id="address"
              name="address"
              defaultValue={property?.address}
              placeholder="128 Maple Ridge Rd"
            />
          </FormField>
        </div>

        <FormField label="City" htmlFor="city" required error={errors.city}>
          <Input
            id="city"
            name="city"
            defaultValue={property?.city}
            placeholder="Austin"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="State"
            htmlFor="state"
            required
            error={errors.state}
          >
            <Input
              id="state"
              name="state"
              maxLength={2}
              defaultValue={property?.state}
              placeholder="TX"
              className="uppercase"
            />
          </FormField>
          <FormField
            label="ZIP / Postal code"
            htmlFor="postal_code"
            required
            error={errors.postal_code}
          >
            <Input
              id="postal_code"
              name="postal_code"
              defaultValue={property?.postal_code}
              placeholder="78701"
            />
          </FormField>
        </div>

        <FormField label="Property type" htmlFor="property_type" required>
          <Select
            id="property_type"
            name="property_type"
            defaultValue={property?.property_type ?? "apartment"}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Status" htmlFor="status" required>
          <Select
            id="status"
            name="status"
            defaultValue={property?.status ?? "active"}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormField>

        <FormField
          label="Number of units"
          htmlFor="units"
          required
          error={errors.units}
        >
          <Input
            id="units"
            name="units"
            type="number"
            min={1}
            defaultValue={property?.units ?? 1}
          />
        </FormField>

        <FormField
          label="Monthly rent"
          htmlFor="monthly_rent"
          required
          error={errors.monthly_rent}
          hint="Total expected monthly rent for this property"
        >
          <Input
            id="monthly_rent"
            name="monthly_rent"
            type="number"
            min={0}
            step="0.01"
            defaultValue={property?.monthly_rent ?? 0}
          />
        </FormField>

        <div className="sm:col-span-2">
          <FormField label="Notes" htmlFor="notes" error={errors.notes}>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={property?.notes ?? ""}
              placeholder="Optional internal notes about this property"
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
