import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import type { Profile } from "@/lib/types/domain";
import type { ProfileFormValues } from "@/lib/validation";
import { getCurrentUser } from "./auth";
import type { ServiceResult } from "./properties";

type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/**
 * Detects whether the live profiles table has company_name.
 * Older Supabase projects may predate the column in 0001_init.sql.
 */
async function profileTableSupportsCompanyName(
  supabase: SupabaseServerClient
): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .select("company_name")
    .limit(0);

  if (!error) return true;

  if (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message.includes("company_name")
  ) {
    return false;
  }

  console.error("[profile] company_name column probe failed", {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
  return false;
}

function logProfileUpdateError(error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}) {
  if (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message?.includes("company_name")
  ) {
    console.error(
      "[profile] update failed: profiles.company_name column missing — run supabase/migrations/0002_profiles_company_name.sql in the Supabase SQL editor",
      { code: error.code, details: error.details, hint: error.hint }
    );
    return;
  }

  console.error("[profile] update failed", {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

/**
 * Creates a profile row for the currently authenticated user when one does
 * not exist yet. Uses the anon client + RLS (auth.uid() = id) — no
 * service-role key. Safe for users who signed up before the DB trigger
 * was installed or when the trigger did not fire.
 */
async function ensureProfileForCurrentUser(): Promise<ServiceResult<Profile>> {
  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Not authenticated" };

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("[profile] fetch failed", fetchError.message);
    return { data: null, error: "Could not load your profile. Please try again." };
  }

  if (existing) return { data: existing as Profile, error: null };

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: user.id, full_name: fullName })
    .select("*")
    .single();

  if (insertError) {
    // Another request may have created the row concurrently — re-fetch once.
    const { data: raced, error: raceError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!raceError && raced) return { data: raced as Profile, error: null };

    console.error("[profile] initialize failed", insertError.message);
    return {
      data: null,
      error: "Could not initialize your profile. Please try again.",
    };
  }

  return { data: created as Profile, error: null };
}

export async function getProfile(): Promise<ServiceResult<Profile>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  if (user.isDemo) {
    if (!user.profile) {
      return { data: null, error: "Could not load your profile. Please try again." };
    }
    return { data: user.profile, error: null };
  }

  if (user.profile) return { data: user.profile, error: null };

  return ensureProfileForCurrentUser();
}

export async function updateProfile(
  values: ProfileFormValues
): Promise<ServiceResult<Profile>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const cleaned = {
    full_name: values.full_name,
    company_name: values.company_name || null,
  };

  if (user.isDemo) {
    const now = new Date().toISOString();
    return {
      data: {
        id: user.id,
        full_name: cleaned.full_name,
        company_name: cleaned.company_name,
        avatar_url: user.profile?.avatar_url ?? null,
        stripe_connect_account_id:
          user.profile?.stripe_connect_account_id ?? null,
        stripe_connect_onboarding_status:
          user.profile?.stripe_connect_onboarding_status ?? "not_started",
        stripe_connect_charges_enabled:
          user.profile?.stripe_connect_charges_enabled ?? false,
        stripe_connect_payouts_enabled:
          user.profile?.stripe_connect_payouts_enabled ?? false,
        created_at: user.profile?.created_at ?? now,
        updated_at: now,
      },
      error: null,
    };
  }

  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { data: null, error: "Not authenticated" };
  }

  // Ensure a row exists before updating (handles legacy users without profiles).
  if (!user.profile) {
    const ensured = await ensureProfileForCurrentUser();
    if (ensured.error || !ensured.data) {
      return {
        data: null,
        error: ensured.error ?? "Could not initialize your profile. Please try again.",
      };
    }
  }

  const supportsCompanyName = await profileTableSupportsCompanyName(supabase);

  if (!supportsCompanyName && cleaned.company_name) {
    console.error(
      "[profile] update blocked: company_name column missing — run supabase/migrations/0002_profiles_company_name.sql"
    );
    return { data: null, error: "Could not update your profile. Please try again." };
  }

  const updatePayload: ProfilesUpdate = {
    full_name: cleaned.full_name,
  };

  if (supportsCompanyName) {
    updatePayload.company_name = cleaned.company_name;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", authUser.id)
    .select("*")
    .maybeSingle();

  if (error) {
    logProfileUpdateError(error);
    return { data: null, error: "Could not update your profile. Please try again." };
  }

  if (!data) {
    console.error("[profile] update returned no row", { profileId: authUser.id });
    return { data: null, error: "Could not update your profile. Please try again." };
  }

  return { data: data as Profile, error: null };
}
