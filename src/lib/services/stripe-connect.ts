import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  StripeConnectOnboardingStatus,
} from "@/lib/types/domain";
import { getCurrentUser } from "./auth";
import { getAppOrigin } from "./stripe/app-origin";
import { getStripeClient, isStripeConfigured } from "./stripe";
import type { StripeConnectUiState } from "./stripe/types";
import type { ServiceResult } from "./properties";
import { getProfile } from "./profile";

export function mapStripeAccountToProfileFields(account: Stripe.Account): {
  stripe_connect_onboarding_status: StripeConnectOnboardingStatus;
  stripe_connect_charges_enabled: boolean;
  stripe_connect_payouts_enabled: boolean;
} {
  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;

  return {
    stripe_connect_onboarding_status: chargesEnabled ? "complete" : "pending",
    stripe_connect_charges_enabled: chargesEnabled,
    stripe_connect_payouts_enabled: payoutsEnabled,
  };
}

export function getStripeConnectUiState(
  profile: Profile | null,
  options: { isDemo: boolean; isConfigured: boolean }
): StripeConnectUiState {
  if (options.isDemo || !options.isConfigured) return "unavailable";
  if (!profile?.stripe_connect_account_id) return "not_connected";
  if (!profile.stripe_connect_charges_enabled) return "onboarding_incomplete";
  return "ready";
}

async function persistStripeConnectFields(
  ownerId: string,
  fields: {
    stripe_connect_account_id?: string | null;
    stripe_connect_onboarding_status?: StripeConnectOnboardingStatus;
    stripe_connect_charges_enabled?: boolean;
    stripe_connect_payouts_enabled?: boolean;
  }
): Promise<ServiceResult<Profile>> {
  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", ownerId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[stripe-connect] profile update failed", error.message);
    return {
      data: null,
      error: "Could not save Stripe account status. Please try again.",
    };
  }

  if (!data) {
    return { data: null, error: "Could not save Stripe account status. Please try again." };
  }

  return { data: data as Profile, error: null };
}

async function requireStripeLandlord(): Promise<
  ServiceResult<{
    userId: string;
    email: string | null;
    profile: Profile;
  }>
> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    return {
      data: null,
      error: "Stripe Connect is not available in demo mode.",
    };
  }

  if (!isStripeConfigured) {
    return {
      data: null,
      error: "Payment collection is not configured. Contact your administrator.",
    };
  }

  const profileResult = await getProfile();
  if (profileResult.error || !profileResult.data) {
    return {
      data: null,
      error: profileResult.error ?? "Could not load your profile. Please try again.",
    };
  }

  if (profileResult.data.id !== user.id) {
    return { data: null, error: "Could not load your profile. Please try again." };
  }

  return {
    data: {
      userId: user.id,
      email: user.email,
      profile: profileResult.data,
    },
    error: null,
  };
}

/**
 * Returns an existing Connect account id or creates a new Express account.
 * Never creates a second account when one is already stored for the landlord.
 */
export async function ensureStripeConnectAccount(): Promise<
  ServiceResult<{ accountId: string; profile: Profile }>
> {
  const ctx = await requireStripeLandlord();
  if (ctx.error || !ctx.data) {
    return { data: null, error: ctx.error ?? "Could not start Stripe setup." };
  }

  const { userId, email, profile } = ctx.data;

  if (profile.stripe_connect_account_id) {
    return {
      data: {
        accountId: profile.stripe_connect_account_id,
        profile,
      },
      error: null,
    };
  }

  try {
    const stripe = getStripeClient();
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        rentpilot_owner_id: userId,
      },
    });

    const updated = await persistStripeConnectFields(userId, {
      stripe_connect_account_id: account.id,
      stripe_connect_onboarding_status: "pending",
      stripe_connect_charges_enabled: false,
      stripe_connect_payouts_enabled: false,
    });

    if (updated.error || !updated.data) {
      return { data: null, error: updated.error ?? "Could not save Stripe account." };
    }

    return { data: { accountId: account.id, profile: updated.data }, error: null };
  } catch (err) {
    console.error("[stripe-connect] account create failed", err);
    return {
      data: null,
      error: "Could not set up Stripe. Please try again.",
    };
  }
}

/** Creates a Stripe-hosted Account Link for Express onboarding. */
export async function createStripeConnectAccountLink(): Promise<
  ServiceResult<{ url: string }>
> {
  const ensured = await ensureStripeConnectAccount();
  if (ensured.error || !ensured.data) {
    return { data: null, error: ensured.error ?? "Could not start Stripe setup." };
  }

  const origin = await getAppOrigin();
  const returnUrl = `${origin}/dashboard/settings?stripe=return`;
  const refreshUrl = `${origin}/dashboard/settings?stripe=refresh`;

  try {
    const stripe = getStripeClient();
    const accountLink = await stripe.accountLinks.create({
      account: ensured.data.accountId,
      type: "account_onboarding",
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    if (!accountLink.url) {
      return { data: null, error: "Could not start Stripe setup. Please try again." };
    }

    return { data: { url: accountLink.url }, error: null };
  } catch (err) {
    console.error("[stripe-connect] account link create failed", err);
    return {
      data: null,
      error: "Could not start Stripe setup. Please try again.",
    };
  }
}

/** Retrieves Connect account status from Stripe and persists it on the profile. */
export async function syncStripeConnectAccountFromStripe(): Promise<
  ServiceResult<Profile>
> {
  const ctx = await requireStripeLandlord();
  if (ctx.error || !ctx.data) {
    return { data: null, error: ctx.error ?? "Could not refresh Stripe status." };
  }

  const { userId, profile } = ctx.data;
  const accountId = profile.stripe_connect_account_id;

  if (!accountId) {
    return { data: profile, error: null };
  }

  try {
    const stripe = getStripeClient();
    const account = await stripe.accounts.retrieve(accountId);
    const fields = mapStripeAccountToProfileFields(account);

    return persistStripeConnectFields(userId, fields);
  } catch (err) {
    console.error("[stripe-connect] account retrieve failed", err);
    return {
      data: null,
      error: "Could not refresh Stripe status. Please try again.",
    };
  }
}
