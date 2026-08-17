import { Sparkles } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50/80 px-4 py-2 text-xs text-indigo-700 backdrop-blur-sm sm:px-6">
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
      <p>
        You&apos;re viewing RentPilot with sample data. Connect Supabase
        (see{" "}
        <code className="rounded bg-indigo-100/80 px-1 py-0.5 font-mono text-[11px]">
          .env.example
        </code>
        ) to save real properties, tenants, and payments.
      </p>
    </div>
  );
}
