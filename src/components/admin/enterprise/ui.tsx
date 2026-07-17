/**
 * Shared enterprise-suite UI primitives — glass cards, stat tiles, drawers,
 * skeletons, empty states, pagination. Matches the Ulmind admin design
 * language (cream/ink palette, serif headings, gold accent).
 */
import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function inr(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

export function compact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function StatCard({ icon: Icon, label, value, sub, tone }: {
  icon: LucideIcon; label: string; value: string; sub?: string;
  tone?: "alert" | "ok" | "warn";
}) {
  return (
    <div className={cn(
      "rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur",
      tone === "alert" ? "border-rose-200/70" : tone === "warn" ? "border-amber-200/70"
        : tone === "ok" ? "border-emerald-200/70" : "border-ink-900/[0.08]",
    )}>
      <div className="flex items-center gap-2 text-ink-900/45">
        <Icon className={cn("size-3.5",
          tone === "alert" && "text-rose-500", tone === "warn" && "text-amber-500",
          tone === "ok" && "text-emerald-500")} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className={cn("mt-1.5 font-serif text-2xl text-ink-900",
        tone === "alert" && "text-rose-600")}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-ink-900/40">{sub}</p>}
    </div>
  );
}

export function GlassPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      "overflow-hidden rounded-3xl border border-ink-900/[0.08] bg-white/70 shadow-sm backdrop-blur",
      className,
    )}>
      {children}
    </div>
  );
}

export function SkeletonRows({ count = 6, height = "h-16" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("animate-pulse rounded-2xl bg-ink-900/5", height)} />
      ))}
    </div>
  );
}

export function EmptyState({ title, sub, icon: Icon = Inbox }: {
  title: string; sub?: string; icon?: LucideIcon;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <Icon className="mx-auto mb-3 size-9 text-ink-900/10" />
      <p className="font-serif text-lg text-ink-900/50">{title}</p>
      {sub && <p className="mt-1 text-xs text-ink-900/35">{sub}</p>}
    </div>
  );
}

export function Pagination({ page, pages, total, unit, onPage }: {
  page: number; pages: number; total: number; unit: string; onPage: (p: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-ink-900/[0.05] px-5 py-2.5 text-xs text-ink-900/45">
      <span>Page {page} of {pages} · {total} {unit}</span>
      <div className="flex gap-1.5">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)}
          className="rounded-lg border border-ink-900/10 px-3 py-1.5 disabled:opacity-30">Prev</button>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)}
          className="rounded-lg border border-ink-900/10 px-3 py-1.5 disabled:opacity-30">Next</button>
      </div>
    </div>
  );
}

export function PillTabs<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: string; icon?: LucideIcon; badge?: number }[];
  active: T; onChange: (t: T) => void;
}) {
  return (
    <div className="flex flex-wrap rounded-full border border-ink-900/10 bg-white/70 p-1 shadow-sm backdrop-blur">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors",
            active === t.id ? "bg-ink-900 text-cream-50" : "text-ink-900/55 hover:text-ink-900")}>
          {t.icon && <t.icon className="size-3.5" />} {t.label}
          {(t.badge ?? 0) > 0 && (
            <span className="ml-0.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Right-side glass drawer with backdrop — the enterprise detail surface. */
export function SideDrawer({ open, onClose, children, width = "max-w-2xl" }: {
  open: boolean; onClose: () => void; children: ReactNode; width?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            data-lenis-prevent="true"
            className={cn("fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-cream-50 shadow-2xl", width)}
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function DrawerHeader({ title, sub, onClose, children }: {
  title: ReactNode; sub?: ReactNode; onClose: () => void; children?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-900/[0.07] bg-white/70 px-6 py-4 backdrop-blur">
      <div className="min-w-0">
        <h3 className="truncate font-serif text-xl text-ink-900">{title}</h3>
        {sub && <div className="mt-0.5 text-[11.5px] text-ink-900/45">{sub}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {children}
        <button onClick={onClose}
          className="grid size-8 place-items-center rounded-full border border-ink-900/10 text-ink-900/50 hover:bg-ink-900/5">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
      className,
    )}>
      {children}
    </span>
  );
}

/** Section label used inside drawers */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-900/40">
      {children}
    </p>
  );
}

/** Backend timestamps are naive UTC — normalise before parsing locally. */
export function parseUtc(iso: string): number {
  return new Date(iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z").getTime();
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = parseUtc(iso);
  if (Number.isNaN(then)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(then).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = parseUtc(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function fmtBytes(n: number | null | undefined): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function fmtMins(mins: number | null | undefined): string {
  if (mins === null || mins === undefined) return "—";
  if (mins < 60) return `${Math.round(mins)}m`;
  if (mins < 1440) return `${(mins / 60).toFixed(1)}h`;
  return `${(mins / 1440).toFixed(1)}d`;
}
