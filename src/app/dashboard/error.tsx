"use client";

import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[RentPilot]", error);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-6 py-16 text-center">
      <XCircle className="mb-3 h-8 w-8 text-red-500" />
      <h2 className="text-base font-semibold text-slate-900">
        Something went wrong
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">
        We couldn&apos;t load this page. Please try again.
      </p>
      <Button className="mt-6" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
