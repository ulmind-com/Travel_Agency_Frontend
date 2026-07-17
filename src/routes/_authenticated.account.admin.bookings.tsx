import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Search, FileText, Ticket, CreditCard, ChevronRight } from "lucide-react";
import { adminBookingsQuery } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account/admin/bookings")({
  component: AdminBookingsPage,
});

const BOOKING_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-600" },
  COMPLETED: { bg: "bg-blue-50", text: "text-blue-600" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-600" },
  PENDING_PAYMENT: { bg: "bg-amber-50", text: "text-amber-600" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-600" },
  CANCELLATION_REQUESTED: { bg: "bg-orange-50", text: "text-orange-600" },
  REFUNDED: { bg: "bg-purple-50", text: "text-purple-600" },
  FAILED: { bg: "bg-red-50", text: "text-red-600" },
};

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  SUCCESS: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Paid" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-600", label: "Pending" },
  FAILED: { bg: "bg-red-50", text: "text-red-600", label: "Failed" },
  REFUNDED: { bg: "bg-purple-50", text: "text-purple-600", label: "Refunded" },
  NO_PAYMENT: { bg: "bg-ink-900/5", text: "text-ink-900/50", label: "No Payment" },
};

function AdminBookingsPage() {
  const { data: bookings, isLoading } = useQuery(adminBookingsQuery(0, 100));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium text-ink-900">All Bookings</h2>
          <p className="text-sm text-ink-900/60 mt-1">Manage and track all customer reservations across the platform.</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-900/40" />
          <input 
            type="text" 
            placeholder="Search by ref or name..." 
            className="w-full sm:w-64 pl-9 pr-4 py-2.5 rounded-full border border-ink-900/10 bg-white text-sm focus:ring-1 focus:ring-ink-900 outline-none transition-shadow"
          />
        </div>
      </div>

      <div className="bg-white border border-ink-900/[0.08] rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-cream-50/50">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-ink-900/40 text-[11px]">Booking Details</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-ink-900/40 text-[11px]">Customer</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-ink-900/40 text-[11px]">Amount</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-ink-900/40 text-[11px]">Booking Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-ink-900/40 text-[11px]">Payment</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-ink-900/40 text-[11px]">Travel Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-900/40">Loading bookings...</td>
                </tr>
              ) : bookings?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-900/40">No bookings found.</td>
                </tr>
              ) : (
                bookings?.map((b: any) => {
                  const bStyle = BOOKING_STATUS_STYLE[b.status] || { bg: "bg-ink-900/5", text: "text-ink-900/50" };
                  const pStatus = b.payment_status || "NO_PAYMENT";
                  const pStyle = PAYMENT_STATUS_STYLE[pStatus] || PAYMENT_STATUS_STYLE.NO_PAYMENT;
                  
                  return (
                    <tr key={b.id} className="hover:bg-cream-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-ink-900/5 flex items-center justify-center shrink-0">
                            <CalendarCheck className="size-5 text-ink-900/30" />
                          </div>
                          <div>
                            <p className="font-medium text-ink-900 text-[13px]">{b.package_title || b.package_snapshot?.title || "Unknown Package"}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-900/40 mt-1">{b.booking_reference}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-ink-900 text-sm">{b.user_name || "Unknown"}</p>
                        <p className="text-xs text-ink-900/50">{b.user_email || "No email"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-ink-900">{formatCurrency(b.total_amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
                          bStyle.bg, bStyle.text
                        )}>
                          {b.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
                          pStyle.bg, pStyle.text
                        )}>
                          <CreditCard className="size-3" />
                          {pStyle.label}
                        </span>
                        {b.payment_mode && b.payment_mode !== "UNKNOWN" && (
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-ink-900/40">
                            {b.payment_mode}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-ink-900/70">{formatDate(b.travel_start_date)}</p>
                        <p className="text-xs text-ink-900/40 mt-0.5">{b.travelers_count} travelers</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
