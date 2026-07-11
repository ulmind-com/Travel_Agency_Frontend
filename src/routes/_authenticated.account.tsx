import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";

import { AccountSidebar } from "@/components/account/sidebar";
import { Container } from "@/components/layout/container";
import { authMeQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account · Ulmind Travel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  const { data: me } = useSuspenseQuery(authMeQuery());
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminRoute = pathname.startsWith("/account/admin");
  return (
    <div className="pt-24 pb-24">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
              {isAdminRoute ? "Admin Studio" : `Member since ${new Date().getFullYear()}`}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-ink-900 lg:text-5xl">
              {isAdminRoute ? "Content Studio" : `Welcome, ${me.name.split(" ")[0]}.`}
            </h1>
          </div>
          {isAdminRoute && (
            <div className="hidden items-center gap-2 rounded-full border border-ink-900/10 bg-white/70 px-4 py-2 text-[11px] uppercase tracking-widest text-ink-900/60 shadow-sm backdrop-blur lg:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              Live preview synced
            </div>
          )}
        </div>
        <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="admin-sidebar-sticky lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
            <AccountSidebar />
          </aside>
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </Container>
    </div>
  );
}