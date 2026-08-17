import { StatCardsSkeleton, TableSkeleton, PageHeaderSkeleton } from "@/components/ui/Loading";

export default function PaymentsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <TableSkeleton rows={8} />
    </div>
  );
}
