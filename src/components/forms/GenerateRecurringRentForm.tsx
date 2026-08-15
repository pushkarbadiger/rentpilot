"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { RecurringRentPreview } from "@/lib/services/recurring-rent";

export function GenerateRecurringRentForm({
  action,
  monthOptions,
  selectedMonth,
  preview,
}: {
  action: (formData: FormData) => Promise<{ error?: string }>;
  monthOptions: { value: string; label: string }[];
  selectedMonth: string;
  preview: RecurringRentPreview;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const selectedLabel =
    monthOptions.find((o) => o.value === selectedMonth)?.label ?? selectedMonth;

  function handleMonthChange(month: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("generateMonth", month);
    params.delete("generated");
    params.delete("created");
    startTransition(() => {
      router.push(`/dashboard/rent?${params.toString()}`);
    });
  }

  async function handleSubmit(formData: FormData) {
    const month = String(formData.get("billing_month") || selectedMonth);
    const label =
      monthOptions.find((o) => o.value === month)?.label ?? month;

    const confirmed = window.confirm(
      preview.toCreate > 0
        ? `Generate ${preview.toCreate} rent record${preview.toCreate === 1 ? "" : "s"} for ${label}? Existing payments for that month will be left unchanged.`
        : `No new rent records are needed for ${label}. Run anyway to confirm everything is up to date?`
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError(undefined);
    const result = await action(formData);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  const pending = submitting || isPending;

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-[200px] flex-1">
          <label
            htmlFor="billing_month"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Billing month
          </label>
          <Select
            id="billing_month"
            name="billing_month"
            value={selectedMonth}
            disabled={pending}
            onChange={(e) => handleMonthChange(e.target.value)}
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" disabled={pending} className="sm:mb-0.5">
          {submitting ? "Generating…" : isPending ? "Loading…" : "Generate rent"}
        </Button>
      </div>

      <p className="text-sm text-slate-500">
        {preview.eligible === 0 ? (
          <>No active tenants are eligible for {selectedLabel}.</>
        ) : preview.toCreate > 0 ? (
          <>
            Up to <span className="font-medium text-slate-700">{preview.toCreate}</span>{" "}
            new record{preview.toCreate === 1 ? "" : "s"} for {selectedLabel}.{" "}
            {preview.existing > 0 && (
              <>
                {preview.existing} tenant{preview.existing === 1 ? "" : "s"} already
                ha{preview.existing === 1 ? "s" : "ve"} a payment for this month.
              </>
            )}
          </>
        ) : (
          <>
            All {preview.eligible} eligible tenant
            {preview.eligible === 1 ? "" : "s"} already ha
            {preview.eligible === 1 ? "s" : "ve"} a payment for {selectedLabel}.
          </>
        )}
      </p>
    </form>
  );
}
