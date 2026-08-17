"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loginSchema, signUpSchema } from "@/lib/validation";
import { getSafeRedirectPath } from "@/lib/utils";

export interface AuthFormState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function getAuthRedirectUrl(): string | null {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredOrigin) {
    try {
      const url = new URL(configuredOrigin);
      const isLocalHttp =
        url.protocol === "http:" &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1");

      if (url.protocol === "https:" || isLocalHttp) {
        return new URL("/auth/callback?next=/dashboard", url).toString();
      }
    } catch {
      // Use the safe local-development fallback below.
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000/auth/callback?next=/dashboard";
  }

  return null;
}

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) {
    return {
      error:
        "Supabase isn't connected yet. Add your credentials to .env.local to enable real accounts — until then, explore the dashboard in demo mode.",
    };
  }

  const raw = {
    fullName: String(formData.get("fullName") || ""),
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    confirmPassword: String(formData.get("confirmPassword") || ""),
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const emailRedirectTo = getAuthRedirectUrl();
  if (!emailRedirectTo) {
    return {
      error:
        "Account confirmation is not configured. Contact the application administrator.",
    };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase client unavailable." };

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo,
    },
  });

  if (error) return { error: error.message };

  // Ensure a profile row only when an authenticated session is available.
  // With email confirmation enabled, the auth trigger creates the profile
  // and the callback establishes the session after verification.
  if (signUpData.user && signUpData.session) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      { id: signUpData.user.id, full_name: parsed.data.fullName },
      { onConflict: "id" }
    );
    if (profileError) {
      console.error("[signup] profile upsert failed", profileError.message);
    }
  }

  if (!signUpData.session) {
    return {
      message:
        "Check your email to confirm your account, then return here to sign in.",
    };
  }

  redirect("/dashboard");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) {
    return {
      error:
        "Supabase isn't connected yet. Add your credentials to .env.local to enable real accounts — until then, explore the dashboard in demo mode.",
    };
  }

  const raw = {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase client unavailable." };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const redirectTo = getSafeRedirectPath(
    String(formData.get("redirectTo") || "")
  );
  redirect(redirectTo);
}

export async function signOutAction() {
  if (!isSupabaseConfigured) {
    redirect("/");
  }

  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/");
}
