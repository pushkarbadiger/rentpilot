"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loginSchema, signUpSchema } from "@/lib/validation";
import { getSafeRedirectPath } from "@/lib/utils";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
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

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase client unavailable." };

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) return { error: error.message };

  // Belt-and-suspenders: ensure a profile row exists when the session is
  // active (trigger may be missing on older Supabase projects).
  if (signUpData.user) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      { id: signUpData.user.id, full_name: parsed.data.fullName },
      { onConflict: "id" }
    );
    if (profileError) {
      console.error("[signup] profile upsert failed", profileError.message);
    }
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
