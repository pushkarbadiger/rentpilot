import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  OverviewCardSkeleton,
  DashboardOverviewSkeleton,
} from "@/components/ui/Loading";

export default function DashboardLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={6} />
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OverviewCardSkeleton />
        <OverviewCardSkeleton />
      </div>
      <DashboardOverviewSkeleton />
    </div>
  );
}
