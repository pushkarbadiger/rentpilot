import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { isPaymentOpen } from "@/lib/services/metrics";
import { isPaymentOverdue } from "@/lib/services/payment-status";
import { CalendarClock, ArrowRight } from "lucide-react";
import type { RentPayment } from "@/lib/types/domain";

export function UpcomingRent({ payments }: { payments: RentPayment[] }) {
  const upcoming = [...payments]
    .filter((p) => isPaymentOpen(p))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Upcoming &amp; due rent</CardTitle>
          {upcoming.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {upcoming.length} open payment{upcoming.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {upcoming.length > 0 && (
          <Link
            href="/dashboard/rent"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {upcoming.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarClock}
              title="Nothing due right now"
              description="Rent due dates and overdue payments will show up here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((payment) => {
              const overdue = isPaymentOverdue(payment.due_date);
              return (
                <li key={payment.id}>
                  <Link
                    href={`/dashboard/rent/${payment.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {payment.tenant?.full_name ?? "Unknown tenant"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <p className="truncate text-xs text-slate-500">
                          {payment.property?.name ?? "Unknown property"}
                        </p>
                        <span className="text-xs text-slate-300">·</span>
                        <p
                          className={`text-xs font-medium ${
                            overdue ? "text-red-600" : "text-slate-500"
                          }`}
                        >
                          Due {formatDateShort(payment.due_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(payment.amount)}
                      </span>
                      <PaymentStatusBadge payment={payment} />
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
