import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt } from "lucide-react";
import type { RentPayment } from "@/lib/types/domain";

export function RecentActivity({ payments }: { payments: RentPayment[] }) {
  const recent = [...payments]
    .filter((p) => p.payment_date)
    .sort(
      (a, b) =>
        new Date(b.payment_date!).getTime() - new Date(a.payment_date!).getTime()
    )
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent rent activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {recent.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Receipt}
              title="No payments recorded yet"
              description="Record a rent payment to see activity appear here."
              actionLabel="Record Payment"
              actionHref="/dashboard/rent/new"
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {payment.tenant?.full_name ?? "Unknown tenant"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {payment.property?.name ?? "Unknown property"} ·{" "}
                    {formatDate(payment.payment_date)}
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
