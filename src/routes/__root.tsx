import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { LenisProvider } from "../components/motion/lenis-provider";
import { Navbar } from "../components/layout/navbar";
import { Footer } from "../components/layout/footer";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/inter";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4">
      <div className="max-w-md text-center">
        <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
          Ulmind Travel
        </p>
        <h1 className="font-serif text-6xl italic text-ink-900">Off the map.</h1>
        <p className="mt-6 text-sm leading-relaxed text-ink-900/60">
          The page you're looking for is not part of our current portfolio.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-ink-900 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-cream-50 transition-transform active:scale-95"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl text-ink-900">
          A quiet detour occurred
        </h1>
        <p className="mt-3 text-sm text-ink-900/60">
          Something on our end interrupted this journey. Try again or return home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-ink-900 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-cream-50 transition-transform active:scale-95"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-ink-900/15 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-ink-900"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ulmind Travel — Curated luxury journeys" },
      {
        name: "description",
        content:
          "Ulmind Travel is a boutique agency crafting quiet, high-fidelity luxury journeys — from Amalfi villas to Maldives atolls and the fjords of the Arctic Circle.",
      },
      { name: "author", content: "Ulmind Travel" },
      { property: "og:title", content: "Ulmind Travel — Curated luxury journeys" },
      {
        property: "og:description",
        content:
          "Boutique itineraries and private concierge for the discerning traveler.",
      },
      { property: "og:site_name", content: "Ulmind Travel" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
        <Toaster position="top-center" richColors closeButton theme="light" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = pathname.startsWith("/auth/");
  return (
    <>
      <LenisProvider />
      <div className="flex min-h-screen flex-col bg-cream-50 text-ink-900">
        {!bare && <Navbar />}
        <main className="flex-1">
          <Outlet />
        </main>
        {!bare && <Footer />}
      </div>
    </>
  );
}
