import { cn, formatStatusLabel } from "@/lib/utils";

type Tone = "neutral" | "green" | "amber" | "red" | "blue" | "slate";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  blue: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  slate: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const propertyStatusTone: Record<string, Tone> = {
  active: "green",
  inactive: "slate",
  occupied: "green",
  vacant: "amber",
};

const tenantStatusTone: Record<string, Tone> = {
  active: "green",
  pending: "amber",
  former: "slate",
  inactive: "slate",
};

const paymentStatusTone: Record<string, Tone> = {
  paid: "green",
  pending: "blue",
  late: "red",
  overdue: "red",
  open: "amber",
  partial: "amber",
};

export function StatusBadge({
  status,
  kind,
}: {
  status: string;
  kind: "property" | "tenant" | "payment";
}) {
  const map =
    kind === "property"
      ? propertyStatusTone
      : kind === "tenant"
        ? tenantStatusTone
        : paymentStatusTone;

  return (
    <Badge tone={map[status] ?? "neutral"}>
      {formatStatusLabel(status)}
    </Badge>
  );
}
