import { PageHeaderSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/ui/Loading";

export default function RentLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <TableSkeleton rows={8} />
    </div>
  );
}
