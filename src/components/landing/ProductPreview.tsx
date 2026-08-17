import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  Home,
  Users,
  Wallet,
} from "lucide-react";

const STATS = [
  {
    label: "Rent collected",
    value: "\u20B948,200",
    detail: "This month",
    icon: Wallet,
    tone: "text-indigo-600 bg-indigo-50",
  },
  {
    label: "Occupancy",
    value: "91%",
    detail: "31 of 34 units",
    icon: Home,
    tone: "text-emerald-600 bg-emerald-50",
  },
  {
    label: "Needs attention",
    value: "3",
    detail: "Payments to review",
    icon: Clock3,
    tone: "text-amber-600 bg-amber-50",
  },
];

const PAYMENTS = [
  {
    name: "Maple Ridge \u00B7 Unit 4B",
    status: "Paid",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    name: "Harbor View \u00B7 Unit 2A",
    status: "Pending",
    tone: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  {
    name: "Parkside \u00B7 Unit 1C",
    status: "Overdue",
    tone: "bg-red-50 text-red-700 ring-red-200",
  },
];

/** An illustrative, static representation of the product — not customer data. */
export function ProductPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-6xl lg:mt-24">
      {/* Glow effect */}
      <div
        aria-hidden
        className="absolute -inset-x-16 -bottom-16 -z-10 h-56 rounded-full bg-indigo-100/60 blur-3xl"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50 ring-1 ring-slate-100">
        {/* Browser chrome */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>
          <p className="text-xs font-medium text-slate-400">
            Example RentPilot workspace
          </p>
        </div>

        <div className="grid min-h-[380px] grid-cols-1 sm:min-h-[440px] sm:grid-cols-[220px_1fr]">
          {/* Sidebar mockup */}
          <aside className="hidden border-r border-slate-200 bg-slate-50/70 p-4 sm:block">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Building2 className="h-4 w-4" />
              </span>
              RentPilot
            </div>
            <div className="mt-8 space-y-1 text-xs font-medium text-slate-500">
              <p className="rounded-lg bg-indigo-50 px-3 py-2.5 text-indigo-700">
                Overview
              </p>
              <p className="rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-100">
                Properties
              </p>
              <p className="rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-100">
                Tenants
              </p>
              <p className="rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-100">
                Rent tracking
              </p>
            </div>
          </aside>

          {/* Main content mockup */}
          <div className="min-w-0 p-4 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  PORTFOLIO OVERVIEW
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  Your portfolio, in focus
                </h2>
              </div>
              <div className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 sm:block">
                This month
              </div>
            </div>

            {/* Stat cards */}
            <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:mt-8 sm:gap-4">
              {STATS.map(({ label, value, detail, icon: Icon, tone }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-400">
                      {label}
                    </p>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                    {value}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
                </div>
              ))}
            </div>

            {/* Collection + activity row */}
            <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Rent collection
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      This month&apos;s expected rent
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="mt-7 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[82%] rounded-full bg-indigo-600" />
                </div>
                <div className="mt-3 flex justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    82% collected
                  </span>
                  <span className="text-slate-400">
                    {"\u20B9"}10,600 outstanding
                  </span>
                </div>
              </div>

              <div className="hidden rounded-xl border border-slate-200 bg-white p-4 lg:block">
                <p className="text-sm font-semibold text-slate-900">
                  Recent activity
                </p>
                <div className="mt-5 flex items-center gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Payment recorded
                </div>
                <div className="mt-3 flex items-center gap-2.5 text-xs text-slate-600">
                  <Users className="h-4 w-4 text-indigo-500" />
                  Tenant added
                </div>
              </div>
            </div>

            {/* Payment status table */}
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  Payment status
                </p>
                <p className="text-xs font-medium text-indigo-600">View all</p>
              </div>
              <div className="divide-y divide-slate-100">
                {PAYMENTS.map((payment) => (
                  <div
                    key={payment.name}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <p className="truncate text-xs font-medium text-slate-600">
                      {payment.name}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${payment.tone}`}
                    >
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
