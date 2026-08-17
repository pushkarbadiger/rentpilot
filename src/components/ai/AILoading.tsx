import { Bot } from "lucide-react";

export function AILoading() {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
        <Bot className="h-3.5 w-3.5" />
      </span>
      <div className="rounded-xl bg-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
          </div>
          <span className="text-xs text-slate-500">
            Analyzing your portfolio…
          </span>
        </div>
      </div>
    </div>
  );
}
