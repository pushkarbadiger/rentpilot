"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { loginAction, type AuthFormState } from "@/app/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    {}
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <FormField label="Email" htmlFor="email" required error={errors.email}>
        <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
      </FormField>

      <FormField label="Password" htmlFor="password" required error={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </FormField>

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
          Create one
        </Link>
      </p>
    </form>
  );
}
