import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/Loading";

export default function PropertiesLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}
