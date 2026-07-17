import type { FraudLevel, HealthCategory, LoyaltyTier } from "@/types/admin.crm";

export interface BadgeStyle { label: string; bg: string; text: string; dot?: string }

export const HEALTH_STYLE: Record<HealthCategory, BadgeStyle> = {
  VIP: { label: "VIP", bg: "bg-[color:var(--gold)]/12", text: "text-[color:var(--gold)]", dot: "bg-[color:var(--gold)]" },
  PREMIUM: { label: "Premium", bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  REGULAR: { label: "Regular", bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  INACTIVE: { label: "Inactive", bg: "bg-ink-900/5", text: "text-ink-900/50", dot: "bg-ink-900/30" },
  RISK: { label: "Risk", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  FRAUD_SUSPECTED: { label: "Fraud Suspected", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

export const TIER_STYLE: Record<LoyaltyTier, BadgeStyle> = {
  REGULAR: { label: "Regular", bg: "bg-ink-900/5", text: "text-ink-900/55" },
  SILVER: { label: "Silver", bg: "bg-slate-100", text: "text-slate-600" },
  GOLD: { label: "Gold", bg: "bg-amber-50", text: "text-amber-700" },
  PLATINUM: { label: "Platinum", bg: "bg-indigo-50", text: "text-indigo-700" },
  DIAMOND: { label: "Diamond", bg: "bg-cyan-50", text: "text-cyan-700" },
};

export const FRAUD_STYLE: Record<FraudLevel, BadgeStyle> = {
  LOW: { label: "Low", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  MEDIUM: { label: "Medium", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  HIGH: { label: "High", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  CRITICAL: { label: "Critical", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

/** Score → ring/track colour for the health gauge. */
export function scoreColor(score: number): string {
  if (score >= 80) return "#10b981";       // emerald
  if (score >= 60) return "#8b5cf6";       // violet
  if (score >= 40) return "#f59e0b";       // amber
  return "#f43f5e";                        // rose
}

export function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
