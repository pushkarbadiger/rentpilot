import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <FileQuestion className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h2 className="text-base font-semibold text-slate-900">Page not found</h2>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <ButtonLink href="/dashboard" className="mt-5" size="sm">
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
