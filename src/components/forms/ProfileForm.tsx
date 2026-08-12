"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { Profile } from "@/lib/types/domain";
import type { ProfileFormState } from "@/app/dashboard/settings/actions";

export function ProfileForm({
  action,
  profile,
  submitLabel = "Save changes",
}: {
  action: (
    state: ProfileFormState,
    formData: FormData
  ) => Promise<ProfileFormState>;
  profile: Profile;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <FormField
        label="Full name"
        htmlFor="full_name"
        required
        error={errors.full_name}
      >
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ""}
          placeholder="Jamie Rivera"
          autoComplete="name"
        />
      </FormField>

      <FormField
        label="Company name"
        htmlFor="company_name"
        error={errors.company_name}
        hint="Optional — shown on your portfolio"
      >
        <Input
          id="company_name"
          name="company_name"
          defaultValue={profile.company_name ?? ""}
          placeholder="Rivera Property Group"
          autoComplete="organization"
        />
      </FormField>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
