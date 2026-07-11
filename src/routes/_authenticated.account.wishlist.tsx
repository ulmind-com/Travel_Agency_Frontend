import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

import { PackageCard } from "@/components/packages/package-card";
import {
  AdminScopeCard,
  ErrorStateCard,
  StateCard,
  httpStatus,
} from "@/components/account/state-card";
import { wishlistQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/account/wishlist")({
  component: WishlistPage,
});

/* ─── skeleton ─── */
function WishlistSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-3xl border border-ink-900/5 bg-cream-50"
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-ink-900/[0.04] to-transparent" />
          <div className="aspect-[4/3] bg-ink-900/[0.04]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-20 rounded-full bg-ink-900/[0.06]" />
            <div className="h-5 w-40 rounded-xl bg-ink-900/[0.06]" />
            <div className="h-3 w-28 rounded-full bg-ink-900/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function WishlistPage() {
  const { data, isLoading, isError, error, isFetching, refetch } =
    useQuery(wishlistQuery());

  /* loading */
  if (isLoading) {
    return <WishlistSkeleton />;
  }

  /* error */
  if (isError) {
    if (httpStatus(error) === 403) return <AdminScopeCard section="Wishlist" />;
    return (
      <ErrorStateCard
        section="your wishlist"
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    );
  }

  const packages = data ?? [];

  /* empty */
  if (packages.length === 0) {
    return (
      <StateCard
        icon={Heart}
        eyebrow="Your wishlist"
        title="Nothing saved just yet."
        description="Bookmark the journeys that speak to you — they'll live here, curated and quiet, ready when you are."
        primary={{ label: "Explore escapes", to: "/packages" }}
      />
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {packages.map((pkg, i) => (
        <motion.div
          key={pkg.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.08,
            duration: 0.45,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <PackageCard pkg={pkg} />
        </motion.div>
      ))}
    </div>
  );
}