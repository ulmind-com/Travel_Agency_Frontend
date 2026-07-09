import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { myBookingsQuery, wishlistQuery, travelersQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/account/")({
  component: Overview,
});

function Overview() {
  const bookings = useSuspenseQuery(myBookingsQuery());
  const wishlist = useSuspenseQuery(wishlistQuery());
  const travelers = useSuspenseQuery(travelersQuery());

  const active = bookings.data.filter((b) =>
    ["PENDING", "CONFIRMED", "CANCELLATION_REQUESTED"].includes(b.status),
  );

  return (
    <div className="space-y-10">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Active journeys" value={active.length} to="/account/bookings" />
        <Stat label="Saved escapes" value={wishlist.data.length} to="/account/wishlist" />
        <Stat label="Travel companions" value={travelers.data.length} to="/account/travelers" />
      </div>

      <div className="rounded-3xl bg-cream-100 p-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-ink-900/40">Concierge</p>
        <p className="mt-3 font-serif text-3xl text-ink-900">
          Anything you need — we&apos;re a message away.
        </p>
        <p className="mt-3 max-w-lg text-sm text-ink-900/60">
          Reach out to design a private itinerary, adjust an upcoming booking,
          or add a companion.
        </p>
        <Link
          to="/contact"
          className="mt-6 inline-flex rounded-full bg-ink-900 px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-cream-50"
        >
          Message concierge
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-3xl border border-ink-900/5 bg-cream-50 p-6 transition-colors hover:border-ink-900/20"
    >
      <p className="text-[11px] uppercase tracking-widest text-ink-900/40">{label}</p>
      <p className="mt-3 font-serif text-4xl text-ink-900">{value}</p>
    </Link>
  );
}