import { Link } from "@tanstack/react-router";
import { Calendar, Users } from "lucide-react";
import { useState } from "react";

import { WishlistButton } from "@/components/packages/wishlist-button";
import { formatCurrency } from "@/lib/format";
import type { Package } from "@/types/api";

export function BookingPanel({ pkg }: { pkg: Package & { id: string } }) {
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(2);
  const price = pkg.discounted_price ?? pkg.base_price;
  const tax = (price * (pkg.tax_percent ?? 0)) / 100;
  const total = (price + tax) * guests;

  return (
    <aside className="sticky top-28 rounded-3xl bg-cream-50 p-6 shadow-[0_20px_60px_-20px_rgba(28,25,23,0.25)] ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-ink-900/40">From</p>
          <p className="mt-1 font-serif text-3xl text-ink-900">
            {formatCurrency(price, pkg.currency ?? "INR")}
            <span className="ml-1 text-xs font-sans uppercase tracking-widest text-ink-900/40">
              / guest
            </span>
          </p>
        </div>
        <WishlistButton packageId={pkg.id} />
      </div>

      {pkg.discounted_price && pkg.discounted_price < pkg.base_price && (
        <p className="mt-1 text-xs text-ink-900/50 line-through">
          {formatCurrency(pkg.base_price, pkg.currency ?? "INR")}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <label className="flex items-center gap-3 rounded-2xl border border-ink-900/10 px-4 py-3">
          <Calendar className="size-4 text-ink-900/40" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full border-none bg-transparent p-0 text-sm text-ink-900 focus:outline-none focus:ring-0"
          />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-ink-900/10 px-4 py-3">
          <Users className="size-4 text-ink-900/40" />
          <input
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
            className="w-full border-none bg-transparent p-0 text-sm text-ink-900 focus:outline-none focus:ring-0"
          />
          <span className="text-xs text-ink-900/40">guests</span>
        </label>
      </div>

      <div className="mt-6 space-y-2 border-t border-ink-900/5 pt-6 text-sm text-ink-900/70">
        <Row label={`Base × ${guests}`} value={formatCurrency(price * guests, pkg.currency)} />
        {pkg.tax_percent ? (
          <Row label={`Taxes (${pkg.tax_percent}%)`} value={formatCurrency(tax * guests, pkg.currency)} />
        ) : null}
        <Row label="Total" value={formatCurrency(total, pkg.currency)} bold />
      </div>

      <Link
        to="/book/$id"
        params={{ id: pkg.id }}
        search={{ date: date || undefined, guests }}
        disabled={!date}
        className="mt-6 block w-full rounded-full bg-ink-900 py-4 text-center text-[12px] font-medium uppercase tracking-widest text-cream-50 ring-1 ring-ink-900 transition-transform hover:scale-[1.01] active:scale-95 aria-disabled:pointer-events-none aria-disabled:opacity-40"
        aria-disabled={!date}
      >
        {date ? "Reserve seats" : "Choose a travel date"}
      </Link>

      <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-ink-900/40">
        No charge until confirmed · Free cancellation up to 14 days
      </p>
    </aside>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={"flex items-center justify-between " + (bold ? "font-medium text-ink-900" : "")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}