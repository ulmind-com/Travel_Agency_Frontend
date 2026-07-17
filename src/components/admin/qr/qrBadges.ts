export interface BadgeStyle {
  label: string;
  bg: string;
  text: string;
  dot?: string;
}

export const QR_VERIFICATION_STYLE: Record<string, BadgeStyle> = {
  PENDING: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  VERIFIED: { label: "Verified", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  EXPIRED: { label: "Expired", bg: "bg-ink-900/5", text: "text-ink-900/50", dot: "bg-ink-900/30" },
  REVOKED: { label: "Revoked", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  BLOCKED: { label: "Blocked", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-600" },
};

export const SCAN_RESULT_STYLE: Record<string, BadgeStyle> = {
  VERIFIED: { label: "Verified", bg: "bg-emerald-50", text: "text-emerald-700" },
  EXPIRED: { label: "Expired", bg: "bg-ink-900/5", text: "text-ink-900/50" },
  REVOKED: { label: "Revoked", bg: "bg-rose-50", text: "text-rose-700" },
  INVALID: { label: "Wrong QR", bg: "bg-orange-50", text: "text-orange-700" },
  TAMPERED: { label: "Tampered", bg: "bg-red-100", text: "text-red-800" },
  DUPLICATE: { label: "Already Used", bg: "bg-purple-50", text: "text-purple-700" },
  UNAUTHORIZED: { label: "Unauthorized", bg: "bg-amber-50", text: "text-amber-700" },
  BLOCKED: { label: "Blocked", bg: "bg-red-100", text: "text-red-800" },
};

export const ACTIVITY_TYPE_STYLE: Record<string, { ring: string; dot: string; text: string }> = {
  INFO: { ring: "ring-sky-200", dot: "bg-sky-500", text: "text-sky-700" },
  SUCCESS: { ring: "ring-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700" },
  WARNING: { ring: "ring-amber-200", dot: "bg-amber-500", text: "text-amber-700" },
  CRITICAL: { ring: "ring-rose-200", dot: "bg-rose-500", text: "text-rose-700" },
};

export const PRIORITY_STYLE: Record<string, BadgeStyle> = {
  LOW: { label: "Low", bg: "bg-ink-900/5", text: "text-ink-900/50" },
  MEDIUM: { label: "Medium", bg: "bg-sky-50", text: "text-sky-700" },
  HIGH: { label: "High", bg: "bg-amber-50", text: "text-amber-700" },
  CRITICAL: { label: "Critical", bg: "bg-rose-50", text: "text-rose-700" },
};

export const CATEGORY_STYLE: Record<string, BadgeStyle> = {
  BOOKINGS: { label: "Bookings", bg: "bg-indigo-50", text: "text-indigo-700" },
  PAYMENTS: { label: "Payments", bg: "bg-emerald-50", text: "text-emerald-700" },
  USERS: { label: "Users", bg: "bg-sky-50", text: "text-sky-700" },
  QR: { label: "QR", bg: "bg-cyan-50", text: "text-cyan-700" },
  INVOICES: { label: "Invoices", bg: "bg-teal-50", text: "text-teal-700" },
  SUPPORT: { label: "Support", bg: "bg-orange-50", text: "text-orange-700" },
  SECURITY: { label: "Security", bg: "bg-rose-50", text: "text-rose-700" },
  SYSTEM: { label: "System", bg: "bg-ink-900/5", text: "text-ink-900/60" },
  MARKETING: { label: "Marketing", bg: "bg-purple-50", text: "text-purple-700" },
  TRAVEL: { label: "Travel", bg: "bg-[color:var(--gold)]/10", text: "text-[color:var(--gold)]" },
};

export function badgeOf(map: Record<string, BadgeStyle>, key?: string | null): BadgeStyle {
  return map[key ?? ""] ?? { label: key ?? "—", bg: "bg-ink-900/5", text: "text-ink-900/50" };
}

/** "2 minutes ago" style relative time. */
export function relativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z").getTime();
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(then).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Countdown until expiry, e.g. "3d 4h left" — or "Expired". */
export function expiryCountdown(iso?: string | null): { label: string; expired: boolean } {
  if (!iso) return { label: "No expiry", expired: false };
  const end = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z").getTime();
  const diff = end - Date.now();
  if (diff <= 0) return { label: "Expired", expired: true };
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (d > 0) return { label: `${d}d ${h}h left`, expired: false };
  if (h > 0) return { label: `${h}h ${m}m left`, expired: false };
  return { label: `${m}m left`, expired: false };
}
