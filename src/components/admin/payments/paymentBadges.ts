export type BadgeStyle = { bg: string; text: string; dot?: string; label: string };

/** Every payment lifecycle state gets a premium color-coded badge. */
export const PAYMENT_STATUS_STYLE: Record<string, BadgeStyle> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Pending" },
  AUTHORIZED: { bg: "bg-sky-50", text: "text-sky-600", dot: "bg-sky-500", label: "Authorized" },
  CAPTURED: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Captured" },
  SUCCESS: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Success" },
  FAILED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Failed" },
  CANCELLED: { bg: "bg-ink-900/5", text: "text-ink-900/50", dot: "bg-ink-900/40", label: "Cancelled" },
  REFUNDED: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Refunded" },
  PARTIALLY_REFUNDED: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Partial Refund" },
  CHARGEBACK: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-600", label: "Chargeback" },
  DISPUTED: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500", label: "Disputed" },
  EXPIRED: { bg: "bg-ink-900/5", text: "text-ink-900/40", dot: "bg-ink-900/30", label: "Expired" },
};

export const SETTLEMENT_STATUS_STYLE: Record<string, BadgeStyle> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Unsettled" },
  SETTLED: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Settled" },
  ON_HOLD: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500", label: "On Hold" },
  NOT_APPLICABLE: { bg: "bg-ink-900/5", text: "text-ink-900/35", dot: "bg-ink-900/25", label: "N/A" },
};

export const REFUND_STATUS_STYLE: Record<string, BadgeStyle> = {
  NONE: { bg: "bg-ink-900/5", text: "text-ink-900/40", dot: "bg-ink-900/30", label: "None" },
  REQUESTED: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500", label: "Requested" },
  APPROVED: { bg: "bg-sky-50", text: "text-sky-600", dot: "bg-sky-500", label: "Approved" },
  PROCESSED: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Processed" },
  PARTIAL: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Partial" },
  REFUNDED: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-500", label: "Refunded" },
  REJECTED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Rejected" },
  FAILED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Failed" },
};

export const WEBHOOK_STATUS_STYLE: Record<string, BadgeStyle> = {
  NONE: { bg: "bg-ink-900/5", text: "text-ink-900/35", dot: "bg-ink-900/25", label: "None" },
  RECEIVED: { bg: "bg-sky-50", text: "text-sky-600", dot: "bg-sky-500", label: "Received" },
  PROCESSED: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Processed" },
  SYNCED: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Synced" },
  FAILED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Failed" },
  SIGNATURE_INVALID: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-600", label: "Bad Signature" },
  IGNORED: { bg: "bg-ink-900/5", text: "text-ink-900/40", dot: "bg-ink-900/30", label: "Ignored" },
};

export const MODE_LABEL: Record<string, string> = {
  UPI: "UPI",
  CARD: "Card",
  NETBANKING: "Net Banking",
  WALLET: "Wallet",
  EMI: "EMI",
  CASH: "Cash",
  UNKNOWN: "—",
};

export function badge(map: Record<string, BadgeStyle>, key?: string | null): BadgeStyle {
  return (key && map[key]) || { bg: "bg-ink-900/5", text: "text-ink-900/50", dot: "bg-ink-900/40", label: key ? key.replace(/_/g, " ") : "—" };
}
