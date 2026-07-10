import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CalendarCheck, Heart, Loader2, Users, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

import { myBookingsQuery, wishlistQuery, travelersQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/account/")({
  component: Overview,
});

/* ─── shimmer skeleton ─── */
function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink-900/5 bg-cream-50 p-7">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-ink-900/[0.04] to-transparent" />
      <div className="h-3 w-24 rounded-full bg-ink-900/[0.06]" />
      <div className="mt-5 h-10 w-16 rounded-xl bg-ink-900/[0.06]" />
    </div>
  );
}

/* ─── error banner ─── */
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl border border-red-200/60 bg-red-50/60 px-5 py-3.5 backdrop-blur-sm"
    >
      <AlertCircle className="size-4 shrink-0 text-red-400" />
      <p className="flex-1 text-sm text-red-600/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-[11px] font-semibold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
      >
        Retry
      </button>
    </motion.div>
  );
}

/* ─── animated stat card ─── */
function StatCard({
  label,
  value,
  to,
  icon: Icon,
  gradient,
  index,
}: {
  label: string;
  value: number;
  to: string;
  icon: React.ElementType;
  gradient: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-3xl border border-ink-900/[0.06] bg-cream-50 p-7 transition-all duration-300 hover:border-ink-900/15 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]"
      >
        {/* subtle gradient accent */}
        <div
          className={`absolute -right-6 -top-6 size-24 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.14] ${gradient}`}
        />

        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-900/40">{label}</p>
            <motion.p
              className="mt-3 font-serif text-5xl tabular-nums text-ink-900"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.25 }}
            >
              {value}
            </motion.p>
          </div>
          <div className="grid size-10 place-items-center rounded-2xl bg-ink-900/[0.04] text-ink-900/30 transition-colors group-hover:bg-ink-900/[0.08] group-hover:text-ink-900/50">
            <Icon className="size-[18px]" />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-ink-900/30 transition-colors group-hover:text-ink-900/60">
          View details
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── main component ─── */
function Overview() {
  const bookings = useQuery(myBookingsQuery());
  const wishlist = useQuery(wishlistQuery());
  const travelers = useQuery(travelersQuery());

  const isLoading = bookings.isLoading || wishlist.isLoading || travelers.isLoading;
  const hasError = bookings.isError || wishlist.isError || travelers.isError;

  const active = (bookings.data ?? []).filter((b) =>
    ["PENDING", "CONFIRMED", "CANCELLATION_REQUESTED"].includes(b.status),
  );

  return (
    <div className="space-y-8">
      {/* error banner */}
      {hasError && (
        <ErrorBanner
          message="Some data couldn't be loaded. Your connection or the server may be momentarily unavailable."
          onRetry={() => {
            bookings.refetch();
            wishlist.refetch();
            travelers.refetch();
          }}
        />
      )}

      {/* stat cards */}
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          <StatCard
            label="Active journeys"
            value={active.length}
            to="/account/bookings"
            icon={CalendarCheck}
            gradient="bg-blue-500"
            index={0}
          />
          <StatCard
            label="Saved escapes"
            value={(wishlist.data ?? []).length}
            to="/account/wishlist"
            icon={Heart}
            gradient="bg-rose-500"
            index={1}
          />
          <StatCard
            label="Travel companions"
            value={(travelers.data ?? []).length}
            to="/account/travelers"
            icon={Users}
            gradient="bg-amber-500"
            index={2}
          />
        </div>
      )}

      {/* concierge section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-ink-900 p-10"
      >
        {/* decorative blurs */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-60 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-cream-50/40" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-cream-50/40">
              Concierge
            </p>
          </div>
          <p className="mt-4 max-w-md font-serif text-3xl leading-snug text-cream-50">
            Anything you need — we&apos;re a message away.
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-cream-50/50">
            Reach out to design a private itinerary, adjust an upcoming booking,
            or add a companion to your next journey.
          </p>
          <Link
            to="/contact"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-cream-50/15 bg-cream-50/[0.08] px-6 py-3 text-[12px] font-medium uppercase tracking-widest text-cream-50 backdrop-blur-sm transition-all hover:bg-cream-50/15"
          >
            Message concierge
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}