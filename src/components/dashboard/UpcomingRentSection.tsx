import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { RentPayment } from "@/lib/types/domain";
import { getEffectivePaymentStatus } from "@/lib/services/payment-status";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export function UpcomingRentSection({
  payments,
}: {
  payments: RentPayment[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingPayments = [...payments]
    .filter((p) => {
      const status = getEffectivePaymentStatus(p);
      if (status !== "pending") return false;
      const due = new Date(p.due_date + "T00:00:00");
      return due >= today;
    })
    .sort(
      (a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

  const totalUpcoming = upcomingPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Upcoming rent</CardTitle>
          {upcomingPayments.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
              {upcomingPayments.length} due &middot;{" "}
              {formatCurrency(totalUpcoming)}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/rent?status=pending"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {upcomingPayments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarClock}
              title="No upcoming rent"
              description="No pending payments are due soon."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcomingPayments.slice(0, 5).map((payment) => {
              const dueDate = new Date(payment.due_date + "T00:00:00");
              const isDueToday =
                dueDate.getTime() === today.getTime();
              return (
                <li key={payment.id}>
                  <Link
                    href={`/dashboard/rent/${payment.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <CalendarClock className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {payment.tenant?.full_name ?? "Unknown tenant"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {payment.property?.name ?? "Unknown property"}
                          {" · "}
                          {isDueToday
                            ? "Due today"
                            : `Due ${formatDate(payment.due_date)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
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
