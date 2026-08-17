import {
  Bell,
  Building2,
  Bot,
  BarChart3,
  ReceiptText,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    icon: Building2,
    title: "Property management",
    description:
      "See every property, unit, occupancy state, and key detail in one organized view — no more scattered spreadsheets.",
  },
  {
    icon: Users,
    title: "Tenant records",
    description:
      "Keep contact details, lease terms, and unit assignments tied together and always within reach.",
  },
  {
    icon: ReceiptText,
    title: "Rent payments",
    description:
      "Track what is paid, pending, overdue, or coming due — with a clear picture of your monthly collection.",
  },
  {
    icon: Bell,
    title: "Automated reminders",
    description:
      "Send rent reminders by email in one click, so follow-up is consistent and timely without the busywork.",
  },
  {
    icon: BarChart3,
    title: "Portfolio analytics",
    description:
      "Monitor occupancy rates, collection performance, and outstanding balances across your entire portfolio.",
  },
  {
    icon: Bot,
    title: "AI assistance",
    description:
      "Ask RentPilot AI about the properties, tenants, and payments in your workspace to get faster answers.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-indigo-600">
            ONE CALM WORKSPACE
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Everything you need to run
            <br className="hidden sm:block" />
            a better rental operation.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            RentPilot brings daily property management into one connected
            system — so the important work is visible, organized, and ready to
            act on.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 text-base font-semibold text-slate-950">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
