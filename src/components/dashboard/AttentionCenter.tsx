import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  ExternalLink,
} from "lucide-react";
import type { RentPayment } from "@/lib/types/domain";
import { getEffectivePaymentStatus } from "@/lib/services/payment-status";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

interface AttentionItem {
  id: string;
  type: "late" | "due" | "vacant";
  tenant: string;
  property: string;
  amount: number;
  dueDate: string;
  paymentId?: string;
}

export function AttentionCenter({
  payments,
  vacantUnits,
  latePayments,
}: {
  payments: RentPayment[];
  vacantUnits: number;
  latePayments: number;
}) {
  const items: AttentionItem[] = [];

  // Late payments (highest severity)
  const latePaymentsList = [...payments]
    .filter((p) => getEffectivePaymentStatus(p) === "late")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  for (const payment of latePaymentsList.slice(0, 3)) {
    items.push({
      id: `late-${payment.id}`,
      type: "late",
      tenant: payment.tenant?.full_name ?? "Unknown tenant",
      property: payment.property?.name ?? "Unknown property",
      amount: payment.amount,
      dueDate: payment.due_date,
      paymentId: payment.id,
    });
  }

  // Upcoming/due payments
  const duePayments = [...payments]
    .filter((p) => {
      const status = getEffectivePaymentStatus(p);
      return status === "pending";
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  for (const payment of duePayments.slice(0, 2)) {
    items.push({
      id: `due-${payment.id}`,
      type: "due",
      tenant: payment.tenant?.full_name ?? "Unknown tenant",
      property: payment.property?.name ?? "Unknown property",
      amount: payment.amount,
      dueDate: payment.due_date,
      paymentId: payment.id,
    });
  }

  // Vacant units (lower severity)
  if (vacantUnits > 0) {
    items.push({
      id: "vacant",
      type: "vacant",
      tenant: `${vacantUnits} vacant unit${vacantUnits === 1 ? "" : "s"}`,
      property: "Across portfolio",
      amount: 0,
      dueDate: "",
    });
  }

  const displayItems = items.slice(0, 5);

  const typeConfig = {
    late: {
      icon: AlertCircle,
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-100",
      label: "Overdue",
    },
    due: {
      icon: CalendarClock,
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
      label: "Due soon",
    },
    vacant: {
      icon: DoorOpen,
      bg: "bg-slate-50",
      text: "text-slate-600",
      border: "border-slate-100",
      label: "Vacancy",
    },
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Needs your attention</CardTitle>
            {latePayments > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                {latePayments} overdue
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Items requiring action, sorted by urgency.
          </p>
        </div>
        <Link
          href="/dashboard/rent"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          View all payments
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {displayItems.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CheckCircle2}
              title="All caught up"
              description="No open payment items or vacancies need attention right now."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {displayItems.map((item) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={
                      item.paymentId
                        ? `/dashboard/rent/${item.paymentId}`
                        : "/dashboard/properties"
                    }
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg} ${config.text}`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {item.tenant}
                          </p>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${config.bg} ${config.text} ring-1 ring-inset ${config.border}`}
                          >
                            {config.label}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {item.property}
                          {item.dueDate && ` · Due ${formatDate(item.dueDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {item.amount > 0 && (
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(item.amount)}
                        </span>
                      )}
                      <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
