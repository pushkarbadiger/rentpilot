import { getCurrentUser } from "@/lib/services/auth";
import { withDemoWriteNotice } from "./demo-write-constants";

/** Returns path with demo notice param when the current user is in demo mode. */
export async function pathWithDemoNoticeIfNeeded(path: string): Promise<string> {
  const user = await getCurrentUser();
  if (user?.isDemo) return withDemoWriteNotice(path);
  return path;
}
