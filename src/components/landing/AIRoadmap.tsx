import { Bell, FileSearch, LineChart, MessageSquare, Wrench } from "lucide-react";

const AI_ITEMS = [
  { icon: Bell, label: "AI rent reminders" },
  { icon: Wrench, label: "Maintenance request classification" },
  { icon: MessageSquare, label: "Tenant communication drafts" },
  { icon: FileSearch, label: "Lease & document analysis" },
  { icon: LineChart, label: "Cash-flow forecasting & insights" },
];

export function AIRoadmap() {
  return (
    <section id="ai" className="bg-slate-900 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
            Roadmap
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Built to grow into AI automation
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Phase 1 ships the foundation with clean service boundaries — so
            these can be added later without a rewrite.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {AI_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
                <item.icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-slate-200">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
