import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import {
  BarChart3, Eye, Heart, Loader2, MonitorSmartphone, Package as PackageIcon,
  Search, Star, TrendingDown, TrendingUp, Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { analyticsService } from "@/services/enterprise.service";
import type { PackageAnalyticsRow } from "@/types/admin.enterprise";
import {
  Badge, DrawerHeader, EmptyState, GlassPanel, SectionTitle, SideDrawer,
  SkeletonRows, StatCard, compact, inr,
} from "@/components/admin/enterprise/ui";

export const Route = createFileRoute("/_authenticated/account/admin/analytics")({
  component: PackageAnalyticsPage,
});

const WINDOWS = [
  { days: 30, label: "30d" }, { days: 90, label: "90d" },
  { days: 180, label: "6m" }, { days: 365, label: "1y" },
];

function PackageAnalyticsPage() {
  const [days, setDays] = useState(90);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof PackageAnalyticsRow>("revenue");
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "packages", days],
    queryFn: () => analyticsService.packages(days),
    refetchInterval: 120_000,
  });

  const items = useMemo(() => {
    let rows = data?.items ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) => r.title.toLowerCase().includes(q)
        || r.destinations.some((d) => d.toLowerCase().includes(q)));
    }
    return [...rows].sort((a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0));
  }, [data, search, sortKey]);

  const t = data?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ink-900">Package Analytics</h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Views, conversion, revenue and audience — computed live for every travel package.
          </p>
        </div>
        <div className="flex rounded-full border border-ink-900/10 bg-white/70 p-1 shadow-sm">
          {WINDOWS.map((w) => (
            <button key={w.days} onClick={() => setDays(w.days)}
              className={cn("rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                days === w.days ? "bg-ink-900 text-cream-50" : "text-ink-900/50 hover:text-ink-900")}>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Eye} label="Total Views" value={t ? compact(t.views) : "—"} />
        <StatCard icon={BarChart3} label="Bookings" value={t ? String(t.bookings) : "—"} />
        <StatCard icon={Wallet} label="Revenue" value={t ? inr(t.revenue) : "—"} />
        <StatCard icon={Heart} label="Wishlisted" value={t ? String(t.wishlists) : "—"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-900/35" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packages…"
            className="w-56 rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40" />
        </div>
        <select value={String(sortKey)} onChange={(e) => setSortKey(e.target.value as keyof PackageAnalyticsRow)}
          className="ml-auto rounded-full border border-ink-900/10 bg-white px-3 py-2 text-[12px] text-ink-900/65 outline-none">
          <option value="revenue">Sort · Revenue</option>
          <option value="views">Sort · Views</option>
          <option value="bookings">Sort · Bookings</option>
          <option value="conversion_rate">Sort · Conversion</option>
          <option value="wishlist_count">Sort · Wishlists</option>
          <option value="review_rating">Sort · Rating</option>
        </select>
      </div>

      <GlassPanel>
        {isLoading ? (
          <SkeletonRows count={5} height="h-20" />
        ) : items.length === 0 ? (
          <EmptyState icon={PackageIcon} title="No packages match"
            sub="Analytics accrue automatically as visitors browse packages." />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {items.map((p, i) => (
              <motion.button key={p.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => setDetailId(p.id)}
                className="grid w-full grid-cols-[auto_1fr] items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-cream-50/70 sm:grid-cols-[auto_minmax(0,1.4fr)_repeat(5,minmax(0,1fr))_auto]">
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" className="size-12 rounded-xl object-cover ring-1 ring-ink-900/10" />
                ) : (
                  <span className="grid size-12 place-items-center rounded-xl bg-ink-900/5">
                    <PackageIcon className="size-5 text-ink-900/30" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-semibold text-ink-900">{p.title}</span>
                    {!p.is_active && <Badge className="bg-stone-100 text-stone-500">Inactive</Badge>}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-ink-900/45">
                    {p.category} · {p.destinations.slice(0, 3).join(", ")}
                  </span>
                </span>
                <Cell label="Views" value={compact(p.views)} sub={`${compact(p.unique_visitors)} unique`} />
                <Cell label="Bookings" value={String(p.bookings)} sub={`${p.wishlist_count} ♥`} />
                <Cell label="Revenue" value={inr(p.revenue)} sub={p.avg_booking_value ? `${inr(p.avg_booking_value)} avg` : undefined} />
                <Cell label="Conversion" value={`${p.conversion_rate}%`}
                  sub={p.cancellation_rate > 0 ? `${p.cancellation_rate}% cancel` : undefined} />
                <Cell label="Rating"
                  value={p.review_rating > 0 ? `★ ${p.review_rating.toFixed(1)}` : "—"}
                  sub={p.review_count > 0 ? `${p.review_count} reviews` : undefined} />
                <span className="hidden text-ink-900/25 sm:block">›</span>
              </motion.button>
            ))}
          </div>
        )}
      </GlassPanel>

      <PackageDetailDrawer packageId={detailId} days={days} onClose={() => setDetailId(null)} />
    </div>
  );
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <span className="hidden flex-col sm:flex">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-900/35">{label}</span>
      <span className="text-[13px] font-semibold text-ink-900">{value}</span>
      {sub && <span className="text-[10px] text-ink-900/40">{sub}</span>}
    </span>
  );
}

// ─── Detail drawer ───────────────────────────────────────────────────────────
function PackageDetailDrawer({ packageId, days, onClose }: {
  packageId: string | null; days: number; onClose: () => void;
}) {
  const { data: d, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "package", packageId, days],
    queryFn: () => analyticsService.packageDetail(packageId!, days),
    enabled: !!packageId,
  });

  return (
    <SideDrawer open={!!packageId} onClose={onClose} width="max-w-3xl">
      {isLoading || !d ? (
        <div className="grid flex-1 place-items-center">
          <Loader2 className="size-6 animate-spin text-ink-900/30" />
        </div>
      ) : (
        <>
          <DrawerHeader onClose={onClose}
            title={d.package.title}
            sub={`${d.package.category} · ${d.package.destinations.join(", ")} · last ${d.window_days} days`} />

          <div data-lenis-prevent="true" className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <MiniKpi label="Views" value={compact(d.kpis.views)} />
              <MiniKpi label="Unique Visitors" value={compact(d.kpis.unique_visitors)} />
              <MiniKpi label="Wishlists" value={String(d.kpis.wishlist_count)} />
              <MiniKpi label="Bookings" value={String(d.kpis.bookings)} />
              <MiniKpi label="Revenue" value={inr(d.kpis.revenue)} />
              <MiniKpi label="Conversion" value={`${d.kpis.conversion_rate}%`} />
              <MiniKpi label="Avg Booking" value={inr(d.kpis.avg_booking_value)} />
              <MiniKpi label="Growth (30d)"
                value={`${d.kpis.revenue_growth_pct > 0 ? "+" : ""}${d.kpis.revenue_growth_pct}%`}
                icon={d.kpis.revenue_growth_pct >= 0 ? TrendingUp : TrendingDown}
                tone={d.kpis.revenue_growth_pct >= 0 ? "text-emerald-600" : "text-rose-600"} />
              <MiniKpi label="Cancellation" value={`${d.kpis.cancellation_rate}%`} />
              <MiniKpi label="Refund Rate" value={`${d.kpis.refund_rate}%`} />
              <MiniKpi label="Repeat Customers" value={String(d.kpis.repeat_customers)} />
              <MiniKpi label="Returning Customers" value={String(d.kpis.returning_customers)} />
            </div>

            {/* Views trend */}
            <div>
              <SectionTitle>Daily views</SectionTitle>
              {d.views_daily.length === 0 ? (
                <p className="text-[12px] text-ink-900/40">
                  No impressions recorded yet — views count as visitors open this package.
                </p>
              ) : (
                <div className="h-44 rounded-2xl border border-ink-900/[0.07] bg-white/70 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={d.views_daily}>
                      <defs>
                        <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#b08d57" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#b08d57" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Area type="monotone" dataKey="views" stroke="#b08d57" strokeWidth={2} fill="url(#pv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Revenue monthly */}
            {d.revenue_monthly.length > 0 && (
              <div>
                <SectionTitle>Monthly revenue</SectionTitle>
                <div className="h-44 rounded-2xl border border-ink-900/[0.07] bg-white/70 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.revenue_monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={44}
                        tickFormatter={(v: number) => compact(v)} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}
                        formatter={(v: number, name: string) => [name === "revenue" ? inr(v) : v, name]} />
                      <Bar dataKey="revenue" fill="#1c1917" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {d.popular_months.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-ink-900/45">
                    Most popular travel month: <b>{d.popular_months[0].month}</b>
                    {" "}({d.popular_months[0].bookings} bookings)
                  </p>
                )}
              </div>
            )}

            {/* Audience: sources / geo / devices */}
            <div className="grid gap-3 sm:grid-cols-2">
              <TopList title="Traffic sources" rows={d.traffic_sources.map((r) => [r.source, r.count])} />
              <TopList title="Booking sources" rows={d.booking_sources.map((r) => [r.source, r.count])} />
              <TopList title="Top countries" rows={d.top_countries.map((r) => [r.country, r.count])}
                empty="Geo appears for public (non-localhost) traffic" />
              <TopList title="Top cities" rows={d.top_cities.map((r) => [r.city, r.count])}
                empty="Geo appears for public (non-localhost) traffic" />
              <TopList title="Devices" rows={d.top_devices.map((r) => [r.device, r.count])}
                icon={MonitorSmartphone} />
              <TopList title="Browsers" rows={d.top_browsers.map((r) => [r.browser, r.count])} />
            </div>

            {/* Heatmap */}
            <div>
              <SectionTitle>View heatmap — weekday × hour (UTC)</SectionTitle>
              <Heatmap cells={d.heatmap} />
            </div>

            {/* Ratings */}
            {d.rating_distribution.length > 0 && (
              <div>
                <SectionTitle>Rating distribution</SectionTitle>
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((r) => {
                    const row = d.rating_distribution.find((x) => x.rating === r);
                    const max = Math.max(...d.rating_distribution.map((x) => x.count), 1);
                    return (
                      <div key={r} className="flex items-center gap-2">
                        <span className="flex w-10 items-center gap-0.5 text-[11px] text-ink-900/50">
                          {r} <Star className="size-2.5 fill-amber-400 text-amber-400" />
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-900/[0.05]">
                          <div className="h-full rounded-full bg-amber-400"
                            style={{ width: `${((row?.count ?? 0) / max) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right text-[11px] text-ink-900/45">{row?.count ?? 0}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </SideDrawer>
  );
}

function MiniKpi({ label, value, icon: Icon, tone }: {
  label: string; value: string; icon?: typeof TrendingUp; tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-900/[0.07] bg-white/70 px-3.5 py-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-900/35">{label}</p>
      <p className={cn("mt-0.5 flex items-center gap-1 text-[15px] font-semibold text-ink-900", tone)}>
        {Icon && <Icon className="size-3.5" />}{value}
      </p>
    </div>
  );
}

function TopList({ title, rows, empty, icon: Icon }: {
  title: string; rows: [string, number][]; empty?: string; icon?: typeof MonitorSmartphone;
}) {
  const max = Math.max(...rows.map(([, n]) => n), 1);
  return (
    <div className="rounded-2xl border border-ink-900/[0.07] bg-white/70 p-4">
      <SectionTitle>{title}</SectionTitle>
      {rows.length === 0 ? (
        <p className="text-[11.5px] text-ink-900/35">{empty ?? "No data yet"}</p>
      ) : (
        <div className="space-y-1.5">
          {rows.slice(0, 6).map(([label, n]) => (
            <div key={label} className="flex items-center gap-2">
              {Icon && <Icon className="size-3 text-ink-900/30" />}
              <span className="w-24 truncate text-[11.5px] text-ink-900/60">{label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-900/[0.05]">
                <div className="h-full rounded-full bg-ink-900/60" style={{ width: `${(n / max) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-[11px] font-semibold text-ink-900/70">{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DOWS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Mongo $dayOfWeek: 1=Sun … 7=Sat → our display order Mon-first
const DOW_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

function Heatmap({ cells }: { cells: { dow: string; hour: number; count: number }[] }) {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const c of cells) {
    const row = DOW_INDEX[c.dow];
    if (row !== undefined) grid[row][c.hour] = c.count;
  }
  const max = Math.max(...grid.flat(), 1);
  if (cells.length === 0) {
    return <p className="text-[12px] text-ink-900/40">The heatmap fills in as real visits accumulate.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-900/[0.07] bg-white/70 p-3">
      <div className="min-w-[560px]">
        {DOWS.map((d, r) => (
          <div key={d} className="flex items-center gap-1">
            <span className="w-8 shrink-0 text-[9px] font-semibold text-ink-900/40">{d}</span>
            {grid[r].map((v, h) => (
              <div key={h} title={`${d} ${h}:00 — ${v} views`}
                className="my-0.5 h-4 flex-1 rounded-[3px]"
                style={{
                  backgroundColor: v === 0 ? "rgba(28,25,23,0.04)"
                    : `rgba(176,141,87,${0.15 + (v / max) * 0.85})`,
                }} />
            ))}
          </div>
        ))}
        <div className="mt-0.5 flex gap-1 pl-9">
          {Array.from({ length: 24 }).map((_, h) => (
            <span key={h} className="flex-1 text-center text-[7.5px] text-ink-900/30">
              {h % 6 === 0 ? `${h}h` : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
