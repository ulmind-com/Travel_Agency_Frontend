import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { FilterBar } from "@/components/packages/filter-bar";
import { PackageCard } from "@/components/packages/package-card";
import { PackageCardSkeleton } from "@/components/packages/package-card-skeleton";
import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { publicPackagesQuery } from "@/lib/queries";

const CategoryEnum = z.enum([
  "HONEYMOON",
  "ADVENTURE",
  "BEACH",
  "WILDLIFE",
  "HERITAGE",
  "FAMILY",
  "MOUNTAIN",
  "PILGRIMAGE",
  "OTHER",
]);

const SearchSchema = z.object({
  destination: z.string().optional(),
  category: CategoryEnum.optional(),
  min_price: z.coerce.number().nonnegative().optional(),
  max_price: z.coerce.number().nonnegative().optional(),
});

export const Route = createFileRoute("/packages")({
  head: () => ({
    meta: [
      { title: "Escapes · Ulmind Travel" },
      {
        name: "description",
        content:
          "Browse curated luxury travel packages by destination, price and category — from beach retreats to mountain sanctuaries.",
      },
      { property: "og:title", content: "Escapes · Ulmind Travel" },
      { property: "og:description", content: "Curated luxury travel packages." },
      { property: "og:url", content: "/packages" },
    ],
    links: [{ rel: "canonical", href: "/packages" }],
  }),
  validateSearch: (search) => SearchSchema.parse(search),
  loaderDeps: ({ search: { destination, category, min_price, max_price } }) => ({
    destination,
    category,
    min_price,
    max_price,
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(publicPackagesQuery(deps)),
  pendingComponent: PackagesPending,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="font-serif text-3xl text-ink-900">Escapes unavailable</p>
      <p className="mt-2 text-sm text-ink-900/60">{error.message}</p>
    </div>
  ),
  component: PackagesPage,
});

function PackagesPage() {
  const { destination, category, min_price, max_price } = Route.useSearch();
  const { data } = useSuspenseQuery(
    publicPackagesQuery({ destination, category, min_price, max_price }),
  );

  return (
    <div className="pt-20">
      <Container className="py-10 sm:py-14 lg:py-20">
        <FadeUp>
          <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
            The full portfolio
          </p>
          <h1 className="mt-4 font-serif text-3xl font-medium text-ink-900 sm:text-5xl md:text-6xl">
            Every escape, thoughtfully composed.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ink-900/60 sm:text-base">
            Filter by intent, destination or budget. Each package is designed
            with our concierge team.
          </p>
        </FadeUp>
      </Container>
      <FilterBar
        destination={destination}
        category={category}
        minPrice={min_price}
        maxPrice={max_price}
      />
      <Container className="py-10 sm:py-16">
        {data.length === 0 ? (
          <div className="rounded-3xl border border-ink-900/5 bg-cream-100 p-8 text-center sm:p-16">
            <p className="font-serif text-2xl text-ink-900">Nothing quite matches.</p>
            <p className="mt-3 text-sm text-ink-900/60">
              Try broadening your filters — or ask our concierge to design one
              for you.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {data.map((pkg, i) => (
              <FadeUp key={pkg.id} delay={(i % 6) * 0.05}>
                <PackageCard pkg={pkg} />
              </FadeUp>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

function PackagesPending() {
  return (
    <div className="pt-20">
      <Container className="py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PackageCardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}