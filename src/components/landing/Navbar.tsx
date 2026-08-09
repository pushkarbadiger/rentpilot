import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Features
          </a>
          <a href="#preview" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Product
          </a>
          <a href="#ai" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            AI roadmap
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <ButtonLink href="/signup" size="sm">
            Get Started
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
