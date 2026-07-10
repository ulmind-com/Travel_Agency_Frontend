import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  Compass,
  Loader2,
  MapPin,
  MoreHorizontal,
  Users,
  X,
} from "lucide-react";

import { apiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { myBookingsQuery } from "@/lib/queries";
import { bookingsService } from "@/services/bookings.service";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/api";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50/80",
    text: "text-red-500",
    dot: "bg-red-400",
  },
  CANCELLATION_REQUESTED: {
    label: "Cancel requested",
    bg: "bg-orange-50",
    text: "text-orange-600",
    dot: "bg-orange-400",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-400",
  },
  FAILED: {
    label: "Failed",
    bg: "bg-red-50/80",
    text: "text-red-500",
    dot: "bg-red-400",
  },
};

export const Route = createFileRoute("/_authenticated/account/bookings")({
  component: BookingsPage,
});

/* ─── skeleton ─── */
function BookingSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink-900/5 bg-cream-50 p-6">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-ink-900/[0.04] to-transparent" />
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-2.5 w-28 rounded-full bg-ink-900/[0.06]" />
          <div className="h-6 w-44 rounded-xl bg-ink-900/[0.06]" />
          <div className="h-3 w-36 rounded-full bg-ink-900/[0.06]" />
        </div>
        <div className="h-6 w-20 rounded-full bg-ink-900/[0.06]" />
      </div>
    </div>
  );
}

/* ─── status badge ─── */
function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest",
        cfg.bg,
        cfg.text,
      )}
    >
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function BookingsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(myBookingsQuery());

  const cancel = useMutation({
    mutationFn: (id: string) => bookingsService.requestCancel(id),
    onSuccess: () => {
      toast.success("Cancellation requested");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e) =>
      toast.error(apiErrorMessage(e, "Could not request cancellation")),
  });

  /* loading */
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <BookingSkeleton key={i} />
        ))}
      </div>
    );
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
          Couldn&apos;t load your bookings
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

  const bookings = data ?? [];

  /* empty */
  if (bookings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-ink-900/5 bg-cream-50 p-14 text-center"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-blue-400/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 size-32 rounded-full bg-amber-400/[0.06] blur-3xl" />

        <div className="relative">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-ink-900/[0.04]">
            <Compass className="size-7 text-ink-900/25" />
          </div>
          <p className="mt-5 font-serif text-3xl text-ink-900">
            No bookings yet.
          </p>
          <p className="mt-2 text-sm text-ink-900/50">
            When you reserve an escape, it will appear here.
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
    <div className="space-y-4">
      <AnimatePresence>
        {bookings.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              delay: i * 0.06,
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="group relative overflow-hidden rounded-3xl border border-ink-900/[0.06] bg-cream-50 p-6 transition-all duration-300 hover:border-ink-900/12 hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]"
          >
            {/* accent line */}
            <div
              className={cn(
                "absolute left-0 top-0 h-full w-[3px] rounded-l-3xl",
                b.status === "CONFIRMED"
                  ? "bg-emerald-400"
                  : b.status === "CANCELLED" || b.status === "FAILED"
                    ? "bg-red-300"
                    : b.status === "COMPLETED"
                      ? "bg-blue-400"
                      : "bg-amber-400",
              )}
            />

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="min-w-0 pl-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-900/35">
                  {b.booking_reference}
                </p>
                <p className="mt-1.5 truncate font-serif text-xl text-ink-900 sm:text-2xl">
                  Journey · {formatDate(b.travel_start_date)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-900/50">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3" />
                    {b.travelers_count} traveler
                    {b.travelers_count === 1 ? "" : "s"}
                  </span>
                  <span className="text-ink-900/20">·</span>
                  <span className="font-medium text-ink-900/70">
                    {formatCurrency(b.total_amount)}
                  </span>
                </div>
              </div>

              <StatusBadge status={b.status} />

              {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Request cancellation for this booking?",
                      )
                    ) {
                      cancel.mutate(b.id);
                    }
                  }}
                  disabled={cancel.isPending}
                  className="self-start rounded-full border border-ink-900/[0.08] px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-ink-900/50 transition-all hover:border-red-200 hover:bg-red-50/60 hover:text-red-500 disabled:opacity-40"
                >
                  {cancel.isPending ? "Cancelling…" : "Request cancel"}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}