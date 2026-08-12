"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { profileSchema, flattenZodErrors } from "@/lib/validation";
import { pathWithDemoNoticeIfNeeded } from "@/lib/demo-write";
import { updateProfile } from "@/lib/services/profile";

export interface ProfileFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const raw = {
    full_name: String(formData.get("full_name") || ""),
    company_name: String(formData.get("company_name") || ""),
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error) };
  }

  const { error } = await updateProfile(parsed.data);
  if (error) return { error };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  redirect(await pathWithDemoNoticeIfNeeded("/dashboard/settings?saved=1"));
}
