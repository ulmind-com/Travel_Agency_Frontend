import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

import { WishlistButton } from "./wishlist-button";
import { formatCurrency } from "@/lib/format";
import type { Package } from "@/types/api";

type Props = {
  pkg: Package & { id: string };
};

export function PackageCard({ pkg }: Props) {
  const price = pkg.discounted_price ?? pkg.base_price;
  return (
    <article className="group flex flex-col">
      <Link
        to="/packages/$id"
        params={{ id: pkg.id }}
        className="relative block overflow-hidden rounded-3xl bg-cream-100 ring-1 ring-black/5"
        style={{ aspectRatio: "4/5" }}
      >
        <motion.img
          src={pkg.thumbnail?.url}
          alt={pkg.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-900/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute right-4 top-4">
          <WishlistButton packageId={pkg.id} />
        </div>
        {pkg.category && (
          <span className="absolute left-4 top-4 rounded-full bg-cream-50/85 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-ink-900 backdrop-blur">
            {pkg.category.toLowerCase()}
          </span>
        )}
      </Link>
      <div className="mt-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/packages/$id"
            params={{ id: pkg.id }}
            className="block truncate font-serif text-2xl text-ink-900 transition-colors group-hover:text-ink-900/80"
          >
            {pkg.title}
          </Link>
          <p className="mt-1 truncate text-[11px] uppercase tracking-widest text-ink-900/40">
            {pkg.duration_nights} nights ·{" "}
            {pkg.destinations?.[0] ?? "Multi-destination"}
          </p>
        </div>
        <div className="text-right">
          <span className="block text-sm font-medium text-ink-900">
            {formatCurrency(price, pkg.currency ?? "INR")}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-ink-900/40">
            per guest
          </span>
        </div>
      </div>
    </article>
  );
}