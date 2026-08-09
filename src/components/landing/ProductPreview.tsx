import { Building2, DoorClosed, DoorOpen, Wallet } from "lucide-react";

const PREVIEW_STATS = [
  { label: "Total Properties", value: "12", icon: Building2 },
  { label: "Occupied Units", value: "34", icon: DoorClosed },
  { label: "Vacant Units", value: "3", icon: DoorOpen },
  { label: "Monthly Rent", value: "$48,200", icon: Wallet },
];

const PREVIEW_ROWS = [
  { name: "Maple Ridge Apartments", city: "Austin, TX", rent: "$1,450", status: "Active" },
  { name: "Sunset Duplex", city: "Austin, TX", rent: "$1,900", status: "Active" },
  { name: "Downtown Loft 4B", city: "Austin, TX", rent: "$2,100", status: "Active" },
];

export function ProductPreview() {
  return (
    <section id="preview" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
          A dashboard that feels like a product, not a spreadsheet
        </h2>
        <p className="mt-4 text-base text-slate-600">
          Everything about your portfolio, at a glance.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 text-xs font-medium text-slate-400">
            rentpilot.app/dashboard
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PREVIEW_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <stat.icon className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Property</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 font-medium">Rent</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PREVIEW_ROWS.map((row) => (
                  <tr key={row.name}>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {row.name}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{row.city}</td>
                    <td className="px-4 py-2.5 text-slate-700">{row.rent}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
