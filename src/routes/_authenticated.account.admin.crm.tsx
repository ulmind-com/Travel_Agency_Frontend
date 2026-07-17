import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  HeartPulse, Crown, ShieldAlert, Users2, SlidersHorizontal, Search,
  Coins, Wallet, AlertTriangle, Inbox,
} from "lucide-react";

import { crmHealthQuery, crmLoyaltyQuery, crmFraudQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/components/admin/qr/qrBadges";
import { HEALTH_STYLE, TIER_STYLE, FRAUD_STYLE, inr } from "@/components/admin/crm/crmBadges";
import { IntelDetailDrawer, ScoreRing, TrendIcon } from "@/components/admin/crm/IntelDetailDrawer";
import { CrmFilterDrawer } from "@/components/admin/crm/CrmFilterDrawer";
import type { CrmListParams, IntelRow } from "@/types/admin.crm";

export const Route = createFileRoute("/_authenticated/account/admin/crm")({
  component: CrmPage,
});

type Tab = "health" | "loyalty" | "fraud";

const TABS: { id: Tab; label: string; icon: typeof HeartPulse }[] = [
  { id: "health", label: "Health Scores", icon: HeartPulse },
  { id: "loyalty", label: "Loyalty", icon: Crown },
  { id: "fraud", label: "Fraud Center", icon: ShieldAlert },
];

function CrmPage() {
  const [tab, setTab] = useState<Tab>("health");
  const [params, setParams] = useState<CrmListParams>({ sort: "score" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<string | null>(null);

  const effective = useMemo(() => ({
    ...params,
    search: search.trim() || undefined,
    page, page_size: 20,
    ...(tab === "fraud" ? { sort: "fraud" as const } : {}),
    ...(tab === "loyalty" && params.sort === "score" ? { sort: "spend" as const } : {}),
  }), [params, search, page, tab]);

  const listQuery = (tab === "health" ? crmHealthQuery(effective)
    : tab === "loyalty" ? crmLoyaltyQuery(effective)
    : crmFraudQuery(effective)) as ReturnType<typeof crmHealthQuery>;
  const { data, isLoading } = useQuery(listQuery);

  const activeFilterCount = ["category", "tier", "fraud_level", "country", "registration_source",
    "min_score", "max_score", "min_spend", "max_spend"]
    .filter((k) => params[k as keyof CrmListParams] !== undefined).length;

  const s = data?.summary;
  const items = data?.items ?? [];
  const fraudItems = tab === "fraud" ? items.filter((r) => r.fraud.score > 0 || r.fraud.overridden) : items;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ink-900">Customer Intelligence</h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Health, loyalty and fraud signals — computed live from real bookings, payments and activity.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Users2} label="Customers" value={s ? String(s.total_customers) : "—"} />
        <StatCard icon={HeartPulse} label="Avg Health" value={s ? `${s.avg_health}` : "—"}
          sub={s ? `${(s.categories.VIP ?? 0) + (s.categories.PREMIUM ?? 0)} premium+` : undefined} />
        <StatCard icon={Wallet} label="Lifetime Value" value={s ? inr(s.total_lifetime_spending) : "—"} />
        <StatCard icon={Coins} label="Points Liability" value={s ? s.total_points_available.toLocaleString() : "—"} />
        <StatCard icon={AlertTriangle} label="Fraud Alerts" value={s ? String(s.alerts) : "—"}
          tone={s && s.alerts > 0 ? "alert" : undefined} />
      </div>

      {/* Tabs + toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-ink-900/10 bg-white/70 p-1 shadow-sm backdrop-blur">
          {TABS.map((t) => (
            <button key={t.id}
              onClick={() => { setTab(t.id); setPage(1); }}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors",
                tab === t.id ? "bg-ink-900 text-cream-50" : "text-ink-900/55 hover:text-ink-900")}>
              <t.icon className="size-3.5" /> {t.label}
              {t.id === "fraud" && (s?.alerts ?? 0) > 0 && (
                <span className="ml-0.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {s!.alerts}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-900/35" />
          <input value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search customers…"
            className="w-52 rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40" />
        </div>
        <button onClick={() => setFiltersOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-3.5 py-2 text-[12px] font-medium text-ink-900/65 shadow-sm hover:text-ink-900">
          <SlidersHorizontal className="size-3.5" /> Filters
          {activeFilterCount > 0 && (
            <span className="grid min-w-4 place-items-center rounded-full bg-[color:var(--gold)] px-1 text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="overflow-hidden rounded-3xl border border-ink-900/[0.08] bg-white/70 shadow-sm backdrop-blur">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink-900/5" />)}
          </div>
        ) : fraudItems.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Inbox className="mx-auto mb-3 size-9 text-ink-900/10" />
            <p className="font-serif text-lg text-ink-900/50">
              {tab === "fraud" ? "No fraud signals right now" : "No customers match these filters"}
            </p>
            <p className="mt-1 text-xs text-ink-900/35">
              {tab === "fraud"
                ? "Signals appear automatically as real behaviour warrants it."
                : "Adjust or reset the filters to widen the view."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {fraudItems.map((r, i) => (
              <motion.button
                key={r.user._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => setDetailUser(r.user._id)}
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-cream-50/70"
              >
                {/* Identity */}
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  {r.user.profile_image?.url ? (
                    <img src={r.user.profile_image.url} alt="" className="size-10 shrink-0 rounded-full object-cover ring-1 ring-ink-900/10" />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-900/5 font-serif text-ink-900/50">
                      {r.user.name?.charAt(0)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-ink-900">{r.user.name}</span>
                    <span className="block truncate text-[11px] text-ink-900/45">{r.user.email}</span>
                  </span>
                </span>

                {tab === "health" && <HealthCells r={r} />}
                {tab === "loyalty" && <LoyaltyCells r={r} />}
                {tab === "fraud" && <FraudCells r={r} />}
              </motion.button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(data?.pages ?? 1) > 1 && (
          <div className="flex items-center justify-between border-t border-ink-900/[0.05] px-5 py-2.5 text-xs text-ink-900/45">
            <span>Page {data!.page} of {data!.pages} · {data!.total} customers</span>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="rounded-lg border border-ink-900/10 px-3 py-1.5 disabled:opacity-30">Prev</button>
              <button disabled={page >= (data?.pages ?? 1)} onClick={() => setPage(page + 1)}
                className="rounded-lg border border-ink-900/10 px-3 py-1.5 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>

      <CrmFilterDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)}
        params={params} onApply={(p) => { setParams(p); setPage(1); }} />
      <IntelDetailDrawer userId={detailUser} onClose={() => setDetailUser(null)} />
    </div>
  );
}

function HealthCells({ r }: { r: IntelRow }) {
  const hs = HEALTH_STYLE[r.health.category];
  const ts = TIER_STYLE[r.loyalty.tier];
  const fs = FRAUD_STYLE[r.fraud.level];
  return (
    <>
      <ScoreRing score={r.health.score} size={44} />
      <span className={cn("hidden rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:inline-flex", hs.bg, hs.text)}>
        {hs.label}
      </span>
      <span className="hidden md:inline-flex"><TrendIcon trend={r.health.trend} /></span>
      <span className={cn("hidden rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider lg:inline-flex", ts.bg, ts.text)}>
        {ts.label}
      </span>
      <span className="hidden w-24 text-right text-[12px] font-semibold text-ink-900/75 sm:block">
        {inr(r.loyalty.lifetime_spending)}
      </span>
      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", fs.bg, fs.text)}>
        {fs.label}
      </span>
    </>
  );
}

function LoyaltyCells({ r }: { r: IntelRow }) {
  const ts = TIER_STYLE[r.loyalty.tier];
  return (
    <>
      <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", ts.bg, ts.text)}>
        {r.loyalty.tier}{r.loyalty.tier_overridden && " ·📌"}
      </span>
      <span className="hidden w-24 text-right sm:block">
        <span className="block text-[13px] font-semibold text-ink-900">{r.loyalty.points.available.toLocaleString()}</span>
        <span className="block text-[9px] uppercase tracking-widest text-ink-900/35">points</span>
      </span>
      <span className="hidden w-24 text-right text-[12px] font-semibold text-ink-900/75 md:block">
        {inr(r.loyalty.lifetime_spending)}
      </span>
      <span className="hidden w-36 lg:block">
        <span className="mb-1 block text-[9px] text-ink-900/40">
          {r.loyalty.next_tier ? `${r.loyalty.next_tier_progress}% to ${r.loyalty.next_tier}` : "Top tier"}
        </span>
        <span className="block h-1.5 overflow-hidden rounded-full bg-ink-900/[0.07]">
          <motion.span className="block h-full rounded-full bg-gradient-to-r from-[color:var(--gold)]/60 to-[color:var(--gold)]"
            initial={{ width: 0 }} animate={{ width: `${r.loyalty.next_tier_progress}%` }}
            transition={{ duration: 0.7 }} />
        </span>
      </span>
    </>
  );
}

function FraudCells({ r }: { r: IntelRow }) {
  const fs = FRAUD_STYLE[r.fraud.level];
  return (
    <>
      <span className="hidden min-w-0 max-w-xs flex-1 flex-wrap gap-1 md:flex">
        {r.fraud.signals.slice(0, 3).map((sg) => (
          <span key={sg.code} className="truncate rounded-full bg-ink-900/5 px-2 py-0.5 text-[9px] font-medium text-ink-900/55">
            {sg.code.replace(/_/g, " ").toLowerCase()}
          </span>
        ))}
        {r.fraud.signals.length > 3 && (
          <span className="text-[9px] text-ink-900/35">+{r.fraud.signals.length - 3} more</span>
        )}
      </span>
      <span className="text-right">
        <span className="block text-[15px] font-bold" style={{ color: r.fraud.score >= 45 ? "#e11d48" : r.fraud.score >= 20 ? "#f59e0b" : "#10b981" }}>
          {r.fraud.score}
        </span>
        <span className="block text-[8.5px] uppercase tracking-widest text-ink-900/35">risk</span>
      </span>
      <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", fs.bg, fs.text)}>
        {fs.label}{r.fraud.overridden && " ·📌"}
      </span>
      <span className="hidden text-[10px] text-ink-900/40 xl:block">
        {r.facts.last_activity ? relativeTime(r.facts.last_activity) : "no activity"}
      </span>
    </>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Users2; label: string; value: string; sub?: string; tone?: "alert";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={cn("rounded-3xl border p-4 shadow-sm backdrop-blur",
        tone === "alert" ? "border-rose-200 bg-rose-50/60" : "border-ink-900/[0.08] bg-white/70")}
    >
      <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-ink-900/40">
        <Icon className={cn("size-3.5", tone === "alert" ? "text-rose-500" : "text-[color:var(--gold)]")} /> {label}
      </p>
      <p className={cn("mt-1.5 truncate font-serif text-2xl", tone === "alert" ? "text-rose-600" : "text-ink-900")}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-ink-900/40">{sub}</p>}
    </motion.div>
  );
}
