import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3, Gift, Mail, MailPlus, Megaphone, MousePointerClick, Percent,
  Plus, Search, Send, Sparkles, Tag, Ticket, TrendingUp, Trash2, Users,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { marketingService } from "@/services/marketing.service";
import type {
  CampaignRow, CouponRow, MarketingDashboard, ReferralRow, SubscriberRow,
} from "@/types/admin.marketing";
import {
  Badge, EmptyState, GlassPanel, Pagination, PillTabs, SectionTitle,
  SkeletonRows, StatCard, compact, fmtDateTime, inr, relativeTime,
} from "@/components/admin/enterprise/ui";
import { CampaignBuilder } from "@/components/admin/marketing/CampaignBuilder";
import { CampaignDrawer } from "@/components/admin/marketing/CampaignDrawer";

export const Route = createFileRoute("/_authenticated/account/admin/marketing")({
  component: MarketingPage,
});

type Tab = "dashboard" | "campaigns" | "subscribers" | "referrals" | "coupons";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-ink-900/5 text-ink-900/55", SCHEDULED: "bg-sky-50 text-sky-700",
  SENDING: "bg-amber-50 text-amber-700", SENT: "bg-emerald-50 text-emerald-700",
  PAUSED: "bg-orange-50 text-orange-700", FAILED: "bg-rose-50 text-rose-700",
  CANCELLED: "bg-ink-900/5 text-ink-900/40",
};

function MarketingPage() {
  const { isSuperAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  const tabs: { id: Tab; label: string; icon: typeof Megaphone }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "subscribers", label: "Subscribers", icon: Mail },
    { id: "referrals", label: "Referrals", icon: Gift },
    { id: "coupons", label: "Coupons", icon: Ticket },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ink-900">Marketing CRM</h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Campaigns, audience segmentation, referrals and coupon performance — every metric from real events.
          </p>
        </div>
        <PillTabs tabs={tabs} active={tab} onChange={(t) => setTab(t as Tab)} />
      </div>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "campaigns" && <CampaignsTab isSuperAdmin={isSuperAdmin} />}
      {tab === "subscribers" && <SubscribersTab isSuperAdmin={isSuperAdmin} />}
      {tab === "referrals" && <ReferralsTab isSuperAdmin={isSuperAdmin} />}
      {tab === "coupons" && <CouponsTab />}
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function DashboardTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "marketing", "dashboard"],
    queryFn: marketingService.dashboard,
    refetchInterval: 30_000,
  });
  if (isLoading || !data) return <SkeletonRows count={4} height="h-24" />;
  const d: MarketingDashboard = data;
  const p = d.performance;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Megaphone} label="Campaigns" value={String(d.campaigns.total)}
          sub={`${d.campaigns.sent} sent · ${d.campaigns.scheduled} scheduled`} />
        <StatCard icon={Send} label="Delivered" value={compact(p.delivered)}
          sub={`${p.delivery_rate}% delivery`} tone="ok" />
        <StatCard icon={Mail} label="Open Rate" value={`${p.open_rate}%`} sub={`${compact(p.opens)} opens`} />
        <StatCard icon={MousePointerClick} label="Click Rate" value={`${p.click_rate}%`} sub={`${compact(p.clicks)} clicks`} />
        <StatCard icon={TrendingUp} label="Revenue" value={inr(p.revenue)} sub={`${p.conversions} conversions`} tone="ok" />
        <StatCard icon={Users} label="Subscribers" value={compact(d.newsletter.subscribers)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassPanel>
          <div className="p-5">
            <SectionTitle>Funnel</SectionTitle>
            <FunnelBar label="Sent" value={p.sent} max={p.sent} color="bg-ink-900/70" />
            <FunnelBar label="Delivered" value={p.delivered} max={p.sent} color="bg-sky-500" />
            <FunnelBar label="Opened" value={p.opens} max={p.sent} color="bg-emerald-500" />
            <FunnelBar label="Clicked" value={p.clicks} max={p.sent} color="bg-amber-500" />
            <FunnelBar label="Converted" value={p.conversions} max={p.sent} color="bg-[color:var(--gold)]" />
          </div>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel>
            <div className="p-5">
              <SectionTitle>Referral Program</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Signups" value={String(d.referrals.signups)} />
                <MiniStat label="Converted" value={String(d.referrals.converted)} />
                <MiniStat label="Earnings" value={inr(d.referrals.earnings)} />
                <MiniStat label="Revenue" value={inr(d.referrals.revenue)} />
              </div>
            </div>
          </GlassPanel>
          <GlassPanel>
            <div className="p-5">
              <SectionTitle>Coupons</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Active" value={String(d.coupons.active)} />
                <MiniStat label="Total Uses" value={String(d.coupons.total_uses)} />
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>

      {d.top_campaign && (
        <GlassPanel>
          <div className="flex items-center gap-3 p-5">
            <Sparkles className="size-5 text-[color:var(--gold)]" />
            <div className="flex-1">
              <SectionTitle>Top Campaign by Revenue</SectionTitle>
              <p className="text-[15px] text-ink-900">{d.top_campaign.name}</p>
            </div>
            <div className="text-right">
              <p className="font-serif text-2xl text-ink-900">{inr(d.top_campaign.revenue_generated)}</p>
              <p className="text-[11px] text-ink-900/45">{d.top_campaign.rates.open_rate}% open · {d.top_campaign.rates.conversion_rate}% conv</p>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-ink-900/55">{label}</span>
        <span className="font-medium text-ink-900">{value.toLocaleString("en-IN")}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-900/5">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-900/[0.06] bg-white/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-ink-900/40">{label}</p>
      <p className="mt-0.5 font-serif text-lg text-ink-900">{value}</p>
    </div>
  );
}

// ── Campaigns ────────────────────────────────────────────────────────────────
function CampaignsTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const params = useMemo(() => ({ status, search: search.trim() || undefined, page }), [status, search, page]);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "marketing", "campaigns", params],
    queryFn: () => marketingService.campaigns(params),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-900/30" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search campaigns…"
            className="w-full rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-4 text-sm shadow-sm" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm shadow-sm">
          {["ALL", "DRAFT", "SCHEDULED", "SENDING", "SENT", "CANCELLED"].map((o) => <option key={o}>{o}</option>)}
        </select>
        {isSuperAdmin && (
          <button onClick={() => setBuilderOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[12px] font-medium uppercase tracking-widest text-cream-50">
            <Plus className="size-3.5" /> New
          </button>
        )}
      </div>

      <GlassPanel>
        {isLoading ? <SkeletonRows /> : !data?.items.length ? (
          <EmptyState icon={Megaphone} title="No campaigns yet"
            sub={isSuperAdmin ? "Create your first campaign to reach your audience." : undefined} />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((c: CampaignRow) => (
              <button key={c.id} onClick={() => setDetailId(c.id)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-ink-900/[0.02]">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-900/5">
                  <Megaphone className="size-4 text-ink-900/50" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink-900">{c.name}</p>
                  <p className="truncate text-[11px] text-ink-900/45">
                    {c.channel} · {c.segment} · {c.audience_size} recipients · {relativeTime(c.created_at)}
                  </p>
                </div>
                <div className="hidden shrink-0 gap-4 text-right sm:flex">
                  <MetricCell label="Open" value={`${c.rates.open_rate}%`} />
                  <MetricCell label="Click" value={`${c.rates.click_rate}%`} />
                  <MetricCell label="Revenue" value={inr(c.revenue_generated)} />
                </div>
                <Badge className={STATUS_STYLE[c.status]}>{c.status}</Badge>
              </button>
            ))}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} total={data.total} unit="campaigns" onPage={setPage} />}
      </GlassPanel>

      {builderOpen && <CampaignBuilder onClose={() => setBuilderOpen(false)} />}
      <CampaignDrawer campaignId={detailId} onClose={() => setDetailId(null)} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-ink-900/35">{label}</p>
      <p className="text-[12px] font-medium text-ink-900">{value}</p>
    </div>
  );
}

// ── Subscribers ──────────────────────────────────────────────────────────────
function SubscribersTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ search: search.trim() || undefined, page }), [search, page]);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "marketing", "subscribers", params],
    queryFn: () => marketingService.subscribers(params),
    placeholderData: keepPreviousData,
  });
  const sync = useMutation({
    mutationFn: marketingService.syncSubscribers,
    onSuccess: (r: { created: number }) => { toast.success(`Synced ${r.created} new subscriber(s)`); qc.invalidateQueries({ queryKey: ["admin", "marketing"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-900/30" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search subscribers…"
            className="w-full rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-4 text-sm shadow-sm" />
        </div>
        {isSuperAdmin && (
          <button onClick={() => sync.mutate()} disabled={sync.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-[12px] font-medium text-ink-900/65 shadow-sm disabled:opacity-40">
            <MailPlus className="size-3.5" /> Sync from customers
          </button>
        )}
      </div>
      <GlassPanel>
        {isLoading ? <SkeletonRows /> : !data?.items.length ? (
          <EmptyState icon={Mail} title="No subscribers" />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((s: SubscriberRow) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <Mail className="size-4 shrink-0 text-ink-900/35" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink-900">{s.name ?? s.email}</p>
                  <p className="truncate text-[11px] text-ink-900/45">{s.email} · {s.source ?? "—"} · {s.subscribed_at ? relativeTime(s.subscribed_at) : ""}</p>
                </div>
                <Badge className={s.status === "SUBSCRIBED" ? "bg-emerald-50 text-emerald-700" : "bg-ink-900/5 text-ink-900/50"}>{s.status}</Badge>
              </div>
            ))}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} total={data.total} unit="subscribers" onPage={setPage} />}
      </GlassPanel>
    </div>
  );
}

// ── Referrals ────────────────────────────────────────────────────────────────
function ReferralsTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "marketing", "referrals", page],
    queryFn: () => marketingService.referrals({ page }),
    placeholderData: keepPreviousData,
  });
  const backfill = useMutation({
    mutationFn: marketingService.backfillReferrals,
    onSuccess: (r: { created: number }) => { toast.success(`Generated ${r.created} referral code(s)`); qc.invalidateQueries({ queryKey: ["admin", "marketing"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      {isSuperAdmin && (
        <div className="flex justify-end">
          <button onClick={() => backfill.mutate()} disabled={backfill.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-[12px] font-medium text-ink-900/65 shadow-sm disabled:opacity-40">
            <Gift className="size-3.5" /> Generate codes for all customers
          </button>
        </div>
      )}
      <GlassPanel>
        {isLoading ? <SkeletonRows /> : !data?.items.length ? (
          <EmptyState icon={Gift} title="No referral programs yet" />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((r: ReferralRow, i: number) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-6 shrink-0 text-center font-serif text-lg text-ink-900/30">{(page - 1) * 20 + i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink-900">{r.user_name ?? r.user_email}</p>
                  <p className="truncate font-mono text-[11px] text-[color:var(--gold)]">{r.code}</p>
                </div>
                <div className="flex shrink-0 gap-4 text-right">
                  <MetricCell label="Signups" value={String(r.signups)} />
                  <MetricCell label="Conv" value={`${r.conversion_rate}%`} />
                  <MetricCell label="Earnings" value={inr(r.earnings)} />
                </div>
              </div>
            ))}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} total={data.total} unit="referrers" onPage={setPage} />}
      </GlassPanel>
    </div>
  );
}

// ── Coupons ──────────────────────────────────────────────────────────────────
function CouponsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "marketing", "coupons"],
    queryFn: marketingService.coupons,
  });
  if (isLoading || !data) return <SkeletonRows count={4} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Tag} label="Active Coupons" value={String(data.totals.active)} />
        <StatCard icon={Percent} label="Total Uses" value={String(data.totals.uses)} />
        <StatCard icon={TrendingUp} label="Revenue" value={inr(data.totals.revenue)} tone="ok" />
      </div>
      <GlassPanel>
        {!data.items.length ? <EmptyState icon={Ticket} title="No coupons" /> : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((c: CouponRow) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <Ticket className="size-4 shrink-0 text-ink-900/35" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] text-ink-900">{c.code}</p>
                  <p className="truncate text-[11px] text-ink-900/45">
                    {c.discount_type === "PERCENTAGE" ? `${c.discount_value}% off` : `${inr(c.discount_value)} off`}
                    {" · "}{c.current_uses} uses · {c.bookings_generated} bookings
                  </p>
                </div>
                <div className="flex shrink-0 gap-4 text-right">
                  <MetricCell label="Revenue" value={inr(c.revenue_generated)} />
                  <MetricCell label="Discount" value={inr(c.total_discount_given)} />
                </div>
                <Badge className={c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-ink-900/5 text-ink-900/50"}>
                  {c.is_active ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
