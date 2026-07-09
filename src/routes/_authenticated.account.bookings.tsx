import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { myBookingsQuery } from "@/lib/queries";
import { bookingsService } from "@/services/bookings.service";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/api";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  CANCELLATION_REQUESTED: "Cancellation requested",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export const Route = createFileRoute("/_authenticated/account/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(myBookingsQuery());

  const cancel = useMutation({
    mutationFn: (id: string) => bookingsService.requestCancel(id),
    onSuccess: () => {
      toast.success("Cancellation requested");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not request cancellation")),
  });

  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-ink-900/5 bg-cream-50 p-12 text-center">
        <p className="font-serif text-3xl text-ink-900">No bookings yet.</p>
        <p className="mt-2 text-sm text-ink-900/60">
          When you reserve an escape, it will appear here.
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
    <ul className="space-y-4">
      {data.map((b) => (
        <li
          key={b.id}
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-3xl border border-ink-900/5 bg-cream-50 p-6 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
        >
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-ink-900/40">
              {b.booking_reference}
            </p>
            <p className="mt-1 truncate font-serif text-2xl text-ink-900">
              Journey · {formatDate(b.travel_start_date)}
            </p>
            <p className="mt-1 text-xs text-ink-900/60">
              {b.travelers_count} traveler{b.travelers_count === 1 ? "" : "s"} ·
              {" "}
              {formatCurrency(b.total_amount)}
            </p>
          </div>
          <span
            className={cn(
              "self-start rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-widest",
              b.status === "CONFIRMED"
                ? "bg-ink-900 text-cream-50"
                : b.status === "CANCELLED" || b.status === "FAILED"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-cream-200 text-ink-900/70",
            )}
          >
            {STATUS_LABEL[b.status]}
          </span>
          {(b.status === "PENDING" || b.status === "CONFIRMED") && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Request cancellation for this booking?")) {
                  cancel.mutate(b.id);
                }
              }}
              disabled={cancel.isPending}
              className="self-start text-[11px] uppercase tracking-widest text-ink-900/60 hover:text-ink-900"
            >
              Request cancel
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}