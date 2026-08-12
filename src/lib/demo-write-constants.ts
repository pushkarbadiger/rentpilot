export const DEMO_WRITE_PARAM = "demoWrite";

/** Appends the demo-write notice query param to an internal path. */
export function withDemoWriteNotice(path: string): string {
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set(DEMO_WRITE_PARAM, "1");
  const query = params.toString();
  return query ? `${pathname}?${query}` : `${pathname}?${DEMO_WRITE_PARAM}=1`;
}
