import Link from "next/link";
import { PlusCircle, Receipt, Wallet, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/Alert";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import { listRentPayments } from "@/lib/services/rent-payments";

export default async function RentPage() {
  const { data: payments, error } = await listRentPayments();

  const list = payments ?? [];
  const now = new Date();
  const thisMonth = list.filter((p) => {
    const due = new Date(p.due_date);
    return (
      due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear()
    );
  });

  const expected = thisMonth.reduce((sum, p) => sum + p.amount, 0);
  const collected = thisMonth
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const outstanding = thisMonth
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const late = list.filter((p) => p.status === "late").length;

  return (
    <div>
      <PageHeader
        title="Rent tracking"
        description="Monitor rent collection across your portfolio."
        actions={
          <ButtonLink href="/dashboard/rent/new">
            <PlusCircle className="h-4 w-4" />
            Record Payment
          </ButtonLink>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Expected this month"
          value={formatCurrency(expected)}
          icon={Wallet}
        />
        <StatCard
          label="Collected this month"
          value={formatCurrency(collected)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Outstanding this month"
          value={formatCurrency(outstanding)}
          icon={Clock}
          tone={outstanding > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Late payments"
          value={String(late)}
          icon={AlertCircle}
          tone={late > 0 ? "warning" : "default"}
        />
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No rent payments recorded"
          description="Record your first rent payment to start tracking collections."
          actionLabel="Record Payment"
          actionHref="/dashboard/rent/new"
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Tenant</th>
                  <th className="px-5 py-3 font-medium">Property</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Due date</th>
                  <th className="px-5 py-3 font-medium">Paid on</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/rent/${payment.id}/edit`}
                        className="font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {payment.tenant?.full_name ?? "Unknown tenant"}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {payment.property?.name ?? "Unknown property"}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(payment.due_date)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {payment.payment_method ? titleCase(payment.payment_method) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={payment.status} kind="payment" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
