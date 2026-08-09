import {
  Building2,
  LineChart,
  Receipt,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    icon: Building2,
    title: "Property management",
    description:
      "Track every property in your portfolio with details on units, rent, status, and notes — all in one clean workspace.",
  },
  {
    icon: Users,
    title: "Tenant management",
    description:
      "Keep tenant contact info, lease dates, and deposit details organized and easy to search across properties.",
  },
  {
    icon: Receipt,
    title: "Rent tracking",
    description:
      "Log payments, monitor due dates, and instantly see what's collected, pending, or overdue this month.",
  },
  {
    icon: LineChart,
    title: "Portfolio overview",
    description:
      "A real-time dashboard summarizing occupancy, cash flow, and activity across your entire rental business.",
  },
  {
    icon: Sparkles,
    title: "AI-ready automation",
    description:
      "A clean service architecture designed for AI rent reminders, maintenance triage, and cash-flow forecasting — coming soon.",
  },
  {
    icon: Wallet,
    title: "Built to scale",
    description:
      "Multi-user organizations, payments, and notifications are on the roadmap — the foundation is ready for it today.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
          Everything you need to run your rentals
        </h2>
        <p className="mt-4 text-base text-slate-600">
          Phase 1 covers the core foundation — property, tenant, and rent
          management — with an architecture ready for what&apos;s next.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <feature.icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
