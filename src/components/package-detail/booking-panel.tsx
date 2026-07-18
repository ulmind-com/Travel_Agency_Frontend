import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Flame, TrendingUp, Users, Zap } from "lucide-react";
import { useState } from "react";

import { WishlistButton } from "@/components/packages/wishlist-button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { inventoryService, type Availability } from "@/services/inventory.service";
import type { Package } from "@/types/api";

export function BookingPanel({ pkg }: { pkg: Package & { id: string } }) {
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(2);
  const price = pkg.discounted_price ?? pkg.base_price;
  const tax = (price * (pkg.tax_percent ?? 0)) / 100;
  const total = (price + tax) * guests;

  // Live availability — polled from the server (real inventory + Redis holds).
  const { data: avail } = useQuery({
    queryKey: ["availability", pkg.id],
    queryFn: () => inventoryService.availability(pkg.id),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const soldOut = avail?.status === "SOLD_OUT";
  const seatBased = avail?.is_seat_based ?? false;
  // Cap the guest selector to what's actually left, so you can't over-request.
  const maxGuests = seatBased && avail ? Math.max(1, avail.remaining_seats) : 20;
  const canProceed = Boolean(date) && !soldOut && guests <= maxGuests;

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
        <div className="mt-1 flex items-center gap-2">
          <p className="text-xs text-ink-900/50 line-through">
            {formatCurrency(pkg.base_price, pkg.currency ?? "INR")}
          </p>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Save {Math.round(((pkg.base_price - pkg.discounted_price) / pkg.base_price) * 100)}%
          </span>
        </div>
      )}

      {/* Live availability */}
      {avail && <AvailabilityBlock avail={avail} />}

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
            max={maxGuests}
            value={guests}
            onChange={(e) =>
              setGuests(Math.min(maxGuests, Math.max(1, Number(e.target.value) || 1)))
            }
            className="w-full border-none bg-transparent p-0 text-sm text-ink-900 focus:outline-none focus:ring-0"
          />
          <span className="text-xs text-ink-900/40">guests</span>
        </label>
        {seatBased && avail && guests >= maxGuests && !soldOut && (
          <p className="text-[11px] text-amber-700">
            Only {avail.remaining_seats} seat{avail.remaining_seats === 1 ? "" : "s"} left — that's
            the most you can request right now.
          </p>
        )}
      </div>

      <div className="mt-6 space-y-2 border-t border-ink-900/5 pt-6 text-sm text-ink-900/70">
        <Row label={`Base × ${guests}`} value={formatCurrency(price * guests, pkg.currency)} />
        {pkg.tax_percent ? (
          <Row
            label={`Taxes (${pkg.tax_percent}%)`}
            value={formatCurrency(tax * guests, pkg.currency)}
          />
        ) : null}
        <Row label="Total" value={formatCurrency(total, pkg.currency)} bold />
      </div>

      <Link
        to="/book/$id"
        params={{ id: pkg.id }}
        search={{ date: date || undefined, guests }}
        disabled={!canProceed}
        className={cn(
          "mt-6 block w-full rounded-full py-4 text-center text-[12px] font-medium uppercase tracking-widest transition-transform hover:scale-[1.01] active:scale-95 aria-disabled:pointer-events-none aria-disabled:opacity-40",
          soldOut ? "bg-ink-900/40 text-cream-50" : "bg-ink-900 text-cream-50 ring-1 ring-ink-900",
        )}
        aria-disabled={!canProceed}
      >
        {soldOut ? "Sold out" : date ? "Reserve seats" : "Choose a travel date"}
      </Link>

      <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-ink-900/40">
        No charge until confirmed · Free cancellation up to 14 days
      </p>
    </aside>
  );
}

function AvailabilityBlock({ avail }: { avail: Availability }) {
  if (!avail.is_seat_based) {
    // Capacity / non-seat package — no fixed seat map to report against.
    return avail.recently_booked > 0 ? (
      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-ink-900/[0.03] px-4 py-3 text-[12px] text-ink-900/70">
        <TrendingUp className="size-4 text-emerald-600" />
        {avail.recently_booked} booked in the last 7 days
      </div>
    ) : null;
  }

  const { status, remaining_seats, total_seats, booking_progress_pct, recently_booked } = avail;
  const tone =
    status === "SOLD_OUT"
      ? { bar: "bg-rose-500", chip: "bg-rose-100 text-rose-700", label: "Sold out" }
      : status === "LIMITED"
        ? {
            bar: "bg-amber-500",
            chip: "bg-amber-100 text-amber-700",
            label: "Limited availability",
          }
        : { bar: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700", label: "Available" };

  return (
    <div className="mt-5 rounded-2xl border border-ink-900/[0.07] bg-white/60 p-4">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
            tone.chip,
          )}
        >
          {status === "LIMITED" && <Flame className="size-3" />}
          {status === "AVAILABLE" && <Zap className="size-3" />}
          {tone.label}
        </span>
        <span className="text-[12px] text-ink-900/55">
          {status === "SOLD_OUT" ? (
            "0 seats left"
          ) : (
            <>
              <b className="text-ink-900">{remaining_seats}</b> of {total_seats} left
            </>
          )}
        </span>
      </div>

      {/* Booking progress bar */}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-900/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-700", tone.bar)}
          style={{ width: `${Math.max(3, Math.min(100, booking_progress_pct))}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-900/40">
        <span>{Math.round(booking_progress_pct)}% booked</span>
        {recently_booked > 0 && (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <TrendingUp className="size-3" />
            {recently_booked} booked this week
          </span>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={"flex items-center justify-between " + (bold ? "font-medium text-ink-900" : "")}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
