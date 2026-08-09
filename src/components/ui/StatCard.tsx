import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  sublabel,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "success";
  sublabel?: string;
}) {
  const toneClasses = {
    default: "bg-indigo-50 text-indigo-600",
    warning: "bg-amber-50 text-amber-600",
    success: "bg-emerald-50 text-emerald-600",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneClasses)}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}
    </div>
  );
}
