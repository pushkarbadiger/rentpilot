"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { DEMO_WRITE_PARAM } from "@/lib/demo-write-constants";

export function DemoWriteNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const showNotice = searchParams.get(DEMO_WRITE_PARAM) === "1";

  useEffect(() => {
    if (!showNotice) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete(DEMO_WRITE_PARAM);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname
    );
  }, [showNotice, searchParams, pathname]);

  if (!showNotice) return null;

  return (
    <Alert variant="warning" className="mb-4">
      This change was simulated in demo mode and was not saved. Connect Supabase
      to persist real data.
    </Alert>
  );
}
