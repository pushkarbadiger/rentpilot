"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { sendRentReminderAction } from "@/app/dashboard/rent/actions";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import type { PaymentReminderPreview } from "@/lib/services/rent-reminders";
import type { ReminderKind } from "@/lib/types/domain";

const KIND_LABELS: Record<ReminderKind, string> = {
  upcoming: "Upcoming (due soon)",
  due: "Due today",
  late: "Overdue",
};

function availableKinds(preview: PaymentReminderPreview): ReminderKind[] {
  return preview.eligibleKinds.filter(
    (kind) => !preview.alreadyRemindedKinds.includes(kind)
  );
}

export function SendRentReminderButton({
  paymentId,
  preview,
}: {
  paymentId: string;
  preview: PaymentReminderPreview;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const kinds = availableKinds(preview);
  const [kind, setKind] = useState<ReminderKind>(kinds[0] ?? "late");

  const disabled =
    kinds.length === 0 || preview.missingEmail || preview.eligibleKinds.length === 0;

  async function handleSend() {
    setLoading(true);
    setError(undefined);
    const result = await sendRentReminderAction(paymentId, kind);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setOpen(false);
    setLoading(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Mail className="h-4 w-4" />
        Send reminder
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">
              Send rent reminder
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Email a manual reminder to {preview.tenantName}. Nothing is sent
              until you confirm.
            </p>

            {error && (
              <Alert variant="error" className="mt-4">
                {error}
              </Alert>
            )}

            <div className="mt-4 space-y-4">
              {kinds.length > 1 ? (
                <div>
                  <label
                    htmlFor="reminder_kind"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Reminder type
                  </label>
                  <Select
                    id="reminder_kind"
                    value={kind}
                    disabled={loading}
                    onChange={(e) => setKind(e.target.value as ReminderKind)}
                  >
                    {kinds.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABELS[k]}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : kinds.length === 1 ? (
                <p className="text-sm text-slate-600">
                  Type: <Badge>{KIND_LABELS[kinds[0]]}</Badge>
                </p>
              ) : null}

              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-700">To:</span>{" "}
                  {preview.recipientEmail ?? "No email on file"}
                </p>
                {preview.propertyName && (
                  <p className="mt-1">
                    <span className="font-medium text-slate-700">Property:</span>{" "}
                    {preview.propertyName}
                  </p>
                )}
              </div>

              {preview.alreadyRemindedKinds.length > 0 && (
                <p className="text-xs text-slate-500">
                  Already sent:{" "}
                  {preview.alreadyRemindedKinds
                    .map((k) => KIND_LABELS[k])
                    .join(", ")}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSend} disabled={loading || disabled}>
                {loading ? "Sending…" : "Send email"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
