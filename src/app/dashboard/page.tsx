import {
  Building2,
  DoorOpen,
  DoorClosed,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/Alert";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingRent } from "@/components/dashboard/UpcomingRent";
import { PropertyOverview } from "@/components/dashboard/PropertyOverview";
import { getDashboardStats } from "@/lib/services/dashboard";
import { listProperties } from "@/lib/services/properties";
import { listRentPayments } from "@/lib/services/rent-payments";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const [statsResult, propertiesResult, paymentsResult] = await Promise.all([
    getDashboardStats(),
    listProperties(),
    listRentPayments(),
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

  return (
    <div>
      <PageHeader
        title="Portfolio overview"
        description="Here's how your rental portfolio is performing."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Properties"
          value={String(stats.totalProperties)}
          icon={Building2}
          sublabel={`${stats.totalUnits} total units`}
        />
        <StatCard
          label="Occupied Units"
          value={String(stats.occupiedUnits)}
          icon={DoorClosed}
          tone="success"
        />
        <StatCard
          label="Vacant Units"
          value={String(stats.vacantUnits)}
          icon={DoorOpen}
          tone={stats.vacantUnits > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Monthly Rent"
          value={formatCurrency(stats.monthlyRent)}
          icon={Wallet}
          sublabel="Expected from active leases"
        />
        <StatCard
          label="Outstanding Rent"
          value={formatCurrency(stats.outstandingRent)}
          icon={AlertCircle}
          tone={stats.outstandingRent > 0 ? "warning" : "success"}
          sublabel={`${stats.latePayments} late payment${stats.latePayments === 1 ? "" : "s"}`}
        />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Quick actions
        </h2>
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PropertyOverview properties={properties} />
        <UpcomingRent payments={payments} />
        <div className="xl:col-span-2">
          <RecentActivity payments={payments} />
        </div>
      </div>
    </div>
  );
}
