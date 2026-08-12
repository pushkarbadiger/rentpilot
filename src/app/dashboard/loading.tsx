import { PageHeaderSkeleton, StatCardsSkeleton, DashboardOverviewSkeleton } from "@/components/ui/Loading";

export default function DashboardLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={5} />
      <div className="mb-8">
        <div className="mb-3 h-4 w-24 animate-pulse rounded bg-slate-200/70" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
      <DashboardOverviewSkeleton />
    </div>
  );
}
