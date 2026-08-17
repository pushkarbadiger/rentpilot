import { ArrowUpRight, Bot, Sparkles } from "lucide-react";

const PROMPTS = [
  "Which rent payments need attention?",
  "Which property is performing best?",
  "What should I follow up on today?",
  "Show upcoming rent collection.",
];

export function AIRoadmap() {
  return (
    <section id="ai" className="bg-slate-950 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-400/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-indigo-200 ring-1 ring-inset ring-indigo-400/20">
            <Sparkles className="h-3.5 w-3.5" />
            RENTPILOT AI
          </span>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your portfolio has questions.
            <br />
            RentPilot AI has answers.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Ask focused questions about the properties, tenants, and rent
            records in your workspace. It&apos;s a faster way to turn your
            existing data into next steps.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/30 sm:p-7">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                Ask RentPilot AI
              </p>
              <p className="text-xs text-slate-400">Example questions</p>
            </div>
          </div>

          <div className="mt-6 grid gap-2.5">
            {PROMPTS.map((prompt) => (
              <div
                key={prompt}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3.5 text-sm text-slate-200 transition-colors hover:border-slate-700 hover:bg-slate-900/80"
              >
                <span>{prompt}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-indigo-300" />
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs leading-5 text-slate-500">
            Examples shown for illustration. AI responses depend on the
            information available in your RentPilot workspace.
          </p>
        </div>
      </div>
    </section>
  );
}
