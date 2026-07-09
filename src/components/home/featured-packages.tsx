import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { PackageCard } from "@/components/packages/package-card";
import { PackageCardSkeleton } from "@/components/packages/package-card-skeleton";
import { trendingPackagesQuery } from "@/lib/queries";

export function FeaturedPackages() {
  return (
    <section className="py-24">
      <Container>
        <FadeUp className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
              The Autumn Collection
            </p>
            <h2 className="font-serif text-4xl font-medium text-ink-900 md:text-5xl">
              Moments selected for their atmospheric quality.
            </h2>
          </div>
          <Link
            to="/packages"
            className="border-b border-ink-900/20 pb-1 text-sm font-medium text-ink-900 transition-colors hover:border-ink-900"
          >
            View all escapes
          </Link>
        </FadeUp>
        <Suspense fallback={<Grid skeleton />}>
          <TrendingList />
        </Suspense>
      </Container>
    </section>
  );
}

function TrendingList() {
  const { data } = useSuspenseQuery(trendingPackagesQuery(6));
  if (!data.length) return <EmptyState />;
  return <Grid items={data} />;
}

function Grid({
  items,
  skeleton,
}: {
  items?: Array<{ id: string; title: string; destinations: string[]; duration_nights: number; base_price: number; discounted_price?: number | null; currency: string; thumbnail: { url: string } }>;
  skeleton?: boolean;
}) {
  if (skeleton) {
    return (
      <div className="grid gap-8 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <PackageCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {items!.slice(0, 6).map((pkg, i) => (
        <FadeUp key={pkg.id} delay={i * 0.06}>
          <PackageCard pkg={pkg as never} />
        </FadeUp>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-ink-900/5 bg-cream-100 p-16 text-center">
      <p className="font-serif text-2xl text-ink-900">The portfolio is being refreshed.</p>
      <p className="mt-3 text-sm text-ink-900/60">
        New escapes for the season are being added. Please check back shortly.
      </p>
    </div>
  );
}