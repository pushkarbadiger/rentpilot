"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, DollarSign, ExternalLink } from "lucide-react";
import { createRentCheckoutSessionAction } from "@/app/dashboard/rent/actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { RentCollectEligibility } from "@/lib/services/stripe-checkout";

export function CollectRentButton({
  paymentId,
  eligibility,
}: {
  paymentId: string;
  eligibility: RentCollectEligibility;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!eligibility.canCollect) {
    if (
      eligibility.reason === "connect_not_ready" ||
      eligibility.reason === "not_connected"
    ) {
      return (
        <ButtonLink href="/dashboard/settings" variant="outline">
          <DollarSign className="h-4 w-4" />
          Complete Stripe setup
        </ButtonLink>
      );
    }
    return null;
  }

  async function handleCollect() {
    setLoading(true);
    setError(undefined);

    const result = await createRentCheckoutSessionAction(paymentId);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data?.collectionUrl) {
      setCheckoutUrl(result.data.collectionUrl);
    }
  }

  async function handleCopy() {
    if (!checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link. Please copy it manually.");
    }
  }

  if (checkoutUrl) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Alert variant="info" className="max-w-md">
          Payment link created. Waiting for payment confirmation.
        </Alert>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() =>
              window.open(checkoutUrl, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="h-4 w-4" />
            Open payment page
          </Button>
          <Button type="button" variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy payment link"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={handleCollect} disabled={loading}>
        <DollarSign className="h-4 w-4" />
        {loading
          ? "Creating…"
          : eligibility.simulated
            ? "Simulate collect rent"
            : "Collect rent"}
      </Button>
      {error && (
        <Alert variant="error" className="max-w-md">
          {error}
          {error.includes("Stripe setup") && (
            <>
              {" "}
              <Link href="/dashboard/settings" className="font-medium underline">
                Go to Settings
              </Link>
            </>
          )}
        </Alert>
      )}
    </div>
  );
}
