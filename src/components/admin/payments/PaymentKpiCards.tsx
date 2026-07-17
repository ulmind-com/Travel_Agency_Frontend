import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import {
  Wallet, CalendarDays, CheckCircle2, Clock, XCircle, RotateCcw, BadgeCheck,
  TrendingUp, Landmark, PiggyBank, Percent, Undo2, Webhook, IndianRupee,
  CalendarClock, Banknote,
} from "lucide-react";
import type { PaymentDashboard } from "@/types/admin.payments";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tone = "ink" | "indigo" | "blue" | "red" | "amber" | "emerald" | "purple" | "gold" | "sky" | "rose";

const TONE: Record<Tone, string> = {
  ink: "text-ink-900 bg-ink-900/5",
  indigo: "text-indigo-600 bg-indigo-50",
  blue: "text-blue-600 bg-blue-50",
  red: "text-red-600 bg-red-50",
  amber: "text-amber-600 bg-amber-50",
  emerald: "text-emerald-600 bg-emerald-50",
  purple: "text-purple-600 bg-purple-50",
  sky: "text-sky-600 bg-sky-50",
  rose: "text-rose-600 bg-rose-50",
  gold: "text-[color:var(--gold)] bg-[color:var(--gold)]/10",
};

function CountUp({ to, format }: { to: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(to);
  const prev = useRef<number | null>(null);
  useEffect(() => {
    const from = prev.current ?? 0;
    prev.current = to;
    if (from === to) { setDisplay(to); return; }
    const controls = animate(from, to, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [to]);
  return <>{format ? format(display) : Math.round(display).toLocaleString("en-IN")}</>;
}

export function PaymentKpiCards({ d }: { d: PaymentDashboard }) {
  const money = (n: number) => formatCurrency(Math.round(n));
  const pct = (n: number) => `${n.toFixed(1)}%`;

  const cards: { label: string; num: number; icon: any; tone: Tone; fmt?: (n: number) => string; sub?: string }[] = [
    { label: "Total Payments", num: d.total_payments, icon: Wallet, tone: "ink" },
    { label: "Today's Payments", num: d.todays_payments, icon: CalendarDays, tone: "indigo" },
    { label: "Successful", num: d.successful_payments, icon: CheckCircle2, tone: "emerald" },
    { label: "Pending", num: d.pending_payments, icon: Clock, tone: "amber" },
    { label: "Failed", num: d.failed_payments, icon: XCircle, tone: "red" },
    { label: "Refund Requests", num: d.refund_requests, icon: RotateCcw, tone: "amber" },
    { label: "Completed Refunds", num: d.completed_refunds, icon: Undo2, tone: "purple" },
    { label: "Refunded Amount", num: d.refunded_amount, icon: IndianRupee, tone: "purple", fmt: money },
    { label: "Today's Revenue", num: d.todays_revenue, icon: TrendingUp, tone: "emerald", fmt: money },
    { label: "Monthly Revenue", num: d.monthly_revenue, icon: CalendarClock, tone: "gold", fmt: money },
    { label: "Lifetime Revenue", num: d.lifetime_revenue, icon: PiggyBank, tone: "gold", fmt: money },
    { label: "Avg. Transaction", num: d.average_transaction_value, icon: Banknote, tone: "sky", fmt: money },
    {
      label: "Settlement Pending", num: d.settlement_pending_amount, icon: Landmark, tone: "amber", fmt: money,
      sub: `${d.settlement_pending_count} payment${d.settlement_pending_count === 1 ? "" : "s"}`,
    },
    {
      label: "Settlement Completed", num: d.settlement_completed_amount, icon: Landmark, tone: "emerald", fmt: money,
      sub: `${d.settlement_completed_count} payment${d.settlement_completed_count === 1 ? "" : "s"}`,
    },
    { label: "Success Rate", num: d.payment_success_rate, icon: BadgeCheck, tone: "emerald", fmt: pct },
    { label: "Refund Rate", num: d.refund_rate, icon: Percent, tone: "purple", fmt: pct },
    { label: "Webhook Failures", num: d.webhook_failures, icon: Webhook, tone: d.webhook_failures ? "rose" : "ink" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const tone = TONE[c.tone] ?? TONE.ink;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            className="group relative overflow-hidden rounded-2xl border border-ink-900/[0.07] bg-white/70 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-lg hover:shadow-ink-900/[0.06]"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-[color:var(--gold)]/[0.07] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className={cn("mb-3 flex size-8 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", tone)}>
              <Icon className="size-4" />
            </div>
            <p className="text-lg font-semibold leading-tight text-ink-900 tabular-nums">
              <CountUp to={c.num ?? 0} format={c.fmt} />
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-ink-900/40">{c.label}</p>
            {c.sub && <p className="text-[10px] text-ink-900/35">{c.sub}</p>}
          </motion.div>
        );
      })}
    </div>
  );
}
