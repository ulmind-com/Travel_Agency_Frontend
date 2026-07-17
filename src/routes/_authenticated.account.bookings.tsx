import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarDays,
  Compass,
  MapPin,
  Users,
  CreditCard,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Ticket
} from "lucide-react";

import { apiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { myBookingsQuery } from "@/lib/queries";
import { bookingsService } from "@/services/bookings.service";
import { paymentsService } from "@/services/payments.service";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/api";
import {
  AdminScopeCard,
  ErrorStateCard,
  StateCard,
} from "@/components/account/state-card";
import { httpStatus } from "@/components/account/state-card";

const safeFormatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return "N/A";
  try {
    return formatDate(dateStr);
  } catch (e) {
    return "Invalid Date";
  }
};

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; border: string; text: string; icon: any }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-600",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-600",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-600",
    icon: XCircle,
  },
  CANCELLATION_REQUESTED: {
    label: "Cancel Requested",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-600",
    icon: AlertCircle,
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-600",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-600",
    icon: XCircle,
  },
  PENDING_PAYMENT: {
    label: "Pending Payment",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-600",
    icon: Clock,
  },
  REFUNDED: {
    label: "Refunded",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-600",
    icon: CheckCircle2,
  },
};

export const Route = createFileRoute("/_authenticated/account/bookings")({
  component: BookingsPage,
});

function BookingSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink-900/5 bg-cream-50 p-6 shadow-sm">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-ink-900/[0.04] to-transparent" />
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-full sm:w-48 h-32 rounded-2xl bg-ink-900/[0.06] shrink-0" />
        <div className="flex-1 space-y-4 w-full">
          <div className="h-6 w-3/4 rounded-lg bg-ink-900/[0.06]" />
          <div className="h-4 w-1/2 rounded-lg bg-ink-900/[0.06]" />
          <div className="h-4 w-2/3 rounded-lg bg-ink-900/[0.06]" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    bg: "bg-ink-900/10",
    border: "border-ink-900/20",
    text: "text-ink-900/60",
    icon: Compass,
  };
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border backdrop-blur-md",
        cfg.bg,
        cfg.border,
        cfg.text
      )}
    >
      <Icon className="size-3.5" />
      {cfg.label}
    </span>
  );
}

function BookingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "PAST" | "CANCELLED">("UPCOMING");
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery(myBookingsQuery());

  const cancel = useMutation({
    mutationFn: (id: string) => bookingsService.requestCancel(id),
    onSuccess: () => {
      toast.success("Cancellation requested successfully.");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not request cancellation")),
  });

  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  const retryPayment = async (bookingId: string) => {
    try {
      setIsRetrying(bookingId);
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/payments/${bookingId}/retry`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch payment details");
      const data = await res.json();
      
      await openRazorpayCheckout({
        key: data.razorpay_key_id,
        amount: data.amount_paise,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: "Ulmind Travel",
        description: data.booking.package_snapshot?.title || "Premium Escape",
        theme: { color: "#1c1917" },
        handler: async (resp) => {
          try {
            await paymentsService.verify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              lock_id: data.lock_id,
              package_id: data.booking.package_id,
            });
            toast.success("Payment successful! Booking confirmed! 🎉");
            qc.invalidateQueries({ queryKey: ["bookings"] });
          } catch (err) {
            toast.error(apiErrorMessage(err, "Payment verification failed"));
          }
        },
      });
    } catch (e) {
      toast.error(apiErrorMessage(e, "Unable to retry payment"));
    } finally {
      setIsRetrying(null);
    }
  };

  const downloadFile = async (bookingId: string, type: "invoice" | "ticket") => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/api/v1/payments/${bookingId}/${type}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to download file");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type === 'invoice' ? 'Invoice' : 'Ticket'}-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      toast.error("Unable to download document right now.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <BookingSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    if (httpStatus(error) === 403) return <AdminScopeCard section="Bookings" />;
    return <ErrorStateCard section="your bookings" onRetry={() => refetch()} retrying={isFetching} />;
  }

  const allBookings = data ?? [];
  const now = new Date();
  
  const upcoming = allBookings.filter(b => 
    ["PENDING", "PENDING_PAYMENT", "CONFIRMED"].includes(b.status) && new Date(b.travel_start_date) >= now
  );
  
  const past = allBookings.filter(b => 
    ["CONFIRMED", "COMPLETED"].includes(b.status) && new Date(b.travel_start_date) < now
  );
  
  const cancelled = allBookings.filter(b => 
    ["CANCELLED", "CANCELLATION_REQUESTED", "REFUNDED", "FAILED"].includes(b.status)
  );

  let displayBookings = upcoming;
  if (activeTab === "PAST") displayBookings = past;
  if (activeTab === "CANCELLED") displayBookings = cancelled;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-ink-900/10 pb-4">
        {["UPCOMING", "PAST", "CANCELLED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-[17px]",
              activeTab === tab 
                ? "border-ink-900 text-ink-900" 
                : "border-transparent text-ink-900/40 hover:text-ink-900/70"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {displayBookings.length === 0 ? (
        <StateCard
          icon={Compass}
          eyebrow={`Your ${activeTab.toLowerCase()} journeys`}
          title="No reservations found."
          description={`You don't have any ${activeTab.toLowerCase()} bookings at the moment.`}
          primary={activeTab === "UPCOMING" ? { label: "Explore escapes", to: "/packages" } : undefined}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          {displayBookings.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="group relative overflow-hidden rounded-3xl border border-ink-900/[0.08] bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:border-ink-900/15"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Left side: Thumbnail */}
                <div className="relative w-full sm:w-72 shrink-0 overflow-hidden sm:rounded-l-3xl">
                  <div className="aspect-[4/3] sm:aspect-auto sm:h-full w-full bg-ink-900/5">
                    {b.package_thumbnail?.url || b.package_snapshot?.thumbnail?.url ? (
                      <img
                        src={b.package_thumbnail?.url || b.package_snapshot?.thumbnail?.url}
                        alt={b.package_title || b.package_snapshot?.title || "Package thumbnail"}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Compass className="size-10 text-ink-900/20" />
                      </div>
                    )}
                  </div>
                  {/* Status Badge Overlaid on Image */}
                  <div className="absolute top-4 left-4 z-10">
                    <StatusBadge status={b.status} />
                  </div>
                </div>

                {/* Right side: Content */}
                <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-900/40">
                        REF: {b.booking_reference}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-900/50 bg-ink-900/5 px-3 py-1.5 rounded-full">
                        <Clock className="size-3.5" />
                        Booked {safeFormatDate(b.created_at)}
                      </span>
                    </div>

                    <h3 className="mt-4 font-serif text-2xl font-medium text-ink-900 sm:text-3xl line-clamp-2 leading-tight">
                      {b.package_title || b.package_snapshot?.title || "Premium Escape"}
                    </h3>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 gap-y-4 text-sm">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-ink-900/60">
                          <MapPin className="size-4.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-900/40">Where</p>
                          <p className="font-medium text-ink-900 mt-1 line-clamp-1 text-[15px]">
                            {b.package_destinations?.length ? b.package_destinations.join(", ") : b.package_snapshot?.destination || "Destination"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-ink-900/60">
                          <CalendarDays className="size-4.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-900/40">When</p>
                          <p className="font-medium text-ink-900 mt-1 text-[15px]">
                            {safeFormatDate(b.travel_start_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-ink-900/60">
                          <Users className="size-4.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-900/40">Who</p>
                          <p className="font-medium text-ink-900 mt-1 text-[15px]">
                            {b.travelers?.[0]?.name || "Traveler"}
                            {b.travelers_count > 1 ? ` + ${b.travelers_count - 1} more` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900/5 text-ink-900/60">
                          <CreditCard className="size-4.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-900/40">Payment</p>
                          <p className="font-medium text-ink-900 mt-1 text-[15px]">
                            {b.status === "PENDING" || b.status === "PENDING_PAYMENT" ? (
                               <span className="text-amber-600">Payment Pending</span>
                            ) : b.status === "CONFIRMED" || b.status === "COMPLETED" ? (
                               <span className="text-emerald-600">Paid in full</span>
                            ) : b.status === "REFUNDED" ? (
                               <span className="text-purple-600">Refunded</span>
                            ) : (
                               <span className="text-red-600">Cancelled</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ink-900/10 pt-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-ink-900/40">Total Amount</span>
                      <span className="font-serif text-xl sm:text-2xl font-semibold text-ink-900 mt-0.5">
                        {formatCurrency(b.total_amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {(b.status === "CONFIRMED" || b.status === "COMPLETED") && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => downloadFile(b.id!, 'invoice')}
                            className="flex items-center gap-1.5 rounded-full bg-ink-900/5 px-4 py-2 text-xs font-semibold text-ink-900 hover:bg-ink-900/10 transition-colors"
                          >
                            <FileText className="size-3.5" />
                            Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadFile(b.id!, 'ticket')}
                            className="flex items-center gap-1.5 rounded-full bg-ink-900 text-white px-4 py-2 text-xs font-semibold hover:bg-ink-900/90 transition-colors"
                          >
                            <Ticket className="size-3.5" />
                            Boarding Pass
                          </button>
                        </div>
                      )}

                      {(b.status === "PENDING" || b.status === "PENDING_PAYMENT") && (
                        <button
                          type="button"
                          onClick={() => retryPayment(b.id!)}
                          disabled={isRetrying === b.id}
                          className="rounded-full bg-ink-900 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-all hover:bg-ink-900/90 disabled:opacity-50 shadow-md"
                        >
                          {isRetrying === b.id ? "Processing…" : "Pay Now"}
                        </button>
                      )}

                      {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to request cancellation for this booking?")) {
                              cancel.mutate(b.id!);
                            }
                          }}
                          disabled={cancel.isPending}
                          className="rounded-full border border-red-200 bg-red-50/50 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-red-600 transition-all hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        >
                          {cancel.isPending ? "Processing…" : "Cancel Trip"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}