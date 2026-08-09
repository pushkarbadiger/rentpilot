import type { Metadata } from "next";
import { SignUpForm } from "@/components/forms/SignUpForm";

export const metadata: Metadata = {
  title: "Create account — RentPilot",
};

export default function SignUpPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">
        Start managing your rental portfolio in minutes.
      </p>
      <SignUpForm />
    </div>
  );
}
