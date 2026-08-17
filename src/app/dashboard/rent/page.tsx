import Link from "next/link";
import {
  PlusCircle,
  Receipt,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert, ErrorState } from "@/components/ui/Alert";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
  formatPaymentMethod,
} from "@/lib/utils";
import { getPaymentOutstandingAmount, isPaymentDueInMonth } from "@/lib/services/metrics";
import { getRentMonthMetrics } from "@/lib/services/dashboard";
import { listRentPaymentsPage } from "@/lib/services/rent-payments";
import { listTenants } from "@/lib/services/tenants";
import { listProperties } from "@/lib/services/properties";
import { getRecentMonthOptions, parseListQuery } from "@/lib/list-query";
import { DeleteRentPaymentButton } from "@/components/forms/DeleteRentPaymentButton";
import { GenerateRecurringRentForm } from "@/components/forms/GenerateRecurringRentForm";
import { BatchRentReminderForm } from "@/components/forms/BatchRentReminderForm";
import {
  generateRecurringRentAction,
  previewBatchRentReminderAction,
} from "./actions";
import {
  getCurrentBillingMonth,
  previewRecurringRentGeneration,
} from "@/lib/services/recurring-rent";
import { getBatchRentReminderPreview } from "@/lib/services/rent-reminders";
import { getCurrentUser } from "@/lib/services/auth";
import { RentStatusBreakdown } from "@/components/dashboard/RentStatusBreakdown";
import { OverdueRentSection } from "@/components/dashboard/OverdueRentSection";
import { UpcomingRentSection } from "@/components/dashboard/UpcomingRentSection";
import { listRentPayments } from "@/lib/services/rent-payments";

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const generateMonth =
    typeof params.generateMonth === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(params.generateMonth)
      ? params.generateMonth
      : getCurrentBillingMonth();
  const monthOptions = getRecentMonthOptions(36);

  const [
    paymentsResult,
    allPaymentsResult,
    metricsResult,
    tenantsResult,
    propertiesResult,
    previewResult,
    batchReminderPreviewResult,
    user,
  ] = await Promise.all([
    listRentPaymentsPage(query),
    listRentPayments(),
    getRentMonthMetrics(),
    listTenants(),
    listProperties(),
    previewRecurringRentGeneration(generateMonth),
    getBatchRentReminderPreview("late"),
    getCurrentUser(),
  ]);

  const { data: result, error } = paymentsResult;
  const list = result?.items ?? [];
  const allPayments = allPaymentsResult.data ?? [];
  const metrics = metricsResult.data;
  const tenantRentById = new Map(
    (tenantsResult.data ?? []).map((t) => [t.id, t.monthly_rent] as const)
  );
  const hasFilters = Boolean(
    query.q || query.status || query.propertyId || query.month
  );
  const propertyOptions =
    propertiesResult.data?.map((p) => ({ value: p.id, label: p.name })) ?? [];
  const generationPreview = previewResult.data;
  const batchReminderPreview = batchReminderPreviewResult.data;
  const generated = params.generated === "1";
  const createdCount = Number(params.created ?? "0");
  const batchReminderDone = params.batchReminder === "1";
  const batchSent = Number(params.sent ?? "0");
  const batchFailed = Number(params.failed ?? "0");
  const batchEligible = Number(params.eligible ?? "0");
  const batchMissingEmail = Number(params.missingEmail ?? "0");
  const batchAlreadyReminded = Number(params.alreadyReminded ?? "0");

  const totalExpected = metrics?.expectedRent ?? 0;
  const currentMonthPayments = allPayments.filter((p) =>
    isPaymentDueInMonth(p, new Date())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Rent operations"
          description="See what is due, identify who has not paid, take action, and track the result."
        />
        <ButtonLink href="/dashboard/rent/new">
          <PlusCircle className="h-4 w-4" />
          Record Payment
        </ButtonLink>
      </div>

      {generated && user && !user.isDemo && (
        <Alert variant="success">
          {createdCount > 0
            ? `Generated ${createdCount} rent record${createdCount === 1 ? "" : "s"}.`
            : "Rent generation complete — no new records were needed."}
        </Alert>
      )}

      {batchReminderDone && (
        <Alert variant={batchFailed > 0 ? "warning" : "success"}>
          {user?.isDemo ? "Simulated batch — no emails were sent. " : ""}
          {batchEligible} eligible · {batchSent} sent
          {batchFailed > 0 ? ` · ${batchFailed} failed` : ""}
          {batchMissingEmail > 0
            ? ` · ${batchMissingEmail} skipped (missing email)`
            : ""}
          {batchAlreadyReminded > 0
            ? ` · ${batchAlreadyReminded} already reminded`
            : ""}
        </Alert>
      )}

      {metrics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Due this month"
            value={formatCurrency(metrics.expectedRent)}
            icon={Wallet}
            sublabel={`${allPayments.filter((p) => p.status !== "paid").length} open records`}
          />
          <StatCard
            label="Collected"
            value={formatCurrency(metrics.rentCollected)}
            icon={CheckCircle2}
            tone="success"
            sublabel="Paid this month"
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(metrics.outstandingRent)}
            icon={Clock}
            tone={metrics.outstandingRent > 0 ? "warning" : undefined}
            sublabel="Unpaid balance"
          />
          <StatCard
            label="Overdue"
            value={String(metrics.latePayments)}
            icon={AlertCircle}
            tone={metrics.latePayments > 0 ? "warning" : undefined}
            sublabel={
              metrics.latePayments > 0
                ? "Requires follow-up"
                : "All on track"
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RentStatusBreakdown
            payments={currentMonthPayments}
            totalExpected={totalExpected}
          />
        </div>
        <div className="lg:col-span-1">
          <OverdueRentSection payments={allPayments} />
        </div>
        <div className="lg:col-span-1">
          <UpcomingRentSection payments={allPayments} />
        </div>
      </div>

      {previewResult.error ? (
        <Alert variant="error">
          {previewResult.error}
        </Alert>
      ) : (
        generationPreview && (
          <Card>
            <CardContent>
              <h2 className="mb-1 text-sm font-semibold text-slate-900">
                Generate monthly rent
              </h2>
              <p className="mb-4 text-sm text-slate-500">
                Create pending rent records for active tenants who do not already
                have a payment for the selected month.
              </p>
              <GenerateRecurringRentForm
                action={generateRecurringRentAction}
                monthOptions={monthOptions}
                selectedMonth={generateMonth}
                preview={generationPreview}
              />
            </CardContent>
          </Card>
        )
      )}

      {batchReminderPreview && (
        <Card>
          <CardContent>
            <h2 className="mb-1 text-sm font-semibold text-slate-900">
              Send rent reminders
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Manually email tenants about upcoming, due, or overdue rent. Each
              payment can receive one reminder per type.
            </p>
            <BatchRentReminderForm
              previewAction={previewBatchRentReminderAction}
              initialKind="late"
              initialPreview={batchReminderPreview}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          All rent payments
        </h2>
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          Financial overview
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ListToolbar
        query={query}
        searchPlaceholder="Search tenant or property…"
        statusOptions={[
          { value: "open", label: "Open (unpaid)" },
          { value: "paid", label: "Paid" },
          { value: "pending", label: "Pending" },
          { value: "late", label: "Late" },
          { value: "partial", label: "Partial" },
        ]}
        propertyOptions={propertyOptions}
        monthOptions={monthOptions}
        sortOptions={[
          { value: "due_date", label: "Due date" },
          { value: "amount", label: "Amount" },
          { value: "status", label: "Status" },
          { value: "created_at", label: "Date recorded" },
        ]}
      />

      {error ? (
        <ErrorState message={error} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={hasFilters ? "No matching payments" : "No rent payments recorded"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Record your first rent payment to start tracking collections."
          }
          actionLabel={hasFilters ? undefined : "Record Payment"}
          actionHref={hasFilters ? undefined : "/dashboard/rent/new"}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Tenant</th>
                  <th className="px-5 py-3 font-medium">Property</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Outstanding</th>
                  <th className="px-5 py-3 font-medium">Due date</th>
                  <th className="px-5 py-3 font-medium">Paid on</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((payment) => {
                  const tenantRent = tenantRentById.get(payment.tenant_id);
                  const outstanding = getPaymentOutstandingAmount(
                    payment,
                    tenantRent
                  );

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/rent/${payment.id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600"
                        >
                          {payment.tenant?.full_name ?? "Unknown tenant"}
                        </Link>
                        {payment.property?.name && (
                          <p className="text-xs text-slate-500 lg:hidden">
                            {payment.property.name}
                          </p>
                        )}
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 lg:table-cell">
                        {payment.property?.name ?? "Unknown property"}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {formatCurrencyPrecise(payment.amount)}
                        {payment.status === "partial" && tenantRent != null && (
                          <p className="text-xs font-normal text-slate-500">
                            of {formatCurrency(tenantRent)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {outstanding > 0
                          ? formatCurrencyPrecise(outstanding)
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {formatDate(payment.due_date)}
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 sm:table-cell">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 md:table-cell">
                        {formatPaymentMethod(payment.payment_method)}
                      </td>
                      <td className="px-5 py-3">
                        <PaymentStatusBadge payment={payment} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/rent/${payment.id}`}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                          >
                            View
                          </Link>
                          <DeleteRentPaymentButton
                            id={payment.id}
                            tenantName={
                              payment.tenant?.full_name ?? "Unknown tenant"
                            }
                            compact
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {result && (
            <Pagination
              basePath="/dashboard/rent"
              query={query}
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
            />
          )}
        </Card>
      )}
    </div>
  );
}
