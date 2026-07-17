import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, ComposedChart, Area, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, PieChart, Pie, Cell as PieCell,
} from "recharts";
import {
  Banknote, CircleDollarSign, Coins, CreditCard, Landmark, PiggyBank,
  ReceiptText, TrendingDown, TrendingUp, Undo2, UserRound, Wallet2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { revenueService } from "@/services/enterprise.service";
import type { RevenueDimension } from "@/types/admin.enterprise";
import {
  EmptyState, GlassPanel, SectionTitle, StatCard, compact, inr,
} from "@/components/admin/enterprise/ui";

export const Route = createFileRoute("/_authenticated/account/admin/revenue")({
  component: RevenuePage,
});

const WINDOWS = [
  { days: 30, label: "30 days" }, { days: 90, label: "Quarter" },
  { days: 365, label: "Year" }, { days: 730, label: "2 years" },
];
const GRANULARITIES = [
  { id: "daily", label: "Daily" }, { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" }, { id: "yearly", label: "Yearly" },
];
const DIMENSIONS: { id: RevenueDimension; label: string; icon: typeof Landmark }[] = [
  { id: "package", label: "Packages", icon: Wallet2 },
  { id: "payment_method", label: "Payment Methods", icon: CreditCard },
  { id: "country", label: "Countries", icon: Landmark },
  { id: "state", label: "States", icon: Landmark },
  { id: "city", label: "Cities", icon: Landmark },
  { id: "coupon", label: "Coupons", icon: ReceiptText },
  { id: "admin", label: "Admins", icon: UserRound },
];
const PIE_COLORS = ["#1c1917", "#b08d57", "#57534e", "#a8a29e", "#d6d3d1", "#78716c", "#e7e5e4"];

function RevenuePage() {
  const [days, setDays] = useState(90);
  const [granularity, setGranularity] = useState("daily");
  const [dimension, setDimension] = useState<RevenueDimension>("package");

  const { data: s } = useQuery({
    queryKey: ["admin", "revenue", "summary", days],
    queryFn: () => revenueService.summary(days),
    refetchInterval: 60_000,
  });
  const { data: series } = useQuery({
    queryKey: ["admin", "revenue", "series", granularity],
    queryFn: () => revenueService.timeseries(granularity),
  });
  const { data: breakdown } = useQuery({
    queryKey: ["admin", "revenue", "breakdown", dimension, days],
    queryFn: () => revenueService.breakdown(dimension, days),
  });
  const { data: profit } = useQuery({
    queryKey: ["admin", "revenue", "profit"],
    queryFn: () => revenueService.profitTrend(12),
  });
  const { data: topCustomers } = useQuery({
    queryKey: ["admin", "revenue", "top-customers", days],
    queryFn: () => revenueService.topCustomers(Math.max(days, 365)),
  });

  const growthPositive = (s?.growth_pct ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ink-900">Revenue Analytics</h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Live financials from real payments — gross, net, tax, refunds, profit and CLV.
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

      {/* KPI wall */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Banknote} label="Gross Revenue" value={s ? inr(s.gross_revenue) : "—"}
          sub={s ? `${s.transactions} transactions` : undefined} />
        <StatCard icon={CircleDollarSign} label="Net Revenue" value={s ? inr(s.net_revenue) : "—"}
          sub={s ? `${growthPositive ? "▲" : "▼"} ${Math.abs(s.growth_pct)}% vs prev` : undefined}
          tone={growthPositive ? "ok" : "alert"} />
        <StatCard icon={Landmark} label="Tax / GST" value={s ? inr(s.tax_collected) : "—"} />
        <StatCard icon={Undo2} label="Refund Loss" value={s ? inr(s.refund_loss) : "—"}
          sub={s ? `${s.refund_count} refunds` : undefined}
          tone={s && s.refund_loss > 0 ? "warn" : undefined} />
        <StatCard icon={PiggyBank} label="Pending Revenue" value={s ? inr(s.pending_revenue) : "—"}
          sub={s ? `${s.pending_count} payments` : undefined} />
        <StatCard icon={Coins} label="Avg Order Value" value={s ? inr(s.avg_order_value) : "—"}
          sub={s ? `CLV ${inr(s.customer_lifetime_value)}` : undefined} />
      </div>

      {/* Revenue timeseries */}
      <GlassPanel className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>Revenue over time</SectionTitle>
          <div className="flex rounded-full border border-ink-900/10 bg-white p-0.5">
            {GRANULARITIES.map((g) => (
              <button key={g.id} onClick={() => setGranularity(g.id)}
                className={cn("rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                  granularity === g.id ? "bg-ink-900 text-cream-50" : "text-ink-900/45 hover:text-ink-900")}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        {(series?.series.length ?? 0) === 0 ? (
          <EmptyState title="No payments in this window" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series!.series}>
                <defs>
                  <linearGradient id="net" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1c1917" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1c1917" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={52}
                  tickFormatter={(v: number) => compact(v)} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number, name: string) =>
                    [["transactions"].includes(name) ? v : inr(v), name]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="net" name="Net" stroke="#1c1917" strokeWidth={2} fill="url(#net)" />
                <Bar dataKey="gst" name="GST" fill="#b08d57" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Line type="monotone" dataKey="refunds" name="Refunds" stroke="#e11d48" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassPanel>

      {/* Breakdown + share pie */}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <GlassPanel className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <SectionTitle>Revenue by dimension</SectionTitle>
            <select value={dimension} onChange={(e) => setDimension(e.target.value as RevenueDimension)}
              className="rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-[12px] text-ink-900/65 outline-none">
              {DIMENSIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          {(breakdown?.rows.length ?? 0) === 0 ? (
            <EmptyState title="No data for this dimension"
              sub={dimension === "country" || dimension === "state" || dimension === "city"
                ? "Geo splits use each paying customer's stored location."
                : undefined} />
          ) : (
            <div className="space-y-2">
              {breakdown!.rows.map((r, i) => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="w-5 text-right text-[10px] font-bold text-ink-900/30">{i + 1}</span>
                  <span className="w-40 truncate text-[12.5px] font-medium text-ink-900">{r.label}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded-lg bg-ink-900/[0.04]">
                    <div className="flex h-full items-center rounded-lg bg-ink-900 pl-2"
                      style={{ width: `${Math.max(r.share_pct, 3)}%` }}>
                      <span className="whitespace-nowrap text-[9px] font-bold text-cream-50">
                        {r.share_pct}%
                      </span>
                    </div>
                  </div>
                  <span className="w-24 text-right text-[12.5px] font-semibold text-ink-900">{inr(r.net)}</span>
                  <span className="hidden w-14 text-right text-[10.5px] text-ink-900/40 sm:block">
                    {r.transactions} txn
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="p-5">
          <SectionTitle>Share of net revenue</SectionTitle>
          {(breakdown?.rows.length ?? 0) === 0 ? (
            <EmptyState title="—" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdown!.rows.slice(0, 7)} dataKey="net" nameKey="label"
                    innerRadius="55%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
                    {breakdown!.rows.slice(0, 7).map((_, i) => (
                      <PieCell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => inr(v)} />
                  <Legend wrapperStyle={{ fontSize: 10.5 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Profit trend */}
      <GlassPanel className="p-5">
        <SectionTitle>Profit narrative — last 12 months</SectionTitle>
        {(profit?.months.length ?? 0) === 0 ? (
          <EmptyState title="No payment history yet" />
        ) : (
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profit!.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={52}
                  tickFormatter={(v: number) => compact(v)} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => inr(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gross" name="Gross" fill="#d6d3d1" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="net" name="Net" fill="#b08d57" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#1c1917" strokeWidth={2.5} dot={{ r: 2.5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassPanel>

      {/* Top customers */}
      <GlassPanel className="p-5">
        <SectionTitle>Top customers by net revenue</SectionTitle>
        {(topCustomers?.rows.length ?? 0) === 0 ? (
          <EmptyState title="No paying customers yet" />
        ) : (
          <div className="mt-2 divide-y divide-ink-900/[0.05]">
            {topCustomers!.rows.map((c, i) => (
              <div key={c.user_id} className="flex items-center gap-3 py-2.5">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                  i === 0 ? "bg-[color:var(--gold)] text-white" : "bg-ink-900/5 text-ink-900/50")}>
                  {i + 1}
                </span>
                {c.profile_image ? (
                  <img src={c.profile_image} alt="" className="size-8 rounded-full object-cover ring-1 ring-ink-900/10" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-ink-900/5 font-serif text-[12px] text-ink-900/50">
                    {c.name.charAt(0)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink-900">{c.name}</span>
                  <span className="block truncate text-[10.5px] text-ink-900/40">
                    {c.customer_id ?? c.email}{c.city ? ` · ${c.city}` : ""}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[13.5px] font-semibold text-ink-900">{inr(c.net)}</span>
                  <span className="block text-[10px] text-ink-900/40">{c.transactions} payments</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
