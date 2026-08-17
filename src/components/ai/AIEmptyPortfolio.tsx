import { Bot } from "lucide-react";

export function AIEmptyPortfolio() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
        <Bot className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-slate-900">
        Not enough data yet
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">
        Your portfolio doesn&apos;t have enough data for meaningful analysis.
        Add a property and tenant first, then I can help analyze rent,
        occupancy, and collections.
      </p>
    </div>
  );
}
