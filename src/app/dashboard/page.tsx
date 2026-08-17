import {
  Building2,
  Users,
  TrendingUp,
  IndianRupee,
  AlertCircle,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/Alert";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingRent } from "@/components/dashboard/UpcomingRent";
import { PropertyOverview } from "@/components/dashboard/PropertyOverview";
import { AttentionCenter } from "@/components/dashboard/AttentionCenter";
import { OccupancyOverview } from "@/components/dashboard/OccupancyOverview";
import { RentCollectionOverview } from "@/components/dashboard/RentCollectionOverview";
import { getDashboardStats } from "@/lib/services/dashboard";
import { listProperties } from "@/lib/services/properties";
import { listRentPayments } from "@/lib/services/rent-payments";
import { listTenants } from "@/lib/services/tenants";
import { getCurrentUser } from "@/lib/services/auth";
import { getEffectivePaymentStatus } from "@/lib/services/payment-status";
import { isPaymentDueInMonth } from "@/lib/services/metrics";
import { formatCurrency } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [statsResult, propertiesResult, paymentsResult, tenantsResult, user] =
    await Promise.all([
      getDashboardStats(),
      listProperties(),
      listRentPayments(),
      listTenants(),
      getCurrentUser(),
    ]);

  if (statsResult.error || !statsResult.data) {
    return (
      <ErrorState
        message={statsResult.error ?? "Unable to load dashboard data."}
      />
    );
  }

  const stats = statsResult.data;
  const properties = propertiesResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const allTenants = tenantsResult.data ?? [];
  const activeTenants = allTenants.filter(
    (tenant) => tenant.status === "active",
  ).length;
  const firstName =
    user?.profile?.full_name?.trim().split(/\s+/)[0] ?? "there";

  const overdueAmount = payments
    .filter((p) => {
      const effective = getEffectivePaymentStatus(p);
      return effective === "late" && isPaymentDueInMonth(p, new Date());
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const needsAttention =
    stats.vacantUnits > 0 || stats.latePayments > 0 || stats.outstandingRent > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={`${getGreeting()}, ${firstName}`}
          description="Here's what's happening across your rental portfolio today."
        />
        <Link
          href="/dashboard/properties/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Property
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Properties"
          value={String(stats.totalProperties)}
          icon={Building2}
          sublabel={`${stats.totalUnits} total unit${stats.totalUnits === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Active Tenants"
          value={String(activeTenants)}
          icon={Users}
          tone="success"
          sublabel={`${stats.occupiedUnits} occupying`}
        />
        <StatCard
          label="Occupancy"
          value={
            stats.totalUnits > 0
              ? `${Math.round((stats.occupiedUnits / stats.totalUnits) * 100)}%`
              : "—"
          }
          icon={TrendingUp}
          tone={
            stats.totalUnits > 0
              ? stats.occupiedUnits / stats.totalUnits >= 0.9
                ? "success"
                : stats.occupiedUnits / stats.totalUnits >= 0.7
                  ? "warning"
                  : "warning"
              : undefined
          }
          sublabel={`${stats.occupiedUnits}/${stats.totalUnits} units`}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(stats.rentCollected)}
          icon={Wallet}
          tone={stats.rentCollected > 0 ? "success" : undefined}
          sublabel="This month"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstandingRent)}
          icon={IndianRupee}
          tone={stats.outstandingRent > 0 ? "warning" : "success"}
          sublabel="Unpaid balance"
        />
        <StatCard
          label="Overdue"
          value={String(stats.latePayments)}
          icon={AlertCircle}
          tone={stats.latePayments > 0 ? "warning" : "success"}
          sublabel={
            overdueAmount > 0
              ? `${formatCurrency(overdueAmount)} due`
              : "No overdue"
          }
        />
      </div>

      {/* Occupancy + Rent Collection side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OccupancyOverview
          totalUnits={stats.totalUnits}
          occupiedUnits={stats.occupiedUnits}
          vacantUnits={stats.vacantUnits}
        />
        <RentCollectionOverview
          expectedRent={stats.rentCollected + stats.outstandingRent}
          collectedRent={stats.rentCollected}
          overdueAmount={overdueAmount}
        />
      </div>

      {/* Attention Center */}
      {needsAttention && (
        <AttentionCenter
          payments={payments}
          vacantUnits={stats.vacantUnits}
          latePayments={stats.latePayments}
        />
      )}

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Quick actions
        </h2>
        <QuickActions />
      </div>

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PropertyOverview properties={properties} />
        <UpcomingRent payments={payments} />
        <div className="xl:col-span-2">
          <RecentActivity
            payments={payments}
            properties={properties}
            tenants={allTenants}
          />
        </div>
      </div>
    </div>
  );
}
