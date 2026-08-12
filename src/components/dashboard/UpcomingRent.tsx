import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isPaymentOpen } from "@/lib/services/metrics";
import { CalendarClock } from "lucide-react";
import type { RentPayment } from "@/lib/types/domain";

export function UpcomingRent({ payments }: { payments: RentPayment[] }) {
  const upcoming = [...payments]
    .filter((p) => isPaymentOpen(p))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming &amp; due rent</CardTitle>
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
            {upcoming.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {payment.tenant?.full_name ?? "Unknown tenant"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    Due {formatDate(payment.due_date)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(payment.amount)}
                  </span>
                  <PaymentStatusBadge payment={payment} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
