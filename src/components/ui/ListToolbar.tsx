import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";

export interface ListFilterField {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

export function ListToolbar({
  query,
  searchPlaceholder = "Search…",
  statusOptions,
  propertyOptions,
  monthOptions,
  sortOptions,
}: {
  query: {
    q?: string;
    status?: string;
    propertyId?: string;
    month?: string;
    sort?: string;
    order?: string;
  };
  searchPlaceholder?: string;
  statusOptions?: { value: string; label: string }[];
  propertyOptions?: { value: string; label: string }[];
  monthOptions?: { value: string; label: string }[];
  sortOptions?: { value: string; label: string }[];
}) {
  return (
    <form
      method="get"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="min-w-[200px] flex-1">
        <label htmlFor="list-q" className="mb-1.5 block text-sm font-medium text-slate-700">
          Search
        </label>
        <Input
          id="list-q"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder={searchPlaceholder}
        />
      </div>

      {statusOptions && statusOptions.length > 0 && (
        <div className="w-full sm:w-40">
          <label htmlFor="list-status" className="mb-1.5 block text-sm font-medium text-slate-700">
            Status
          </label>
          <Select id="list-status" name="status" defaultValue={query.status ?? ""}>
            <option value="">All</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {propertyOptions && propertyOptions.length > 0 && (
        <div className="w-full sm:w-48">
          <label htmlFor="list-property" className="mb-1.5 block text-sm font-medium text-slate-700">
            Property
          </label>
          <Select
            id="list-property"
            name="propertyId"
            defaultValue={query.propertyId ?? ""}
          >
            <option value="">All properties</option>
            {propertyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {monthOptions && monthOptions.length > 0 && (
        <div className="w-full sm:w-40">
          <label htmlFor="list-month" className="mb-1.5 block text-sm font-medium text-slate-700">
            Due month
          </label>
          <Select id="list-month" name="month" defaultValue={query.month ?? ""}>
            <option value="">All months</option>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {sortOptions && sortOptions.length > 0 && (
        <>
          <div className="w-full sm:w-44">
            <label htmlFor="list-sort" className="mb-1.5 block text-sm font-medium text-slate-700">
              Sort by
            </label>
            <Select id="list-sort" name="sort" defaultValue={query.sort ?? ""}>
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-32">
            <label htmlFor="list-order" className="mb-1.5 block text-sm font-medium text-slate-700">
              Order
            </label>
            <Select id="list-order" name="order" defaultValue={query.order ?? "desc"}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </Select>
          </div>
        </>
      )}

      <input type="hidden" name="page" value="1" />
      <Button type="submit" size="sm" className="sm:mb-0.5">
        Apply
      </Button>
    </form>
  );
}
