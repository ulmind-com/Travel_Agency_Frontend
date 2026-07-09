import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";

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
  return (
    <div className="pt-24 pb-24">
      <Container>
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
            Member since {new Date().getFullYear()}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-ink-900">Welcome, {me.name.split(" ")[0]}.</h1>
        </div>
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <AccountSidebar />
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </Container>
    </div>
  );
}