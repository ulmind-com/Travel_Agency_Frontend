import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import {
  QrCode, ScanLine, CheckCircle2, XCircle, ShieldAlert, Download,
  BadgeCheck, Timer, Ban, ShieldX,
} from "lucide-react";
import type { QRSummary } from "@/types/admin.realtime";
import { cn } from "@/lib/utils";

type Tone = "ink" | "emerald" | "amber" | "red" | "rose" | "purple" | "sky" | "gold";

const TONE: Record<Tone, string> = {
  ink: "text-ink-900 bg-ink-900/5",
  emerald: "text-emerald-600 bg-emerald-50",
  amber: "text-amber-600 bg-amber-50",
  red: "text-red-600 bg-red-50",
  rose: "text-rose-600 bg-rose-50",
  purple: "text-purple-600 bg-purple-50",
  sky: "text-sky-600 bg-sky-50",
  gold: "text-[color:var(--gold)] bg-[color:var(--gold)]/10",
};

function CountUp({ to, format }: { to: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(to);
  const prev = useRef<number | null>(null);
  useEffect(() => {
    const from = prev.current ?? 0;
    prev.current = to;
    if (from === to) { setDisplay(to); return; }
    const controls = animate(from, to, { duration: 0.8, ease: [0.22, 1, 0.36, 1], onUpdate: setDisplay });
    return () => controls.stop();
  }, [to]);
  return <>{format ? format(display) : Math.round(display).toLocaleString("en-IN")}</>;
}

/** Tiny sparkline of the last 14 days of scans — pure SVG, no chart lib. */
function Sparkline({ data }: { data: { scans: number; verified: number }[] }) {
  if (!data.length) return null;
  const w = 96, h = 28;
  const max = Math.max(...data.map((d) => d.scans), 1);
  const pts = data.map((d, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - (d.scans / max) * (h - 4) - 2}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-24" preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" className="text-[color:var(--gold)]" />
    </svg>
  );
}

export function QrKpiCards({ s }: { s: QRSummary }) {
  const pct = (n: number) => `${n.toFixed(1)}%`;
  const cards: { label: string; num: number; icon: any; tone: Tone; fmt?: (n: number) => string; sub?: string; spark?: boolean }[] = [
    { label: "Total QR Codes", num: s.total_qr, icon: QrCode, tone: "ink" },
    { label: "Active", num: s.active, icon: Timer, tone: "emerald" },
    { label: "Expired", num: s.expired, icon: XCircle, tone: "amber" },
    { label: "Revoked / Blocked", num: s.revoked + s.blocked, icon: Ban, tone: "rose" },
    { label: "Total Scans", num: s.total_scans, icon: ScanLine, tone: "sky", spark: true },
    { label: "Successful Scans", num: s.successful_scans, icon: CheckCircle2, tone: "emerald" },
    { label: "Failed Scans", num: s.failed_scans, icon: ShieldX, tone: "red" },
    { label: "Invalid Attempts", num: s.invalid_attempts, icon: ShieldAlert, tone: s.invalid_attempts ? "rose" : "ink" },
    { label: "Downloads", num: s.downloads, icon: Download, tone: "purple" },
    { label: "Verification Rate", num: s.verification_rate, icon: BadgeCheck, tone: "gold", fmt: pct },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-ink-900/[0.07] bg-white/80 p-4 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-900/40">{c.label}</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink-900">
                  <CountUp to={c.num} format={c.fmt} />
                </p>
                {c.sub && <p className="mt-0.5 text-[11px] text-ink-900/40">{c.sub}</p>}
              </div>
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-110", TONE[c.tone])}>
                <Icon className="size-4.5" />
              </span>
            </div>
            {c.spark && s.daily_scans.length > 1 && (
              <div className="mt-1"><Sparkline data={s.daily_scans} /></div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
