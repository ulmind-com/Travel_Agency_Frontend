import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/packages", label: "Destinations" },
  { to: "/packages", label: "Collections", search: { category: "HONEYMOON" as const } },
  { to: "/about", label: "The Journal" },
  { to: "/contact", label: "Concierge" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "backdrop-blur-xl bg-cream-50/85 border-b border-ink-900/5"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 lg:h-20 lg:px-10">
        <Link
          to="/"
          className="min-w-0 truncate font-serif text-2xl tracking-tight text-ink-900 lg:text-3xl"
        >
          Ulmind
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search as never}
              className="text-[13px] font-medium text-ink-900/70 transition-colors hover:text-ink-900"
            >
              {item.label}
            </Link>
          ))}
          <span className="h-4 w-px bg-ink-900/10" />
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link
                to="/account"
                className="text-[13px] font-medium text-ink-900 hover:text-ink-900/70"
              >
                {user?.name?.split(" ")[0] ?? "Account"}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-[12px] uppercase tracking-widest text-ink-900/50 hover:text-ink-900"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth/login"
              className="rounded-full bg-ink-900 px-5 py-2 text-[12px] font-medium uppercase tracking-widest text-cream-50 ring-1 ring-ink-900 transition-transform active:scale-95"
            >
              Inquire
            </Link>
          )}
        </nav>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-full ring-1 ring-ink-900/15 text-ink-900 md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-ink-900/5 bg-cream-50 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                search={item.search as never}
                className="rounded-lg px-3 py-3 text-sm font-medium text-ink-900/80 hover:bg-cream-100"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-ink-900/5 pt-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    className="block rounded-lg px-3 py-3 text-sm font-medium text-ink-900 hover:bg-cream-100"
                  >
                    Account
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full rounded-lg px-3 py-3 text-left text-sm text-ink-900/60 hover:bg-cream-100"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth/login"
                  className="block rounded-lg bg-ink-900 px-3 py-3 text-center text-sm font-medium text-cream-50"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}