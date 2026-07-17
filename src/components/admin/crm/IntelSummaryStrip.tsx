import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { HeartPulse, Crown, ShieldAlert, ChevronRight } from "lucide-react";

import { crmDetailQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { HEALTH_STYLE, TIER_STYLE, FRAUD_STYLE, inr } from "./crmBadges";
import { IntelDetailDrawer, ScoreRing, TrendIcon } from "./IntelDetailDrawer";

/**
 * Compact Customer Intelligence strip for the admin user profile —
 * live health / loyalty / fraud pulled from the CRM engine; opens the
 * full breakdown drawer.
 */
export function IntelSummaryStrip({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery(crmDetailQuery(userId));
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-3xl bg-ink-900/5" />;
  }
  if (!data) return null;

  const hs = HEALTH_STYLE[data.health.category];
  const ts = TIER_STYLE[data.loyalty.tier];
  const fs = FRAUD_STYLE[data.fraud.level];

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => setOpen(true)}
        className="group flex w-full flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-ink-900/[0.08] bg-white/70 px-5 py-4 text-left shadow-sm backdrop-blur transition-colors hover:bg-white"
      >
        <span className="flex items-center gap-3">
          <ScoreRing score={data.health.score} size={52} />
          <span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-ink-900/40">
              <HeartPulse className="size-3 text-rose-400" /> Health <TrendIcon trend={data.health.trend} />
            </span>
            <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", hs.bg, hs.text)}>
              {hs.label}
            </span>
          </span>
        </span>

        <span className="h-8 w-px bg-ink-900/[0.07]" />

        <span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-ink-900/40">
            <Crown className="size-3 text-[color:var(--gold)]" /> Loyalty
          </span>
          <span className="mt-1 flex items-center gap-2">
            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", ts.bg, ts.text)}>
              {data.loyalty.tier}
            </span>
            <span className="text-[11px] text-ink-900/55">
              {data.loyalty.points.available.toLocaleString()} pts · {inr(data.loyalty.lifetime_spending)}
            </span>
          </span>
        </span>

        <span className="h-8 w-px bg-ink-900/[0.07]" />

        <span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-ink-900/40">
            <ShieldAlert className="size-3 text-orange-400" /> Fraud Risk
          </span>
          <span className="mt-1 flex items-center gap-2">
            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", fs.bg, fs.text)}>
              {fs.label} · {data.fraud.score}
            </span>
            {data.fraud.signals.length > 0 && (
              <span className="text-[11px] text-ink-900/45">{data.fraud.signals.length} signal(s)</span>
            )}
          </span>
        </span>

        <ChevronRight className="ml-auto size-4 text-ink-900/25 transition-transform group-hover:translate-x-0.5" />
      </motion.button>

      {open && <IntelDetailDrawer userId={userId} onClose={() => setOpen(false)} />}
    </>
  );
}
