import { Check, X } from "lucide-react";

const BEFORE = [
  "Spreadsheets spread across the business",
  "Payment dates that are easy to miss",
  "Tenant details stored in disconnected places",
  "No clear picture of what needs attention",
];
const AFTER = [
  "One workspace for the whole portfolio",
  "Payment status that is clear at a glance",
  "Tenant records connected to each property",
  "A focused view of the next best action",
];

export function ProblemSolution() {
  return (
    <section id="product" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-indigo-600">
            FROM REACTIVE TO READY
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Stop managing the gaps between your tools.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            RentPilot makes the state of your rental business easy to
            understand — without the manual chase.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-7 sm:p-8">
            <p className="text-xs font-bold tracking-[0.16em] text-slate-400">
              BEFORE RENTPILOT
            </p>
            <h3 className="mt-3 text-xl font-semibold text-slate-500">
              Information everywhere.
            </h3>
            <ul className="mt-7 space-y-4">
              {BEFORE.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-slate-500"
                >
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-7 sm:p-8">
            <p className="text-xs font-bold tracking-[0.16em] text-indigo-600">
              WITH RENTPILOT
            </p>
            <h3 className="mt-3 text-xl font-semibold text-slate-950">
              One calm operating system.
            </h3>
            <ul className="mt-7 space-y-4">
              {AFTER.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-slate-700"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
