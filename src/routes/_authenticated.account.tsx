import { useEffect, useRef } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { AccountSidebar } from "@/components/account/sidebar";
import { AdminRouteTransition } from "@/components/admin/AdminRouteTransition";
import { NotificationBell } from "@/components/admin/notifications/NotificationCenter";
import { GlobalSearchTrigger } from "@/components/admin/crm/CommandPalette";
import { Container } from "@/components/layout/container";
import { useAuth } from "@/lib/auth-context";
import { useAdminEvents } from "@/hooks/useAdminEvents";
import { authMeQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [{ title: "Account · Ulmind Travel" }, { name: "robots", content: "noindex" }],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  const { data: me } = useSuspenseQuery(authMeQuery());
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminRoute = pathname.startsWith("/account/admin");
  const { isAdmin } = useAuth();
  // Unified realtime stream: notification bell, toasts, live activity feed,
  // QR / payments / bookings query invalidation — one SSE connection.
  useAdminEvents(isAdmin);

  // App-shell (lg+): the content column scrolls internally while the sidebar
  // rail stays fixed. Reset the content scroll to the top on route change so a
  // new page never opens mid-scroll.
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="pt-20 pb-16 sm:pt-24 sm:pb-24 lg:h-[100dvh] lg:overflow-hidden lg:pb-0">
      <AdminRouteTransition pathname={pathname} />
      <Container className="lg:flex lg:h-full lg:flex-col">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10 lg:shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-ink-900/40 sm:text-[11px]">
              {isAdminRoute ? "Admin Studio" : `Member since ${new Date().getFullYear()}`}
            </p>
            <h1 className="mt-2 font-serif text-3xl text-ink-900 sm:text-4xl lg:text-5xl">
              {isAdminRoute ? "Content Studio" : `Welcome, ${me.name.split(" ")[0]}.`}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdminRoute && (
              <div className="hidden items-center gap-2 rounded-full border border-ink-900/10 bg-white/70 px-4 py-2 text-[11px] uppercase tracking-widest text-ink-900/60 shadow-sm backdrop-blur lg:inline-flex">
                <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                Live preview synced
              </div>
            )}
            {isAdmin && <GlobalSearchTrigger />}
            {isAdmin && <NotificationBell />}
          </div>
        </div>
        <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          <aside
            data-lenis-prevent="true"
            className="admin-sidebar-sticky overflow-y-auto overscroll-contain pr-2 lg:h-full"
          >
            <AccountSidebar />
          </aside>
          <div
            ref={contentRef}
            data-lenis-prevent="true"
            className="min-w-0 overscroll-contain lg:h-full lg:overflow-y-auto lg:pb-10 lg:pr-1"
          >
            <Outlet />
          </div>
        </div>
      </Container>
    </div>
  );
}
