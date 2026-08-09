import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";
import type { CurrentUser } from "@/lib/services/auth";

export function Header({
  user,
  title,
}: {
  user: CurrentUser;
  title?: string;
}) {
  const name = user.profile?.full_name || "Landlord";
  const email = user.email || "";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        {title && (
          <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        )}
      </div>
      <UserMenu name={name} email={email} isDemo={user.isDemo} />
    </header>
  );
}
