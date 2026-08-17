// Central place that decides whether Supabase is configured.
// Phase 1 is designed to run fully in "demo mode" (no Supabase env vars)
// so the frontend is always usable during development, before a project
// is connected.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  "";

/**
 * True once real Supabase credentials are present. When false, every
 * service function falls back to realistic in-memory demo data instead
 * of touching the network, and auth pages explain that demo mode is active.
 */
export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 &&
  SUPABASE_ANON_KEY.length > 0 &&
  !SUPABASE_URL.includes("your-project");
