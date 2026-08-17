import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  Building2,
  Users,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { PortfolioContext } from "@/lib/services/ai/portfolio-context";

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          tone === "success"
            ? "bg-emerald-50 text-emerald-600"
            : tone === "warning"
              ? "bg-amber-50 text-amber-600"
              : "bg-indigo-50 text-indigo-600"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function PortfolioBrief({
  context,
}: {
  context: PortfolioContext;
}) {
  const { portfolio, financials } = context;
  const hasData =
    portfolio.totalProperties > 0 || financials.expectedRent > 0;

  if (!hasData) {
    return (
      <Card className="border-indigo-100 bg-indigo-50/30">
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                No portfolio data yet
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Add a property and tenant to start seeing portfolio insights.
              </p>
              <Link
                href="/dashboard/properties/new"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Add your first property
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-100 bg-indigo-50/30">
      <CardHeader className="border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <TrendingUp className="h-4 w-4" />
          </div>
          <CardTitle>Today&apos;s Portfolio Brief</CardTitle>
        </div>
        <p className="text-xs text-slate-500">
          {context.asOf}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat
            label="Occupancy"
            value={`${portfolio.occupancyRate}%`}
            icon={Building2}
            tone={
              portfolio.occupancyRate >= 90
                ? "success"
                : portfolio.occupancyRate >= 70
                  ? "warning"
                  : "warning"
            }
          />
          <Stat
            label="Active tenants"
            value={String(context.tenants.length)}
            icon={Users}
          />
          <Stat
            label="Collection rate"
            value={`${financials.collectionRate}%`}
            icon={IndianRupee}
            tone={
              financials.collectionRate >= 80
                ? "success"
                : financials.collectionRate >= 50
                  ? "warning"
                  : "warning"
            }
          />
          <Stat
            label="Collected"
            value={formatCurrency(financials.rentCollected)}
            icon={TrendingUp}
            tone="success"
          />
          <Stat
            label="Outstanding"
            value={formatCurrency(financials.outstandingRent)}
            icon={IndianRupee}
            tone={financials.outstandingRent > 0 ? "warning" : "success"}
          />
          <Stat
            label="Overdue"
            value={
              financials.overdueAmount > 0
                ? formatCurrency(financials.overdueAmount)
                : "None"
            }
            icon={AlertTriangle}
            tone={financials.overdueAmount > 0 ? "warning" : "success"}
          />
        </div>

        {financials.overdueAmount > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs font-medium text-amber-800">
              {context.overduePayments.length} overdue payment
              {context.overduePayments.length === 1 ? "" : "s"} totalling{" "}
              {formatCurrency(financials.overdueAmount)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
