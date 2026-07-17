export type BadgeStyle = { bg: string; text: string; dot?: string; label: string };

export const BOOKING_STATUS_STYLE: Record<string, BadgeStyle> = {
  DRAFT: { bg: "bg-ink-900/5", text: "text-ink-900/50", dot: "bg-ink-900/40", label: "Draft" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Pending" },
  PENDING_PAYMENT: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Pending Payment" },
  CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Confirmed" },
  PROCESSING: { bg: "bg-sky-50", text: "text-sky-600", dot: "bg-sky-500", label: "Processing" },
  COMPLETED: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500", label: "Completed" },
  CANCELLATION_REQUESTED: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500", label: "Cancellation Req." },
  CANCELLED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Cancelled" },
  EXPIRED: { bg: "bg-ink-900/5", text: "text-ink-900/40", dot: "bg-ink-900/30", label: "Expired" },
  REFUNDED: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Refunded" },
};

export const PAYMENT_STATUS_STYLE: Record<string, BadgeStyle> = {
  SUCCESS: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Paid" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Pending" },
  FAILED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Failed" },
  REFUNDED: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Refunded" },
  PARTIALLY_REFUNDED: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Partial Refund" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Cancelled" },
  NO_PAYMENT: { bg: "bg-ink-900/5", text: "text-ink-900/40", dot: "bg-ink-900/30", label: "No Payment" },
};

export const TRAVEL_STATUS_STYLE: Record<string, BadgeStyle> = {
  UPCOMING: { bg: "bg-indigo-50", text: "text-indigo-600", label: "Upcoming" },
  ON_TRIP: { bg: "bg-emerald-50", text: "text-emerald-600", label: "On Trip" },
  COMPLETED: { bg: "bg-blue-50", text: "text-blue-600", label: "Completed" },
  CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Confirmed" },
  AWAITING: { bg: "bg-amber-50", text: "text-amber-600", label: "Awaiting" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-600", label: "Cancelled" },
};

export const REFUND_STATUS_STYLE: Record<string, BadgeStyle> = {
  NONE: { bg: "bg-ink-900/5", text: "text-ink-900/40", dot: "bg-ink-900/30", label: "None" },
  REQUESTED: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500", label: "Requested" },
  PROCESSED: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Processed" },
  REFUNDED: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Refunded" },
};

export const INVOICE_STATUS_STYLE: Record<string, BadgeStyle> = {
  PENDING: { bg: "bg-ink-900/5", text: "text-ink-900/40", dot: "bg-ink-900/30", label: "Pending" },
  GENERATED: { bg: "bg-sky-50", text: "text-sky-600", dot: "bg-sky-500", label: "Generated" },
  SENT: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Sent" },
};

export const QR_STATUS_STYLE: Record<string, BadgeStyle> = {
  GENERATED: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Active" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Pending" },
};

export function badge(map: Record<string, BadgeStyle>, key?: string | null): BadgeStyle {
  return (key && map[key]) || { bg: "bg-ink-900/5", text: "text-ink-900/50", dot: "bg-ink-900/40", label: key || "—" };
}

export const MODE_LABEL: Record<string, string> = {
  UPI: "UPI",
  CARD: "Card",
  NETBANKING: "Net Banking",
  WALLET: "Wallet",
  EMI: "EMI",
  UNKNOWN: "—",
};
