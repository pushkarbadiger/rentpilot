import {
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Receipt,
} from "lucide-react";
import type { RentPayment } from "@/lib/types/domain";
import { getEffectivePaymentStatus } from "@/lib/services/payment-status";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface StatusGroup {
  key: string;
  label: string;
  count: number;
  amount: number;
  icon: React.ElementType;
  bgClass: string;
  textClass: string;
}

export function RentStatusBreakdown({
  payments,
  totalExpected,
}: {
  payments: RentPayment[];
  totalExpected: number;
}) {
  const groups: StatusGroup[] = [
    {
      key: "paid",
      label: "Paid",
      count: 0,
      amount: 0,
      icon: CheckCircle2,
      bgClass: "bg-emerald-50",
      textClass: "text-emerald-600",
    },
    {
      key: "pending",
      label: "Pending",
      count: 0,
      amount: 0,
      icon: Clock,
      bgClass: "bg-indigo-50",
      textClass: "text-indigo-600",
    },
    {
      key: "partial",
      label: "Partial",
      count: 0,
      amount: 0,
      icon: CreditCard,
      bgClass: "bg-amber-50",
      textClass: "text-amber-600",
    },
    {
      key: "late",
      label: "Overdue",
      count: 0,
      amount: 0,
      icon: AlertCircle,
      bgClass: "bg-red-50",
      textClass: "text-red-600",
    },
    {
      key: "open",
      label: "Open",
      count: 0,
      amount: 0,
      icon: Receipt,
      bgClass: "bg-slate-100",
      textClass: "text-slate-600",
    },
  ];

  for (const payment of payments) {
    const status = getEffectivePaymentStatus(payment);
    const group = groups.find((g) => g.key === status);
    if (!group) continue;
    group.count++;
    group.amount += payment.amount;
  }

  const hasData = payments.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection status</CardTitle>
        <span className="text-xs text-slate-500">
          {totalExpected > 0 && hasData
            ? `${formatCurrency(totalExpected)} expected this period`
            : "No payment records yet"}
        </span>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
            <Receipt className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              No payment records yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Generate recurring rent to create payment records
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const Icon = group.icon;
              const pct = totalExpected > 0
                ? Math.round((group.amount / totalExpected) * 100)
                : 0;
              return (
                <div key={group.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-md ${group.bgClass} ${group.textClass}`}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {group.label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {group.count}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(group.amount)}
                    </span>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                        group.key === "paid"
                          ? "bg-emerald-500"
                          : group.key === "pending"
                            ? "bg-indigo-500"
                            : group.key === "partial"
                              ? "bg-amber-500"
                              : group.key === "late"
                                ? "bg-red-500"
                                : "bg-slate-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
