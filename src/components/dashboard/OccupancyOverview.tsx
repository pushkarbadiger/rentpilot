import { Building2, DoorOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

interface OccupancyOverviewProps {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
}

function getOccupancyColor(pct: number): string {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-rose-500";
}

function getOccupancyLabel(pct: number): string {
  if (pct >= 90) return "Excellent";
  if (pct >= 70) return "Good";
  return "Needs attention";
}

export function OccupancyOverview({
  totalUnits,
  occupiedUnits,
  vacantUnits,
}: OccupancyOverviewProps) {
  if (totalUnits === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Add a property to start tracking occupancy."
          />
        </CardContent>
      </Card>
    );
  }

  const pct = Math.round((occupiedUnits / totalUnits) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Occupancy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold tracking-tight text-foreground">
            {pct}%
          </span>
          <span className="text-sm text-muted">
            {occupiedUnits} of {totalUnits} units
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getOccupancyColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {getOccupancyLabel(pct)}
          </span>
          {vacantUnits > 0 && (
            <span className="inline-flex items-center gap-1 text-muted">
              <DoorOpen className="h-3.5 w-3.5" />
              {vacantUnits} vacant
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
