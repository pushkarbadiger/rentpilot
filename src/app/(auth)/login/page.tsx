import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — RentPilot",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">
        Sign in to manage your rental portfolio.
      </p>
      <LoginForm />
    </div>
  );
}
