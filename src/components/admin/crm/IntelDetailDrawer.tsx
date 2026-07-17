import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, HeartPulse, Crown, ShieldAlert, TrendingUp, TrendingDown, Minus,
  RotateCcw, Coins, ExternalLink, Loader2, ScrollText,
} from "lucide-react";
import { toast } from "sonner";

import { crmDetailQuery } from "@/lib/queries";
import { crmService } from "@/services/crm.service";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HEALTH_STYLE, TIER_STYLE, FRAUD_STYLE, scoreColor, inr } from "./crmBadges";
import type { FraudLevel, LoyaltyTier } from "@/types/admin.crm";

const COMPONENT_LABELS: Record<string, string> = {
  payment_success: "Payment success", cancellations: "Cancellations", refunds: "Refunds",
  booking_volume: "Booking volume", spending: "Spending", recency: "Activity recency",
  reviews: "Reviews", account_age: "Account age", trend: "Engagement trend",
};
const COMPONENT_MAX: Record<string, number> = {
  payment_success: 20, cancellations: 15, refunds: 10, booking_volume: 15,
  spending: 10, recency: 15, reviews: 5, account_age: 5, trend: 5,
};

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        className="text-ink-900/[0.07]" strokeWidth={5} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={scoreColor(score)} strokeWidth={5}
        strokeLinecap="round" strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - score / 100) }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        className="rotate-90 fill-current font-sans text-sm font-bold text-ink-900"
        style={{ transformOrigin: "center" }}>
        {score}
      </text>
    </svg>
  );
}

export function TrendIcon({ trend }: { trend: "UP" | "DOWN" | "FLAT" }) {
  if (trend === "UP") return <TrendingUp className="size-3.5 text-emerald-500" />;
  if (trend === "DOWN") return <TrendingDown className="size-3.5 text-rose-500" />;
  return <Minus className="size-3.5 text-ink-900/30" />;
}

export function IntelDetailDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ ...crmDetailQuery(userId ?? ""), enabled: !!userId });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "crm"] });
  const onError = (e: unknown) => toast.error(apiErrorMessage(e));

  const fraudM = useMutation({
    mutationFn: (v: { level: string | null; reason: string }) =>
      crmService.overrideFraud(userId!, v.level, v.reason),
    onSuccess: () => { toast.success("Fraud status updated"); invalidate(); }, onError,
  });
  const tierM = useMutation({
    mutationFn: (v: { tier: string | null; reason: string }) =>
      crmService.overrideTier(userId!, v.tier, v.reason),
    onSuccess: () => { toast.success("Loyalty tier updated"); invalidate(); }, onError,
  });
  const redeemM = useMutation({
    mutationFn: (v: { points: number; reason: string }) =>
      crmService.redeemPoints(userId!, v.points, v.reason),
    onSuccess: (r) => { toast.success(`${r.redeemed} points redeemed`); invalidate(); }, onError,
  });
  const resetM = useMutation({
    mutationFn: () => crmService.resetHealth(userId!),
    onSuccess: () => { toast.success("Overrides cleared — recomputed from raw data"); invalidate(); }, onError,
  });

  const askOverrideFraud = () => {
    const level = prompt("Fraud level (LOW / MEDIUM / HIGH / CRITICAL) — empty to clear:")?.trim().toUpperCase() || null;
    if (level && !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(level)) return toast.error("Invalid level");
    const reason = prompt("Reason (audited):");
    if (reason) fraudM.mutate({ level, reason });
  };
  const askOverrideTier = () => {
    const tier = prompt("Tier (REGULAR / SILVER / GOLD / PLATINUM / DIAMOND) — empty to clear:")?.trim().toUpperCase() || null;
    if (tier && !["REGULAR", "SILVER", "GOLD", "PLATINUM", "DIAMOND"].includes(tier)) return toast.error("Invalid tier");
    const reason = prompt("Reason (audited):");
    if (reason) tierM.mutate({ tier, reason });
  };
  const askRedeem = () => {
    const points = Number(prompt(`Points to redeem (available: ${data?.loyalty.points.available ?? 0}):`));
    if (!points || points <= 0) return;
    const reason = prompt("Reason (audited):");
    if (reason) redeemM.mutate({ points, reason });
  };

  const h = data?.health, l = data?.loyalty, f = data?.fraud;

  return (
    <AnimatePresence>
      {userId && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col overflow-hidden bg-cream-50 shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent" />
            {isLoading || !data ? (
              <div className="grid flex-1 place-items-center"><Loader2 className="size-6 animate-spin text-ink-900/30" /></div>
            ) : (
              <>
                {/* Header */}
                <div className="border-b border-ink-900/10 px-6 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {data.user.profile_image?.url ? (
                        <img src={data.user.profile_image.url} alt="" className="size-12 rounded-full object-cover ring-2 ring-[color:var(--gold)]/30" />
                      ) : (
                        <span className="grid size-12 place-items-center rounded-full bg-ink-900/5 font-serif text-lg text-ink-900/50">
                          {data.user.name?.charAt(0)}
                        </span>
                      )}
                      <div>
                        <h3 className="font-serif text-xl text-ink-900">{data.user.name}</h3>
                        <p className="text-xs text-ink-900/50">{data.user.email}</p>
                        <p className="mt-0.5 text-[10px] text-ink-900/35">{data.user.customer_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link to="/account/admin/users/$id" params={{ id: data.user._id }}
                        onClick={onClose}
                        className="grid size-8 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/55 hover:text-ink-900"
                        title="Open full profile">
                        <ExternalLink className="size-3.5" />
                      </Link>
                      <button onClick={onClose}
                        className="grid size-8 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/55 hover:text-ink-900">
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5" data-lenis-prevent="true">
                  {/* HEALTH */}
                  <section className="rounded-3xl border border-ink-900/[0.08] bg-white/80 p-4">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/40">
                        <HeartPulse className="size-3.5 text-rose-400" /> Health Score
                      </p>
                      <span className="flex items-center gap-1.5">
                        <TrendIcon trend={h!.trend} />
                        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          HEALTH_STYLE[h!.category].bg, HEALTH_STYLE[h!.category].text)}>
                          {HEALTH_STYLE[h!.category].label}
                        </span>
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <ScoreRing score={h!.score} size={72} />
                      <ul className="min-w-0 flex-1 space-y-1">
                        {h!.reasons.slice(0, 3).map((r) => (
                          <li key={r} className="text-[11.5px] leading-snug text-ink-900/60">• {r}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      {Object.entries(h!.components).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="w-32 shrink-0 text-[10px] text-ink-900/45">{COMPONENT_LABELS[k] ?? k}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-900/[0.06]">
                            <motion.div className="h-full rounded-full bg-[color:var(--gold)]"
                              initial={{ width: 0 }}
                              animate={{ width: `${(v / (COMPONENT_MAX[k] ?? 20)) * 100}%` }}
                              transition={{ duration: 0.7 }} />
                          </div>
                          <span className="w-10 shrink-0 text-right text-[10px] font-semibold text-ink-900/60">
                            {v}/{COMPONENT_MAX[k] ?? 20}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* LOYALTY */}
                  <section className="rounded-3xl border border-ink-900/[0.08] bg-white/80 p-4">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/40">
                        <Crown className="size-3.5 text-[color:var(--gold)]" /> Loyalty
                      </p>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        TIER_STYLE[l!.tier as LoyaltyTier]?.bg, TIER_STYLE[l!.tier as LoyaltyTier]?.text)}>
                        {l!.tier}{l!.tier_overridden && " · pinned"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[["Available", l!.points.available], ["Earned", l!.points.earned],
                        ["Redeemed", l!.points.redeemed], ["Expired", l!.points.expired]].map(([k, v]) => (
                        <div key={k} className="rounded-2xl bg-cream-50 p-2.5 text-center">
                          <p className="font-serif text-lg text-ink-900">{(v as number).toLocaleString()}</p>
                          <p className="text-[9px] uppercase tracking-widest text-ink-900/40">{k} pts</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <div className="flex items-baseline justify-between text-[11px] text-ink-900/55">
                        <span>Lifetime spending <strong className="text-ink-900">{inr(l!.lifetime_spending)}</strong></span>
                        {l!.next_tier
                          ? <span>{inr(l!.next_tier_amount_needed)} to {l!.next_tier}</span>
                          : <span>Top tier reached</span>}
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-900/[0.06]">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-[color:var(--gold)]/60 to-[color:var(--gold)]"
                          initial={{ width: 0 }} animate={{ width: `${l!.next_tier_progress}%` }}
                          transition={{ duration: 0.8 }} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink-900/40">
                        {l!.tier_since && <span>Tier since {formatDateTime(l!.tier_since).split(",")[0]}</span>}
                        {l!.points_expiry && <span>Points valid until {formatDateTime(l!.points_expiry).split(",")[0]}</span>}
                        <span>Coupons used {l!.coupons_used}</span>
                        {l!.referral_points > 0 && <span>Referral pts {l!.referral_points}</span>}
                      </div>
                    </div>
                    {(data.ledger?.length ?? 0) > 0 && (
                      <div className="mt-3 border-t border-ink-900/[0.06] pt-2.5">
                        <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-ink-900/35">
                          <ScrollText className="size-3" /> Ledger
                        </p>
                        {data.ledger!.slice(0, 4).map((e) => (
                          <div key={e._id} className="flex items-baseline justify-between py-0.5 text-[11px]">
                            <span className="text-ink-900/60">{e.entry_type} · {e.reason}</span>
                            <span className={cn("font-semibold", e.entry_type === "GRANT" || e.entry_type === "ADJUST" ? "text-emerald-600" : "text-rose-500")}>
                              {e.entry_type === "GRANT" || e.entry_type === "ADJUST" ? "+" : "−"}{e.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* FRAUD */}
                  <section className={cn("rounded-3xl border p-4",
                    f!.level === "CRITICAL" || f!.level === "HIGH"
                      ? "border-rose-200 bg-rose-50/40" : "border-ink-900/[0.08] bg-white/80")}>
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/40">
                        <ShieldAlert className="size-3.5 text-orange-400" /> Fraud Risk
                      </p>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        FRAUD_STYLE[f!.level].bg, FRAUD_STYLE[f!.level].text)}>
                        {f!.level} · {f!.score}{f!.overridden && " · pinned"}
                      </span>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      {f!.signals.length === 0 ? (
                        <p className="text-[11.5px] text-ink-900/50">No fraud signals detected.</p>
                      ) : f!.signals.map((s) => (
                        <div key={s.code} className="flex items-start gap-2 text-[11.5px]">
                          <span className="mt-0.5 rounded bg-ink-900/5 px-1 py-px text-[8px] font-bold text-ink-900/50">+{s.weight}</span>
                          <span className="text-ink-900/65">{s.detail}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-[11px] text-ink-900/60">
                      <strong className="text-ink-900/80">Recommended:</strong> {f!.recommended_action}
                    </p>
                    {f!.override?.reason && (
                      <p className="mt-1.5 text-[10px] italic text-ink-900/40">Override: {f!.override.reason}</p>
                    )}
                  </section>

                  {/* FACTS */}
                  <section className="grid grid-cols-3 gap-2 pb-2 sm:grid-cols-4">
                    {[["Bookings", data.facts.bookings], ["Trips done", data.facts.completed_trips],
                      ["Cancelled", data.facts.cancelled], ["Payments", data.facts.payments],
                      ["Failed pays", data.facts.failed_payments], ["Refunds", data.facts.refunds],
                      ["Reviews", data.facts.reviews], ["Devices", data.facts.devices]].map(([k, v]) => (
                      <div key={k} className="rounded-2xl border border-ink-900/[0.06] bg-white/70 p-2 text-center">
                        <p className="font-serif text-base text-ink-900">{v as number}</p>
                        <p className="text-[8.5px] uppercase tracking-widest text-ink-900/40">{k}</p>
                      </div>
                    ))}
                  </section>
                </div>

                {/* Super-admin actions */}
                {isSuperAdmin && (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-ink-900/10 px-6 py-3">
                    <ActionBtn onClick={askOverrideFraud} disabled={fraudM.isPending}>
                      <ShieldAlert className="size-3" /> Override fraud
                    </ActionBtn>
                    <ActionBtn onClick={askOverrideTier} disabled={tierM.isPending}>
                      <Crown className="size-3" /> Set tier
                    </ActionBtn>
                    <ActionBtn onClick={askRedeem} disabled={redeemM.isPending}>
                      <Coins className="size-3" /> Redeem points
                    </ActionBtn>
                    <ActionBtn onClick={() => resetM.mutate()} disabled={resetM.isPending} danger>
                      <RotateCcw className="size-3" /> Reset
                    </ActionBtn>
                  </div>
                )}
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ActionBtn({ children, onClick, disabled, danger }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-40",
        danger ? "border-rose-200 text-rose-600 hover:bg-rose-50"
               : "border-ink-900/10 bg-white text-ink-900/65 hover:text-ink-900")}>
      {children}
    </button>
  );
}
