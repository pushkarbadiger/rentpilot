export const DEFAULT_PAGE_SIZE = 25;

export interface ListQuery {
  q?: string;
  status?: string;
  propertyId?: string;
  month?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type SearchParamValue = string | string[] | undefined;

function getParam(
  params: Record<string, SearchParamValue>,
  key: string
): string | undefined {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export function parseListQuery(
  searchParams: Record<string, SearchParamValue>
): ListQuery {
  const page = parseInt(getParam(searchParams, "page") || "1", 10);

  return {
    q: getParam(searchParams, "q")?.trim() || undefined,
    status: getParam(searchParams, "status") || undefined,
    propertyId: getParam(searchParams, "propertyId") || undefined,
    month: getParam(searchParams, "month") || undefined,
    sort: getParam(searchParams, "sort") || undefined,
    order:
      getParam(searchParams, "order") === "asc"
        ? "asc"
        : getParam(searchParams, "order") === "desc"
          ? "desc"
          : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export function buildListQueryString(
  query: ListQuery,
  overrides?: Partial<ListQuery>
): string {
  const merged = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (merged.q) params.set("q", merged.q);
  if (merged.status) params.set("status", merged.status);
  if (merged.propertyId) params.set("propertyId", merged.propertyId);
  if (merged.month) params.set("month", merged.month);
  if (merged.sort) params.set("sort", merged.sort);
  if (merged.order) params.set("order", merged.order);
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function getRecentMonthOptions(count = 12) {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
    options.push({ value, label });
  }

  return options;
}

export function paginateArray<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function sortArray<T>(
  items: T[],
  sort: string | undefined,
  order: "asc" | "desc" | undefined,
  accessors: Record<string, (item: T) => string | number>
): T[] {
  if (!sort || !accessors[sort]) return items;

  const accessor = accessors[sort];
  const dir = order === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv)) * dir;
  });
}
