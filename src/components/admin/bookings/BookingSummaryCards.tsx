import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import {
  CalendarCheck, Plane, CheckCircle2, XCircle, Clock, CreditCard,
  BadgeCheck, RotateCcw, Wallet, TrendingUp, CalendarClock, CalendarDays,
} from "lucide-react";
import type { BookingSummary } from "@/types/admin.bookings";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tone = "ink" | "indigo" | "blue" | "red" | "amber" | "emerald" | "purple" | "gold";

const TONE: Record<Tone, string> = {
  ink: "text-ink-900 bg-ink-900/5",
  indigo: "text-indigo-600 bg-indigo-50",
  blue: "text-blue-600 bg-blue-50",
  red: "text-red-600 bg-red-50",
  amber: "text-amber-600 bg-amber-50",
  emerald: "text-emerald-600 bg-emerald-50",
  purple: "text-purple-600 bg-purple-50",
  gold: "text-[color:var(--gold)] bg-[color:var(--gold)]/10",
};

/** Animated numeric counter — counts from 0 to `to` on first render. */
function CountUp({ to, format }: { to: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) { setDisplay(to); return; }
    done.current = true;
    const controls = animate(0, to, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [to]);
  return <>{format ? format(display) : Math.round(display).toLocaleString("en-IN")}</>;
}

export function BookingSummaryCards({ summary }: { summary: BookingSummary }) {
  const cards: { label: string; num?: number; text?: string; money?: boolean; icon: any; tone: Tone }[] = [
    { label: "Total Bookings", num: summary.total_bookings, icon: CalendarCheck, tone: "ink" },
    { label: "Upcoming Trips", num: summary.upcoming_trips, icon: Plane, tone: "indigo" },
    { label: "Completed Trips", num: summary.completed_trips, icon: CheckCircle2, tone: "blue" },
    { label: "Cancelled Trips", num: summary.cancelled_trips, icon: XCircle, tone: "red" },
    { label: "Pending Trips", num: summary.pending_trips, icon: Clock, tone: "amber" },
    { label: "Pending Payments", num: summary.pending_payments, icon: CreditCard, tone: "amber" },
    { label: "Successful Payments", num: summary.successful_payments, icon: BadgeCheck, tone: "emerald" },
    { label: "Refund Requests", num: summary.refund_requests, icon: RotateCcw, tone: "purple" },
    { label: "Lifetime Value", num: summary.lifetime_booking_value, money: true, icon: Wallet, tone: "gold" },
    { label: "Avg. Booking Value", num: summary.average_booking_value, money: true, icon: TrendingUp, tone: "emerald" },
    { label: "Last Booking", text: summary.last_booking_date ? formatDate(summary.last_booking_date) : "—", icon: CalendarDays, tone: "ink" },
    { label: "Next Travel", text: summary.next_travel_date ? formatDate(summary.next_travel_date) : "—", icon: CalendarClock, tone: "indigo" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.035, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            className="group relative overflow-hidden rounded-2xl border border-ink-900/[0.07] bg-white/70 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-lg hover:shadow-ink-900/[0.06]"
          >
            {/* soft radial glow on hover */}
            <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-[color:var(--gold)]/[0.07] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className={cn("mb-3 flex size-8 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", TONE[c.tone])}>
              <Icon className="size-4" />
            </div>
            <p className="text-xl font-semibold leading-tight text-ink-900 tabular-nums">
              {c.text ?? (c.money
                ? <CountUp to={c.num ?? 0} format={(n) => formatCurrency(Math.round(n))} />
                : <CountUp to={c.num ?? 0} />)}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-ink-900/40">{c.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
