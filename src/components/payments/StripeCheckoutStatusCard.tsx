"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import {
  checkoutDisplayLabel,
  type CheckoutSessionDisplay,
} from "@/lib/services/stripe/checkout-display";
import type { RentPaymentStripeStatus } from "@/lib/services/stripe-checkout-sessions";
import { formatCurrencyPrecise, formatDate } from "@/lib/utils";

function badgeTone(
  state: CheckoutSessionDisplay["displayState"]
): "neutral" | "green" | "amber" | "red" | "blue" | "slate" {
  switch (state) {
    case "reconciled":
      return "green";
    case "failed":
      return "red";
    case "stale":
    case "expired":
      return "amber";
    case "processing_uncertain":
      return "blue";
    default:
      return "neutral";
  }
}

function SessionRow({ session }: { session: CheckoutSessionDisplay }) {
  const [copied, setCopied] = useState(false);
  const canOpen =
    session.displayState === "awaiting_payment" && Boolean(session.checkoutUrl);

  async function handleCopy() {
    if (!session.checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(session.checkoutUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — no internal error details shown.
    }
  }

  return (
    <li className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-900">
              {formatCurrencyPrecise(session.amountCents / 100)}
            </p>
            <Badge tone={badgeTone(session.displayState)}>
              {checkoutDisplayLabel(session.displayState)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Created {formatDate(session.createdAt)}
            {session.reconciledAt && (
              <> · Recorded {formatDate(session.reconciledAt)}</>
            )}
            {session.completedAt &&
              !session.reconciledAt &&
              session.displayState === "processing_uncertain" && (
                <> · Completed {formatDate(session.completedAt)}</>
              )}
          </p>
        </div>
        {canOpen && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() =>
                window.open(session.checkoutUrl!, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="h-4 w-4" />
              Open payment page
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-600">{session.message}</p>
    </li>
  );
}

export function StripeCheckoutStatusCard({
  status,
}: {
  status: RentPaymentStripeStatus;
}) {
  if (status.isDemo) {
    if (status.sessions.length === 0) {
      return (
        <Alert variant="info" className="max-w-3xl">
          Payment collection is simulated in demo mode. No real payment links are
          created and no payment provider credentials are required.
        </Alert>
      );
    }

    return (
      <div className="max-w-3xl space-y-4">
        <Alert variant="warning">
          Demo preview — these collection sessions are simulated. No payment
          provider API calls are made and no real payments can be collected.
        </Alert>
        {status.headline && (
          <p className="text-sm font-medium text-slate-900">{status.headline}</p>
        )}
        <ul className="space-y-3">
          {status.sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </ul>
      </div>
    );
  }

  if (!status.stripeConfigured && !status.isDemo) {
    return null;
  }

  if (status.sessions.length === 0) {
    return null;
  }

  return (
    <div className="max-w-3xl space-y-4">
      {status.headline && (
        <p className="text-sm font-medium text-slate-900">{status.headline}</p>
      )}
      <ul className="space-y-3">
        {status.sessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </ul>
    </div>
  );
}
