import { Link, useRouterState } from "@tanstack/react-router";
import { Bookmark, CalendarCheck, Compass, Heart, Image, Images, LayoutGrid, LogOut, MapPin, Shield, Sparkles, Trophy, User, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const ITEMS = [
  { to: "/account", label: "Overview", icon: User },
  { to: "/account/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/travelers", label: "Travelers", icon: Users },
  { to: "/account/profile", label: "Profile", icon: Bookmark },
];

const ADMIN_ITEMS = [
  { to: "/account/admin/hero", label: "Hero slides", icon: Image },
  { to: "/account/admin/tour-categories", label: "Tour categories", icon: LayoutGrid },
  { to: "/account/admin/popular-destinations", label: "Popular destinations", icon: MapPin },
  { to: "/account/admin/plan-your-trip", label: "Plan your trip", icon: Compass },
  { to: "/account/admin/popular-tours", label: "Popular tours", icon: Sparkles },
  { to: "/account/admin/recent-gallery", label: "Recent gallery", icon: Images },
  { to: "/account/admin/achievements", label: "Achievements", icon: Trophy },
];

export function AccountSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin, user, logout } = useAuth();

  return (
    <div className="lg:space-y-6">
      {/* Mobile: horizontal chip rail combining everything */}
      <nav className="no-scrollbar -mx-4 flex snap-x snap-mandatory flex-row gap-2 overflow-x-auto px-4 pb-4 lg:hidden">
        {[...ITEMS, ...(isAdmin ? ADMIN_ITEMS : [])].map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors",
                active ? "bg-ink-900 text-cream-50" : "border border-ink-900/10 bg-white text-ink-900/70",
              )}
            >
              <Icon className="size-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop: stacked with groups + profile footer */}
      <div className="hidden lg:block">
        <SidebarGroup label="Account" items={ITEMS} pathname={pathname} />

        {isAdmin && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ink-900/10 to-transparent" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/8 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.25em] text-[color:var(--gold)]">
                <Shield className="size-2.5" />
                Admin
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ink-900/10 to-transparent" />
            </div>
            <SidebarGroup label="Content Studio" items={ADMIN_ITEMS} pathname={pathname} />
          </>
        )}

        {user && (
          <div className="mt-8 rounded-3xl border border-ink-900/8 bg-white/70 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ink-900 to-ink-700 text-sm font-medium text-cream-50">
                {(user.name || "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-900">{user.name}</p>
                <p className="truncate text-[10px] uppercase tracking-widest text-ink-900/40">
                  {isAdmin ? "Administrator" : "Member"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-ink-900/10 bg-white px-3 py-2 text-[11px] uppercase tracking-widest text-ink-900/70 transition-colors hover:border-destructive/40 hover:text-destructive"
            >
              <LogOut className="size-3" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  pathname: string;
}) {
  return (
    <div>
      <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.28em] text-ink-900/35">
        {label}
      </p>
      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-gradient-to-r from-ink-900 to-ink-800 text-cream-50 shadow-[0_10px_28px_-12px_rgba(28,25,23,0.55)]"
                  : "text-ink-900/70 hover:bg-white hover:text-ink-900 hover:shadow-[0_6px_18px_-12px_rgba(28,25,23,0.35)]",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-x-1 -translate-y-1/2 rounded-full bg-[color:var(--gold)]" />
              )}
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active ? "text-[color:var(--gold)]" : "text-ink-900/40 group-hover:text-ink-900/80",
                )}
              />
              <span className="truncate">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}