import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — RentPilot",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo, error } = await searchParams;

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">
        Sign in to manage your rental portfolio.
      </p>
      <LoginForm redirectTo={redirectTo} authError={error} />
    </div>
  );
}
