"use client";

import { useState, useTransition } from "react";
import { sendBatchRentReminderAction } from "@/app/dashboard/rent/actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { BatchReminderPreview } from "@/lib/services/rent-reminders";
import type { ReminderKind } from "@/lib/types/domain";

const KIND_LABELS: Record<ReminderKind, string> = {
  upcoming: "Upcoming (due soon)",
  due: "Due today",
  late: "Overdue",
};

export function BatchRentReminderForm({
  previewAction,
  initialKind,
  initialPreview,
}: {
  previewAction: (kind: ReminderKind) => Promise<{
    data?: BatchReminderPreview;
    error?: string;
  }>;
  initialKind: ReminderKind;
  initialPreview: BatchReminderPreview;
}) {
  const [isPending, startTransition] = useTransition();
  const [kind, setKind] = useState<ReminderKind>(initialKind);
  const [preview, setPreview] = useState(initialPreview);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  function handleKindChange(nextKind: ReminderKind) {
    setKind(nextKind);
    setError(undefined);
    startTransition(async () => {
      const next = await previewAction(nextKind);
      if (next.error) {
        setError(next.error);
        return;
      }
      if (next.data) setPreview(next.data);
    });
  }

  async function handleSubmit() {
    const confirmed = window.confirm(
      preview.sendable > 0
        ? `Send ${preview.sendable} rent reminder email${preview.sendable === 1 ? "" : "s"} (${KIND_LABELS[kind]})?`
        : `No reminders are ready to send for ${KIND_LABELS[kind].toLowerCase()}. Preview only?`
    );
    if (!confirmed) return;

    if (preview.sendable === 0) return;

    setSubmitting(true);
    setError(undefined);

    const response = await sendBatchRentReminderAction(kind);
    if (response.error) {
      setError(response.error);
      setSubmitting(false);
    }
  }

  const pending = submitting || isPending;

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-[200px] flex-1">
          <label
            htmlFor="batch_reminder_kind"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Reminder type
          </label>
          <Select
            id="batch_reminder_kind"
            value={kind}
            disabled={pending}
            onChange={(e) => handleKindChange(e.target.value as ReminderKind)}
          >
            {(Object.keys(KIND_LABELS) as ReminderKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        </div>

        <Button
          type="button"
          disabled={pending || preview.sendable === 0}
          onClick={handleSubmit}
          className="sm:mb-0.5"
        >
          {submitting
            ? "Sending…"
            : isPending
              ? "Loading…"
              : `Send ${preview.sendable} reminder${preview.sendable === 1 ? "" : "s"}`}
        </Button>
      </div>

      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <p>
          <span className="font-medium text-slate-800">{preview.eligible}</span>{" "}
          eligible ·{" "}
          <span className="font-medium text-slate-800">{preview.sendable}</span>{" "}
          ready to send
        </p>
        {(preview.missingEmail > 0 || preview.alreadyReminded > 0) && (
          <p className="mt-1 text-slate-500">
            {preview.missingEmail > 0 && (
              <>
                {preview.missingEmail} missing email
                {preview.alreadyReminded > 0 ? " · " : ""}
              </>
            )}
            {preview.alreadyReminded > 0 && (
              <>{preview.alreadyReminded} already reminded</>
            )}
          </p>
        )}
        {preview.eligible === 0 && (
          <p className="mt-1 text-slate-500">
            No open payments match {KIND_LABELS[kind].toLowerCase()} right now.
          </p>
        )}
      </div>
    </div>
  );
}
