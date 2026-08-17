import { Building2, Users, IndianRupee } from "lucide-react";

const STEPS = [
  {
    number: "1",
    icon: Building2,
    title: "Add your properties",
    text: "Enter your portfolio — apartments, houses, commercial units — in minutes.",
  },
  {
    number: "2",
    icon: Users,
    title: "Connect your tenants",
    text: "Link tenants to their units, record lease terms, and store contact details.",
  },
  {
    number: "3",
    icon: IndianRupee,
    title: "Track rent & get insights",
    text: "Monitor payments, send reminders, and see your portfolio health at a glance.",
  },
];

export function WorkflowSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-indigo-600">
            HOW IT WORKS
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            From sign-up to clarity in three steps.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            No complex setup. No steep learning curve. Just a cleaner way to
            manage your rental business.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map(({ number, icon: Icon, title, text }) => (
            <div key={number} className="relative text-center">
              {/* Connector line (desktop only) */}
              <div className="absolute left-[calc(50%+40px)] top-6 hidden h-px w-[calc(100%-80px)] bg-slate-200 md:block" />

              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
                <Icon className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <span className="mt-5 block text-xs font-bold tracking-widest text-indigo-600">
                STEP {number}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
