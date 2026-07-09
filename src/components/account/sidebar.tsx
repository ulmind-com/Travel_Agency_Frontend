import { Link, useRouterState } from "@tanstack/react-router";
import { Bookmark, CalendarCheck, Compass, Heart, Image, LayoutGrid, MapPin, User, Users } from "lucide-react";

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
];

export function AccountSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useAuth();
  const items = isAdmin ? [...ITEMS, ...ADMIN_ITEMS] : ITEMS;
  return (
    <nav className="flex flex-row gap-2 overflow-x-auto pb-4 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
      {items.map((it) => {
        const active = pathname === it.to;
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors lg:rounded-2xl",
              active
                ? "bg-ink-900 text-cream-50"
                : "text-ink-900/70 hover:bg-cream-100",
            )}
          >
            <Icon className="size-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}