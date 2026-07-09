import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({
        to: "/auth/login",
        search: { redirect: pathname },
        replace: true,
      });
    }
  }, [isAuthenticated, isLoading, navigate, pathname]);

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-6">
        <p className="text-sm text-ink-900/50">Preparing your account…</p>
      </div>
    );
  }

  return <Outlet />;
}