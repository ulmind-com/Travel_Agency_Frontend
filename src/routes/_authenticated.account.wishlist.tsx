import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertCircle, Heart, Package } from "lucide-react";

import { PackageCard } from "@/components/packages/package-card";
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
  const { data, isLoading, isError, refetch } = useQuery(wishlistQuery());

  /* loading */
  if (isLoading) {
    return <WishlistSkeleton />;
  }

  /* error */
  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-red-200/60 bg-red-50/40 p-10 text-center backdrop-blur-sm"
      >
        <AlertCircle className="mx-auto size-8 text-red-300" />
        <p className="mt-4 font-serif text-2xl text-red-800/80">
          Couldn&apos;t load your wishlist
        </p>
        <p className="mt-2 text-sm text-red-600/60">
          Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-6 rounded-full bg-red-600/90 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>
      </motion.div>
    );
  }

  const packages = data ?? [];

  /* empty */
  if (packages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-ink-900/5 bg-cream-50 p-14 text-center"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-rose-400/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 size-32 rounded-full bg-pink-400/[0.06] blur-3xl" />

        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto grid size-16 place-items-center rounded-3xl bg-rose-50/60"
          >
            <Heart className="size-7 text-rose-300" />
          </motion.div>
          <p className="mt-5 font-serif text-3xl text-ink-900">
            Your wishlist is empty.
          </p>
          <p className="mt-2 text-sm text-ink-900/50">
            Save escapes that inspire you and return to them anytime.
          </p>
          <Link
            to="/packages"
            className="mt-7 inline-flex rounded-full bg-ink-900 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-cream-50 transition-transform active:scale-95"
          >
            Explore escapes
          </Link>
        </div>
      </motion.div>
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