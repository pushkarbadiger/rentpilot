import { headers } from "next/headers";

/** Resolves the application origin for Stripe return/refresh URLs (server-only). */
export async function getAppOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}
