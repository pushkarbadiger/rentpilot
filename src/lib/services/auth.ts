import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_OWNER_ID } from "@/lib/demo-data";
import type { Profile } from "@/lib/types/domain";

export interface CurrentUser {
  id: string;
  email: string | null;
  isDemo: boolean;
  profile: Profile | null;
}

/**
 * Returns the current authenticated user. In demo mode (no Supabase
 * credentials) this returns a stable synthetic "demo" user so the
 * dashboard is always browsable.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured) {
    return {
      id: DEMO_OWNER_ID,
      email: "demo@rentpilot.app",
      isDemo: true,
      profile: {
        id: DEMO_OWNER_ID,
        full_name: "Demo Landlord",
        company_name: "RentPilot Demo Portfolio",
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    isDemo: false,
    profile: profile ?? null,
  };
}
