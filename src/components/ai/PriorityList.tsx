import Link from "next/link";
import {
  AlertCircle,
  DoorOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import type { DeterministicInsight } from "@/lib/services/ai/deterministic-insights";

function InsightIcon({ type }: { type: DeterministicInsight["type"] }) {
  const config = {
    overdue_payment: {
      icon: AlertCircle,
      bg: "bg-red-50",
      text: "text-red-600",
    },
    vacancy: {
      icon: DoorOpen,
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    low_collection: {
      icon: AlertCircle,
      bg: "bg-red-50",
      text: "text-red-600",
    },
    high_performer: {
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    partial_payment: {
      icon: AlertCircle,
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
  };

  const c = config[type];
  const Icon = c.icon;
  return (
    <span
      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.text}`}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}

const severityTone: Record<DeterministicInsight["severity"], string> = {
  high: "red",
  medium: "amber",
  low: "slate",
};

export function PriorityList({
  insights,
}: {
  insights: DeterministicInsight[];
}) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>What should I do today?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
            <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium text-slate-700">
              All clear — no urgent items
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Your portfolio looks healthy right now.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>What should I do today?</CardTitle>
        <Badge tone="slate">{insights.length} items</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100">
          {insights.map((insight, index) => (
            <li key={`${insight.type}-${index}`}>
              <Link
                href={insight.link ?? "#"}
                className="flex items-start gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50"
              >
                <InsightIcon type={insight.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {insight.title}
                    </p>
                    <Badge tone={severityTone[insight.severity] as "red" | "amber" | "slate"}>
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {insight.detail}
                  </p>
                </div>
                {insight.amount != null && insight.amount > 0 && (
                  <span className="shrink-0 text-sm font-semibold text-slate-900">
                    {formatCurrency(insight.amount)}
                  </span>
                )}
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
