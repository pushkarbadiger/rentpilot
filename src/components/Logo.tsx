import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2 3 8v13h6v-7h6v7h6V8l-9-6Z"
            fill="currentColor"
            fillOpacity="0.95"
          />
          <path
            d="M12 2 3 8m9-6 9 6m-9-6v20M3 8v13h6v-7h6v7h6V8"
            stroke="currentColor"
            strokeWidth="0"
          />
        </svg>
      </div>
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        RentPilot
      </span>
    </div>
  );
}
