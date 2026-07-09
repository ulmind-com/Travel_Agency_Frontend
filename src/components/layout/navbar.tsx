import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, Plane, MapPin, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/gallery", label: "Gallery" },
  { to: "/blogs", label: "Blogs" },
  { to: "/contact", label: "Contact Us" },
] as const;

const INDIA_REGIONS = [
  { label: "East India", search: "East India" },
  { label: "North India", search: "North India" },
  { label: "West India", search: "West India" },
  { label: "South India", search: "South India" },
] as const;

const INTERNATIONAL = [
  { label: "Europe", search: "Europe" },
  { label: "Asia", search: "Asia" },
  { label: "Middle East", search: "Middle East" },
  { label: "Americas", search: "Americas" },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileDestOpen, setMobileDestOpen] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMobileOpen(false);
    setDesktopOpen(false);
  }, [pathname]);

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    if (!desktopOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!desktopRef.current?.contains(e.target as Node)) {
        setDesktopOpen(false);
      }
    };
    window.addEventListener("click", onClick, { passive: true });
    return () => window.removeEventListener("click", onClick);
  }, [desktopOpen]);

  const handleEnter = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setDesktopOpen(true);
  };

  const handleLeave = () => {
    hoverTimer.current = window.setTimeout(() => setDesktopOpen(false), 160);
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-500 bg-transparent"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-6 lg:h-20 lg:px-10">
        <Link
          to="/"
          className="min-w-0 truncate font-serif text-2xl tracking-tight transition-colors lg:text-3xl text-cream-50"
        >
          Ulmind
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="relative px-4 py-2 text-[13px] font-medium transition-colors text-cream-50/80 hover:text-cream-50"
              activeProps={{ className: "text-cream-50" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}

          {/* Destinations mega trigger */}
          <div
            ref={desktopRef}
            className="relative"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <button
              type="button"
              onFocus={handleEnter}
              onBlur={handleLeave}
              className={cn(
                "flex items-center gap-1 px-4 py-2 text-[13px] font-medium transition-colors text-cream-50/80 hover:text-cream-50",
                desktopOpen && "text-cream-50",
              )}
            >
              Destinations
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-300",
                  desktopOpen && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence>
              {desktopOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-1/2 top-full z-50 mt-4 w-[620px] -translate-x-1/2 rounded-2xl border border-cream-50/10 bg-cream-50/[0.03] p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
                  onMouseEnter={handleEnter}
                  onMouseLeave={handleLeave}
                >
                  <div className="grid grid-cols-2 gap-8">
                    {/* India */}
                    <div>
                      <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
                        <Plane className="size-4" strokeWidth={1.5} />
                        India
                      </div>
                      <ul className="space-y-1">
                        {INDIA_REGIONS.map((region) => (
                          <li key={region.label}>
                            <Link
                              to="/packages"
                              search={{ destination: region.search }}
                              className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] text-cream-50/80 transition-colors hover:bg-cream-50/5 hover:text-cream-50"
                              onClick={() => setDesktopOpen(false)}
                            >
                              <span className="flex items-center gap-2">
                                <MapPin className="size-3.5 text-cream-50/30 transition-colors group-hover:text-gold" />
                                {region.label}
                              </span>
                              <ChevronDown className="size-3 -rotate-90 text-cream-50/20 transition-colors group-hover:text-cream-50/50" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* International */}
                    <div>
                      <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
                        <Globe className="size-4" strokeWidth={1.5} />
                        International
                      </div>
                      <ul className="space-y-1">
                        {INTERNATIONAL.map((region) => (
                          <li key={region.label}>
                            <Link
                              to="/packages"
                              search={{ destination: region.search }}
                              className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] text-ink-900/80 transition-colors hover:bg-cream-100 hover:text-ink-900"
                              onClick={() => setDesktopOpen(false)}
                            >
                              <span className="flex items-center gap-2">
                                <Globe className="size-3.5 text-ink-900/30 transition-colors group-hover:text-gold" />
                                {region.label}
                              </span>
                              <ChevronDown className="size-3 -rotate-90 text-ink-900/20 transition-colors group-hover:text-ink-900/50" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-ink-900/5 pt-4">
                    <Link
                      to="/packages"
                      className="group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium text-ink-900 transition-colors hover:bg-cream-100"
                      onClick={() => setDesktopOpen(false)}
                    >
                      <span>Browse all escapes</span>
                      <ChevronDown className="size-3 -rotate-90 text-ink-900/40 transition-colors group-hover:text-ink-900" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-4 md:flex">
          <span className="h-4 w-px bg-cream-50/20" />
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  to="/account/admin/hero"
                  className="text-[11px] uppercase tracking-widest transition-colors text-cream-50/60 hover:text-cream-50"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/account"
                className="text-[13px] font-medium transition-colors text-cream-50 hover:text-cream-50/80"
              >
                {user?.name?.split(" ")[0] ?? "Account"}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-[12px] uppercase tracking-widest transition-colors text-cream-50/60 hover:text-cream-50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth/login"
              className="rounded-full px-5 py-2 text-[12px] font-medium uppercase tracking-widest ring-1 transition-transform active:scale-95 bg-transparent text-cream-50 ring-cream-50/30 hover:bg-cream-50/10"
            >
              Inquire
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-full ring-1 md:hidden ring-cream-50/30 text-cream-50"
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-ink-900/5 bg-cream-50 md:hidden"
          >
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-ink-900/80 hover:bg-cream-100"
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile Destinations accordion */}
              <div className="border-t border-ink-900/5 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileDestOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-ink-900/80 hover:bg-cream-100"
                >
                  Destinations
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      mobileDestOpen && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence>
                  {mobileDestOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-2 pt-1">
                        <p className="py-2 text-[10px] uppercase tracking-widest text-gold">
                          India
                        </p>
                        {INDIA_REGIONS.map((region) => (
                          <Link
                            key={region.label}
                            to="/packages"
                            search={{ destination: region.search }}
                            className="block rounded-lg px-3 py-2 text-sm text-ink-900/70 hover:bg-cream-100 hover:text-ink-900"
                          >
                            {region.label}
                          </Link>
                        ))}
                        <p className="mt-2 py-2 text-[10px] uppercase tracking-widest text-gold">
                          International
                        </p>
                        {INTERNATIONAL.map((region) => (
                          <Link
                            key={region.label}
                            to="/packages"
                            search={{ destination: region.search }}
                            className="block rounded-lg px-3 py-2 text-sm text-ink-900/70 hover:bg-cream-100 hover:text-ink-900"
                          >
                            {region.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
                    Inquire
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
