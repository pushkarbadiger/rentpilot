import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const variantStyles: Record<
  AlertVariant,
  { wrap: string; icon: typeof Info }
> = {
  info: { wrap: "bg-indigo-50 text-indigo-800 ring-indigo-200", icon: Info },
  success: {
    wrap: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    icon: CheckCircle2,
  },
  warning: {
    wrap: "bg-amber-50 text-amber-800 ring-amber-200",
    icon: AlertTriangle,
  },
  error: { wrap: "bg-red-50 text-red-800 ring-red-200", icon: XCircle },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { wrap, icon: Icon } = variantStyles[variant];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset",
        wrap,
        className
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="mt-0.5 text-sm opacity-90">{children}</div>}
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 px-6 py-12 text-center">
      <XCircle className="mb-3 h-8 w-8 text-red-500" />
      <h3 className="text-base font-semibold text-slate-900">
        Something went wrong
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  );
}
