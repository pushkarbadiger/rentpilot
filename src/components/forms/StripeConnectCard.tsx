"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { StripeConnectUiState } from "@/lib/services/stripe/types";

export function StripeConnectCard({
  uiState,
  isDemo,
  startOnboardingAction,
}: {
  uiState: StripeConnectUiState;
  isDemo: boolean;
  startOnboardingAction: () => Promise<{ error?: string }>;
}) {
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleStart() {
    setSubmitting(true);
    setError(undefined);
    const result = await startOnboardingAction();
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      {uiState === "unavailable" && (
        <p className="text-sm text-slate-600">
          {isDemo
            ? "Stripe Connect is not available in demo mode. Connect Supabase and sign in with a real account to set up payment collection."
            : "Payment collection is not configured on this server, or Stripe may not be available for your account or region. Contact your administrator or check Stripe's supported countries."}
        </p>
      )}

      {uiState === "not_connected" && (
        <>
          <p className="text-sm text-slate-600">
            Connect Stripe to collect rent from tenants. You will complete a short
            hosted onboarding flow on Stripe. RentPilot currently creates US
            Connect accounts and USD checkout sessions only.
          </p>
          <Button type="button" onClick={handleStart} disabled={submitting}>
            {submitting ? "Redirecting…" : "Set up Stripe"}
          </Button>
        </>
      )}

      {uiState === "onboarding_incomplete" && (
        <>
          <p className="text-sm text-slate-600">
            Your Stripe account setup is not finished yet. Continue onboarding to
            enable rent collection.
          </p>
          <Button type="button" onClick={handleStart} disabled={submitting}>
            {submitting ? "Redirecting…" : "Continue setup"}
          </Button>
        </>
      )}

      {uiState === "ready" && (
        <Alert variant="success">
          Stripe is ready. Use Collect rent on an open payment to create a
          checkout link for your tenant.
        </Alert>
      )}
    </div>
  );
}
