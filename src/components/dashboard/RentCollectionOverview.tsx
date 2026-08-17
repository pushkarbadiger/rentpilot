import Link from "next/link";
import { ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface RentCollectionOverviewProps {
  expectedRent: number;
  collectedRent: number;
  overdueAmount: number;
}

export function RentCollectionOverview({
  expectedRent,
  collectedRent,
  overdueAmount,
}: RentCollectionOverviewProps) {
  const outstandingAmount = expectedRent - collectedRent;
  const collectedPct =
    expectedRent > 0 ? Math.round((collectedRent / expectedRent) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rent Collection</CardTitle>
        <Link
          href="/dashboard/rent"
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
        >
          Rent operations
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted">Collected this month</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {formatCurrency(collectedRent)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Expected</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(expectedRent)}
            </p>
          </div>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${collectedPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {collectedPct}% collected
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <div>
              <p className="text-xs text-muted">Outstanding</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(Math.max(0, outstandingAmount))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <div>
              <p className="text-xs text-muted">Overdue</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(overdueAmount)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
