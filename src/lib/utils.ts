import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount || 0);
}

const currencyPreciseFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Currency with cents — useful for payment amounts. */
export function formatCurrencyPrecise(amount: number) {
  return currencyPreciseFormatter.format(amount || 0);
}

export function formatEmpty(
  value: string | null | undefined,
  fallback = "—"
): string {
  if (value == null || !String(value).trim()) return fallback;
  return value;
}

export function formatStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    open: "Pending",
    late: "Overdue",
  };

  if (statusLabels[status]) return statusLabels[status];
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function titleCase(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return "—";
  return titleCase(method);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateShort(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Returns a safe internal redirect path, defaulting to /dashboard.
 * Rejects external URLs and auth pages to prevent open redirects.
 */
export function getSafeRedirectPath(
  redirectTo: string | null | undefined
): string {
  const fallback = "/dashboard";
  if (!redirectTo) return fallback;

  const trimmed = redirectTo.trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return fallback;
  }
  if (trimmed.startsWith("/login") || trimmed.startsWith("/signup")) {
    return fallback;
  }

  return trimmed;
}
