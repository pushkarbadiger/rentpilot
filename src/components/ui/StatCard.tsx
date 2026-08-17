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
    <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 transition-all duration-200 hover:shadow-md hover:shadow-slate-200/60 hover:border-slate-300">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
            toneClasses
          )}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={2} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {sublabel && (
        <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
      )}
    </div>
  );
}
