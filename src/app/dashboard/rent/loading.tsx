import { StatCardsSkeleton, TableSkeleton } from "@/components/ui/Loading";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
  );
}

function OverviewCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonBar className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkeletonBar className="h-7 w-7 rounded-md" />
                <SkeletonBar className="h-3.5 w-16" />
                <SkeletonBar className="h-5 w-6 rounded-full" />
              </div>
              <SkeletonBar className="h-4 w-20" />
            </div>
            <SkeletonBar className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AlertCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonBar className="h-4 w-24" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0 divide-y divide-slate-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <SkeletonBar className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1">
                <SkeletonBar className="h-3.5 w-32" />
                <SkeletonBar className="h-3 w-48" />
              </div>
              <SkeletonBar className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CompactCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonBar className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function RentLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <SkeletonBar className="h-6 w-40" />
          <SkeletonBar className="h-4 w-80" />
        </div>
        <SkeletonBar className="h-10 w-36 rounded-xl" />
      </div>

      <StatCardsSkeleton count={4} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <OverviewCardSkeleton />
        <AlertCardSkeleton />
        <AlertCardSkeleton />
      </div>

      <CompactCardSkeleton />
      <CompactCardSkeleton />

      <SkeletonBar className="h-4 w-32" />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBar className="h-9 w-48" />
          <SkeletonBar className="h-9 w-32" />
          <SkeletonBar className="h-9 w-32" />
          <SkeletonBar className="h-9 w-32" />
        </div>
      </div>

      <TableSkeleton rows={8} />
    </div>
  );
}
