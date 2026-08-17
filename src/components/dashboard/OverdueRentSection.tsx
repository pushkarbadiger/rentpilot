import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarClock } from "lucide-react";
import type { RentPayment } from "@/lib/types/domain";
import {
  getEffectivePaymentStatus,
} from "@/lib/services/payment-status";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

function daysOverdue(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate + "T00:00:00");
  const diff = now.getTime() - due.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function OverdueRentSection({
  payments,
}: {
  payments: RentPayment[];
}) {
  const overduePayments = [...payments]
    .filter((p) => {
      const status = getEffectivePaymentStatus(p);
      return status === "late";
    })
    .sort(
      (a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

  const totalOverdue = overduePayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  return (
    <Card className="border-red-100">
      <CardHeader className="border-red-100">
        <div className="flex items-center gap-2">
          <CardTitle className="text-red-700">Overdue</CardTitle>
          {overduePayments.length > 0 && (
            <Badge tone="red">
              {overduePayments.length} payment
              {overduePayments.length === 1 ? "" : "s"} &middot;{" "}
              {formatCurrency(totalOverdue)}
            </Badge>
          )}
        </div>
        <Link
          href="/dashboard/rent?status=late"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {overduePayments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarClock}
              title="No overdue payments"
              description="All rent payments are on track."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {overduePayments.slice(0, 5).map((payment) => {
              const overdueDays = daysOverdue(payment.due_date);
              return (
                <li key={payment.id}>
                  <Link
                    href={`/dashboard/rent/${payment.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <AlertCircle className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {payment.tenant?.full_name ?? "Unknown tenant"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {payment.property?.name ?? "Unknown property"}
                          {" · "}
                          {overdueDays === 1
                            ? "1 day overdue"
                            : `${overdueDays} days overdue`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency(payment.amount)}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
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
