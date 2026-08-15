import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { StripeConnectCard } from "@/components/forms/StripeConnectCard";
import { ErrorState } from "@/components/ui/Alert";
import { getProfile } from "@/lib/services/profile";
import { getCurrentUser } from "@/lib/services/auth";
import {
  createStripeConnectAccountLink,
  getStripeConnectUiState,
  syncStripeConnectAccountFromStripe,
} from "@/lib/services/stripe-connect";
import { isStripeConfigured } from "@/lib/services/stripe";
import {
  startStripeConnectOnboardingAction,
  updateProfileAction,
} from "./actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    stripe?: string;
  }>;
}) {
  const params = await searchParams;

  let stripeRefreshError: string | undefined;

  if (params.stripe === "refresh") {
    const { data, error } = await createStripeConnectAccountLink();
    if (!error && data?.url) {
      redirect(data.url);
    }
    stripeRefreshError =
      error ?? "Could not continue Stripe setup. Please try again.";
  }

  let stripeSyncError: string | undefined;
  let stripeReady = false;

  if (params.stripe === "return") {
    const syncResult = await syncStripeConnectAccountFromStripe();
    if (syncResult.error) {
      stripeSyncError = syncResult.error;
    } else {
      stripeReady = syncResult.data?.stripe_connect_charges_enabled ?? false;
    }
  }

  const [{ data: profile, error }, user] = await Promise.all([
    getProfile(),
    getCurrentUser(),
  ]);

  const { saved } = params;

  if (error || !profile) {
    return (
      <ErrorState
        message={
          error === "Not authenticated"
            ? "You must be signed in to view settings."
            : (error ?? "Unable to load profile.")
        }
      />
    );
  }

  if (!user) {
    return <ErrorState message="You must be signed in to view settings." />;
  }

  const stripeUiState = getStripeConnectUiState(profile, {
    isDemo: user.isDemo,
    isConfigured: isStripeConfigured,
  });

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and profile information."
      />

      {saved === "1" && user && !user.isDemo && (
        <Alert variant="success" className="mb-6">
          Your profile has been updated.
        </Alert>
      )}

      {params.stripe === "return" && !stripeSyncError && stripeReady && (
        <Alert variant="success" className="mb-6">
          Stripe is ready. You can collect rent from open payments on the rent
          detail page.
        </Alert>
      )}

      {params.stripe === "return" && !stripeSyncError && !stripeReady && (
        <Alert variant="warning" className="mb-6">
          Stripe setup is still in progress. Continue onboarding if Stripe asks
          for more information.
        </Alert>
      )}

      {stripeSyncError && (
        <Alert variant="error" className="mb-6">
          {stripeSyncError}
        </Alert>
      )}

      {stripeRefreshError && (
        <Alert variant="error" className="mb-6">
          {stripeRefreshError}
        </Alert>
      )}

      <div className="space-y-6">
        <Card className="max-w-lg">
          <CardContent>
            <div className="mb-6 border-b border-slate-100 pb-5">
              <p className="text-sm font-medium text-slate-900">Account</p>
              <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
            </div>
            <ProfileForm action={updateProfileAction} profile={profile} />
          </CardContent>
        </Card>

        <Card className="max-w-lg">
          <CardContent>
            <h2 className="mb-1 text-sm font-semibold text-slate-900">
              Payment collection
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Connect Stripe to receive rent payments from tenants. RentPilot
              uses Stripe Connect Express with USD checkout. Stripe account
              availability depends on your country and Stripe&apos;s policies —
              some regions (including India) may require an invite.
            </p>
            <StripeConnectCard
              uiState={stripeUiState}
              isDemo={user.isDemo}
              startOnboardingAction={startStripeConnectOnboardingAction}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
