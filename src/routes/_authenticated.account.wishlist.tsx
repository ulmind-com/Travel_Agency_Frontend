import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PackageCard } from "@/components/packages/package-card";
import { wishlistQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/account/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { data } = useSuspenseQuery(wishlistQuery());
  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-ink-900/5 bg-cream-50 p-12 text-center">
        <p className="font-serif text-3xl text-ink-900">Your wishlist is empty.</p>
        <p className="mt-2 text-sm text-ink-900/60">
          Save escapes that inspire you and return to them anytime.
        </p>
        <Link
          to="/packages"
          className="mt-6 inline-flex rounded-full bg-ink-900 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-cream-50"
        >
          Explore escapes
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {data.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} />
      ))}
    </div>
  );
}