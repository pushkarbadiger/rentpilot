"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { signUpAction, type AuthFormState } from "@/app/auth/actions";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signUpAction,
    {}
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName}>
        <Input id="fullName" name="fullName" placeholder="Jamie Rivera" autoComplete="name" />
      </FormField>

      <FormField label="Email" htmlFor="email" required error={errors.email}>
        <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
      </FormField>

      <FormField label="Password" htmlFor="password" required error={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </FormField>

      <FormField
        label="Confirm password"
        htmlFor="confirmPassword"
        required
        error={errors.confirmPassword}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />
      </FormField>

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}
