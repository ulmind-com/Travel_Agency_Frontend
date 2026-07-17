import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, Ban, CheckCircle2, Fingerprint, Globe2, KeyRound,
  Laptop, Lock, LogOut, MonitorSmartphone, Search, Shield, ShieldAlert,
  ShieldCheck, Smartphone, Trash2, UserRound, Wifi, WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { securityAdminService } from "@/services/security.service";
import type {
  DeviceRow, IPRuleRow, SecurityEventRow, SessionRow, TokenRow,
} from "@/types/admin.security";
import {
  Badge, DrawerHeader, EmptyState, GlassPanel, Pagination, PillTabs,
  SectionTitle, SideDrawer, SkeletonRows, StatCard, fmtDateTime, fmtMins,
  relativeTime,
} from "@/components/admin/enterprise/ui";
import { UserSecurityDrawer } from "@/components/admin/security/UserSecurityDrawer";
import { RiskGauge } from "@/components/admin/security/RiskGauge";

export const Route = createFileRoute("/_authenticated/account/admin/security")({
  component: SecurityCenterPage,
});

type Tab = "overview" | "sessions" | "devices" | "tokens" | "ip" | "failed" | "timeline";

const SEV_STYLE: Record<string, string> = {
  INFO: "bg-sky-50 text-sky-700", LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700", HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-rose-50 text-rose-700",
};

function ThreatDots({ row }: { row: { is_vpn: boolean; is_proxy: boolean; is_tor: boolean } }) {
  const flags = [
    row.is_tor && { l: "TOR", c: "bg-rose-500" },
    row.is_proxy && { l: "PROXY", c: "bg-orange-500" },
    row.is_vpn && { l: "VPN", c: "bg-amber-500" },
  ].filter(Boolean) as { l: string; c: string }[];
  if (!flags.length) return <span className="text-[11px] text-emerald-600">Clean</span>;
  return (
    <div className="flex gap-1">
      {flags.map((f) => (
        <span key={f.l} className={cn("rounded px-1.5 py-0.5 text-[8.5px] font-bold text-white", f.c)}>{f.l}</span>
      ))}
    </div>
  );
}

function SecurityCenterPage() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [focusUser, setFocusUser] = useState<string | null>(null);

  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ["admin", "security", "overview"],
    queryFn: securityAdminService.overview,
    refetchInterval: 30_000,
  });

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "sessions", label: "Sessions", icon: MonitorSmartphone },
    { id: "devices", label: "Devices", icon: Laptop },
    { id: "tokens", label: "API Tokens", icon: KeyRound },
    { id: "ip", label: "IP Rules", icon: Globe2 },
    { id: "failed", label: "Failed Logins", icon: ShieldAlert },
    { id: "timeline", label: "Timeline", icon: Fingerprint },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-3xl text-ink-900">
            Security Center
            <span className="inline-flex items-center gap-1 rounded-full border border-ink-900/10 bg-white px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-ink-900/60">
              <ShieldCheck className="size-3 text-emerald-600" /> Live
            </span>
          </h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Sessions, devices, tokens, threat intelligence and the immutable security timeline — updating automatically.
          </p>
        </div>
        <PillTabs tabs={tabs} active={tab} onChange={(t) => setTab(t as Tab)} />
      </div>

      {tab === "overview" && <OverviewTab overview={overview} loading={ovLoading} onFocusUser={setFocusUser} />}
      {tab === "sessions" && <SessionsTab isSuperAdmin={isSuperAdmin} onFocusUser={setFocusUser} onChanged={() => qc.invalidateQueries({ queryKey: ["admin", "security"] })} />}
      {tab === "devices" && <DevicesTab isSuperAdmin={isSuperAdmin} onFocusUser={setFocusUser} />}
      {tab === "tokens" && <TokensTab isSuperAdmin={isSuperAdmin} onFocusUser={setFocusUser} />}
      {tab === "ip" && <IPRulesTab isSuperAdmin={isSuperAdmin} />}
      {tab === "failed" && <FailedLoginsTab onFocusUser={setFocusUser} />}
      {tab === "timeline" && <TimelineTab onFocusUser={setFocusUser} />}

      <UserSecurityDrawer userId={focusUser} onClose={() => setFocusUser(null)} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ overview, loading, onFocusUser }: {
  overview?: import("@/types/admin.security").SecurityOverview; loading: boolean;
  onFocusUser: (id: string) => void;
}) {
  if (loading || !overview) return <SkeletonRows count={4} height="h-24" />;
  const o = overview;
  const maxTrend = Math.max(...o.events_trend_14d.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={MonitorSmartphone} label="Active Sessions" value={String(o.sessions.active)}
          sub={`${o.sessions.revoked} revoked · ${o.sessions.expired} expired`} tone="ok" />
        <StatCard icon={Laptop} label="Devices" value={String(o.devices.total)}
          sub={`${o.devices.trusted} trusted · ${o.devices.blocked} blocked`} />
        <StatCard icon={KeyRound} label="API Tokens" value={String(o.api_tokens.active)}
          sub={`${o.api_tokens.revoked} revoked`} />
        <StatCard icon={ShieldAlert} label="Failed Logins 24h" value={String(o.failed_logins_24h)}
          tone={o.failed_logins_24h > 10 ? "alert" : undefined} />
        <StatCard icon={Globe2} label="Blocked IPs" value={String(o.ip_rules.blocked)}
          sub={`${o.ip_rules.whitelisted} whitelisted`} />
        <StatCard icon={ShieldCheck} label="2FA Adoption" value={`${o.two_factor.adoption_pct}%`}
          sub={`${o.two_factor.enabled_users}/${o.two_factor.total_users} users`}
          tone={o.two_factor.adoption_pct < 30 ? "warn" : "ok"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel className="lg:col-span-1">
          <div className="p-5">
            <SectionTitle>Platform Risk</SectionTitle>
            <div className="flex flex-col items-center py-2">
              <RiskGauge score={o.platform_risk.score} level={o.platform_risk.level} />
              <p className="mt-3 text-center text-xs text-ink-900/50">
                Weighted from the last 30 days of security signals across all accounts.
              </p>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="lg:col-span-2">
          <div className="p-5">
            <SectionTitle>Event Volume · 14 days</SectionTitle>
            <div className="mt-3 flex h-40 items-end gap-1.5">
              {o.events_trend_14d.map((d) => (
                <div key={d.date} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex w-full flex-1 items-end">
                    <div className="w-full rounded-t bg-ink-900/10" style={{ height: `${(d.count / maxTrend) * 100}%` }}>
                      {d.critical > 0 && (
                        <div className="w-full rounded-t bg-rose-500"
                          style={{ height: `${(d.critical / Math.max(d.count, 1)) * 100}%` }} />
                      )}
                    </div>
                    <div className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-1.5 py-0.5 text-[9px] text-cream-50 group-hover:block">
                      {d.count} · {d.critical} crit
                    </div>
                  </div>
                  <span className="text-[8px] text-ink-900/35">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(o.events_by_severity_7d).map(([sev, count]) => (
                <Badge key={sev} className={SEV_STYLE[sev] ?? "bg-ink-900/5 text-ink-900/60"}>
                  {sev} · {count}
                </Badge>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>

      <RecentCriticalEvents onFocusUser={onFocusUser} />
    </div>
  );
}

function RecentCriticalEvents({ onFocusUser }: { onFocusUser: (id: string) => void }) {
  const { data } = useQuery({
    queryKey: ["admin", "security", "events", { severity: "HIGH", page: 1 }],
    queryFn: () => securityAdminService.events({ page: 1, days: 30 }),
  });
  const items = (data?.items ?? []).slice(0, 8);
  return (
    <GlassPanel>
      <div className="border-b border-ink-900/[0.06] px-5 py-3">
        <SectionTitle>Recent Security Events</SectionTitle>
      </div>
      {items.length === 0 ? <EmptyState icon={ShieldCheck} title="No recent events" /> : (
        <div className="divide-y divide-ink-900/[0.05]">
          {items.map((e) => <EventRow key={e.id} e={e} onFocusUser={onFocusUser} />)}
        </div>
      )}
    </GlassPanel>
  );
}

function EventRow({ e, onFocusUser }: { e: SecurityEventRow; onFocusUser: (id: string) => void }) {
  return (
    <button onClick={() => e.user_id && onFocusUser(e.user_id)}
      className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-900/[0.02]">
      <Badge className={SEV_STYLE[e.severity] ?? "bg-ink-900/5"}>{e.severity}</Badge>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-ink-900">{e.description}</p>
        <p className="truncate text-[11px] text-ink-900/45">
          {e.event_type.replace(/_/g, " ")} · {e.ip_address ?? "—"} · {[e.city, e.country].filter(Boolean).join(", ") || "—"}
        </p>
      </div>
      <span className="shrink-0 text-[11px] text-ink-900/40">{relativeTime(e.created_at)}</span>
    </button>
  );
}

// ── Sessions ─────────────────────────────────────────────────────────────────
function SessionsTab({ isSuperAdmin, onFocusUser, onChanged }: {
  isSuperAdmin: boolean; onFocusUser: (id: string) => void; onChanged: () => void;
}) {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ status, search: search.trim() || undefined, page }), [status, search, page]);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "security", "sessions", params],
    queryFn: () => securityAdminService.sessions(params),
    placeholderData: keepPreviousData,
    refetchInterval: 20_000,
  });

  const terminate = useMutation({
    mutationFn: (id: string) => securityAdminService.terminateSession(id, "Terminated from Security Center"),
    onSuccess: () => { toast.success("Session terminated"); onChanged(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <FilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search email, IP, city…"
        selects={[{ value: status, onChange: (v) => { setStatus(v); setPage(1); },
          options: ["ALL", "ACTIVE", "REVOKED", "EXPIRED"] }]} />
      <GlassPanel>
        {isLoading ? <SkeletonRows /> : !data?.items.length ? (
          <EmptyState icon={MonitorSmartphone} title="No sessions" />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((s: SessionRow) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-900/5">
                  {s.device_type === "Mobile" ? <Smartphone className="size-4 text-ink-900/50" /> : <Laptop className="size-4 text-ink-900/50" />}
                </div>
                <button onClick={() => onFocusUser(s.user_id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[13px] text-ink-900">
                    {s.user_name ?? s.user_email} <span className="text-ink-900/40">· {s.user_role}</span>
                  </p>
                  <p className="truncate text-[11px] text-ink-900/45">
                    {s.browser} · {s.os} · {s.ip_address} · {[s.city, s.country].filter(Boolean).join(", ") || "—"}
                  </p>
                </button>
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <ThreatDots row={s} />
                  <span className="text-[11px] text-ink-900/40">{fmtMins(s.duration_minutes)}</span>
                </div>
                <Badge className={s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700"
                  : s.status === "REVOKED" ? "bg-rose-50 text-rose-700" : "bg-ink-900/5 text-ink-900/50"}>
                  {s.status}
                </Badge>
                {isSuperAdmin && s.status === "ACTIVE" && (
                  <button onClick={() => terminate.mutate(s.id)} disabled={terminate.isPending}
                    className="grid size-8 place-items-center rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50">
                    <LogOut className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} total={data.total} unit="sessions" onPage={setPage} />}
      </GlassPanel>
    </div>
  );
}

// ── Devices ──────────────────────────────────────────────────────────────────
function DevicesTab({ isSuperAdmin, onFocusUser }: { isSuperAdmin: boolean; onFocusUser: (id: string) => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ status, search: search.trim() || undefined, page }), [status, search, page]);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "security", "devices", params],
    queryFn: () => securityAdminService.devices(params),
    placeholderData: keepPreviousData,
  });
  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "TRUST" | "BLOCK" | "UNBLOCK" }) =>
      securityAdminService.deviceAction(id, action, `${action} from Security Center`),
    onSuccess: () => { toast.success("Device updated"); qc.invalidateQueries({ queryKey: ["admin", "security"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <FilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search device, browser, OS…"
        selects={[{ value: status, onChange: (v) => { setStatus(v); setPage(1); },
          options: ["ALL", "RECENT", "TRUSTED", "BLOCKED"] }]} />
      <GlassPanel>
        {isLoading ? <SkeletonRows /> : !data?.items.length ? (
          <EmptyState icon={Laptop} title="No devices" />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((d: DeviceRow) => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-900/5">
                  {d.device_type === "Mobile" ? <Smartphone className="size-4 text-ink-900/50" /> : <Laptop className="size-4 text-ink-900/50" />}
                </div>
                <button onClick={() => onFocusUser(d.user_id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[13px] text-ink-900">{d.browser} · {d.os}</p>
                  <p className="truncate text-[11px] text-ink-900/45">
                    {d.user_email} · {d.login_count} logins · {[d.last_city, d.last_country].filter(Boolean).join(", ") || "—"}
                  </p>
                </button>
                <Badge className={d.status === "TRUSTED" ? "bg-emerald-50 text-emerald-700"
                  : d.status === "BLOCKED" ? "bg-rose-50 text-rose-700" : "bg-ink-900/5 text-ink-900/50"}>
                  {d.status}
                </Badge>
                {isSuperAdmin && (
                  <div className="flex shrink-0 gap-1">
                    {d.status !== "TRUSTED" && (
                      <button onClick={() => act.mutate({ id: d.id, action: "TRUST" })} title="Trust"
                        className="grid size-8 place-items-center rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                        <CheckCircle2 className="size-3.5" />
                      </button>
                    )}
                    {d.status === "BLOCKED" ? (
                      <button onClick={() => act.mutate({ id: d.id, action: "UNBLOCK" })} title="Unblock"
                        className="grid size-8 place-items-center rounded-full border border-ink-900/10 text-ink-900/50 hover:bg-ink-900/5">
                        <Wifi className="size-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => act.mutate({ id: d.id, action: "BLOCK" })} title="Block"
                        className="grid size-8 place-items-center rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50">
                        <Ban className="size-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} total={data.total} unit="devices" onPage={setPage} />}
      </GlassPanel>
    </div>
  );
}

// ── Tokens ───────────────────────────────────────────────────────────────────
function TokensTab({ isSuperAdmin, onFocusUser }: { isSuperAdmin: boolean; onFocusUser: (id: string) => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ status, page }), [status, page]);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "security", "tokens", params],
    queryFn: () => securityAdminService.tokens(params),
    placeholderData: keepPreviousData,
  });
  const revoke = useMutation({
    mutationFn: (id: string) => securityAdminService.revokeToken(id, "Revoked from Security Center"),
    onSuccess: () => { toast.success("Token revoked"); qc.invalidateQueries({ queryKey: ["admin", "security"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <FilterBar selects={[{ value: status, onChange: (v) => { setStatus(v); setPage(1); },
        options: ["ALL", "ACTIVE", "REVOKED", "EXPIRED"] }]} />
      <GlassPanel>
        {isLoading ? <SkeletonRows /> : !data?.items.length ? (
          <EmptyState icon={KeyRound} title="No personal access tokens" />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((t: TokenRow) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                <KeyRound className="size-4 shrink-0 text-ink-900/40" />
                <button onClick={() => onFocusUser(t.user_id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[13px] text-ink-900">{t.name} <span className="font-mono text-[11px] text-ink-900/40">{t.token_prefix}</span></p>
                  <p className="truncate text-[11px] text-ink-900/45">
                    {t.user_name} · {t.scopes.length} scopes · used {t.use_count}× · {t.last_used_at ? relativeTime(t.last_used_at) : "never used"}
                  </p>
                </button>
                <Badge className={t.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-ink-900/5 text-ink-900/50"}>{t.status}</Badge>
                {isSuperAdmin && t.status === "ACTIVE" && (
                  <button onClick={() => revoke.mutate(t.id)}
                    className="grid size-8 place-items-center rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} total={data.total} unit="tokens" onPage={setPage} />}
      </GlassPanel>
    </div>
  );
}

// ── IP Rules ─────────────────────────────────────────────────────────────────
function IPRulesTab({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const qc = useQueryClient();
  const [ip, setIp] = useState("");
  const [rule, setRule] = useState<"BLOCK" | "WHITELIST">("BLOCK");
  const [reason, setReason] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "security", "ip-rules"],
    queryFn: () => securityAdminService.ipRules(false),
  });
  const create = useMutation({
    mutationFn: () => securityAdminService.createIpRule(ip.trim(), rule, reason.trim() || undefined),
    onSuccess: () => { toast.success("IP rule created"); setIp(""); setReason(""); qc.invalidateQueries({ queryKey: ["admin", "security"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => securityAdminService.removeIpRule(id),
    onSuccess: () => { toast.success("Rule removed"); qc.invalidateQueries({ queryKey: ["admin", "security"] }); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      {isSuperAdmin && (
        <GlassPanel>
          <div className="flex flex-wrap items-end gap-3 p-4">
            <div className="flex-1 min-w-[180px]">
              <SectionTitle>IP Address</SectionTitle>
              <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="203.0.113.5"
                className="w-full rounded-xl border border-ink-900/10 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <SectionTitle>Rule</SectionTitle>
              <select value={rule} onChange={(e) => setRule(e.target.value as "BLOCK" | "WHITELIST")}
                className="rounded-xl border border-ink-900/10 bg-white px-3 py-2 text-sm">
                <option value="BLOCK">Block</option>
                <option value="WHITELIST">Whitelist</option>
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <SectionTitle>Reason</SectionTitle>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional"
                className="w-full rounded-xl border border-ink-900/10 bg-white px-3 py-2 text-sm" />
            </div>
            <button onClick={() => create.mutate()} disabled={!ip.trim() || create.isPending}
              className="rounded-full bg-ink-900 px-5 py-2 text-[12px] font-medium uppercase tracking-widest text-cream-50 disabled:opacity-40">
              Add rule
            </button>
          </div>
        </GlassPanel>
      )}
      <GlassPanel>
        {isLoading ? <SkeletonRows /> : !data?.items.length ? (
          <EmptyState icon={Globe2} title="No active IP rules" />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((r: IPRuleRow) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                {r.rule === "BLOCK" ? <WifiOff className="size-4 text-rose-500" /> : <ShieldCheck className="size-4 text-emerald-600" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] text-ink-900">{r.ip}</p>
                  <p className="truncate text-[11px] text-ink-900/45">
                    {r.reason ?? "No reason"} · {r.hits} hits · by {r.created_by_name ?? "—"}
                  </p>
                </div>
                <Badge className={r.rule === "BLOCK" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}>{r.rule}</Badge>
                {isSuperAdmin && (
                  <button onClick={() => remove.mutate(r.id)}
                    className="grid size-8 place-items-center rounded-full border border-ink-900/10 text-ink-900/50 hover:bg-ink-900/5">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

// ── Failed logins ────────────────────────────────────────────────────────────
function FailedLoginsTab({ onFocusUser }: { onFocusUser: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "security", "failed", page],
    queryFn: () => securityAdminService.failedLogins({ days: 7, page }),
    placeholderData: keepPreviousData,
  });
  return (
    <div className="space-y-4">
      {data?.top_ips && data.top_ips.length > 0 && (
        <GlassPanel>
          <div className="border-b border-ink-900/[0.06] px-5 py-3"><SectionTitle>Top Offending IPs · 7 days</SectionTitle></div>
          <div className="flex flex-wrap gap-2 p-4">
            {data.top_ips.map((t) => (
              <div key={t.ip} className="rounded-xl border border-rose-200/60 bg-rose-50/50 px-3 py-2">
                <p className="font-mono text-[12px] text-ink-900">{t.ip}</p>
                <p className="text-[10px] text-ink-900/50">{t.count} attempts · {t.emails.length} accounts</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
      <GlassPanel>
        {isLoading ? <SkeletonRows /> : !data?.items.length ? (
          <EmptyState icon={ShieldCheck} title="No failed logins in this window" />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((e) => <EventRow key={e.id} e={e} onFocusUser={onFocusUser} />)}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} total={data.total} unit="events" onPage={setPage} />}
      </GlassPanel>
    </div>
  );
}

// ── Timeline ─────────────────────────────────────────────────────────────────
function TimelineTab({ onFocusUser }: { onFocusUser: (id: string) => void }) {
  const [severity, setSeverity] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(() => ({ severity, search: search.trim() || undefined, days: 30, page }), [severity, search, page]);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "security", "timeline", params],
    queryFn: () => securityAdminService.events(params),
    placeholderData: keepPreviousData,
    refetchInterval: 20_000,
  });
  return (
    <div className="space-y-4">
      <FilterBar search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search description, email, IP…"
        selects={[{ value: severity, onChange: (v) => { setSeverity(v); setPage(1); },
          options: ["ALL", "INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] }]} />
      <GlassPanel>
        {isLoading ? <SkeletonRows /> : !data?.items.length ? (
          <EmptyState icon={Fingerprint} title="No events" />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {data.items.map((e) => <EventRow key={e.id} e={e} onFocusUser={onFocusUser} />)}
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} total={data.total} unit="events" onPage={setPage} />}
      </GlassPanel>
    </div>
  );
}

// ── Shared filter bar ────────────────────────────────────────────────────────
function FilterBar({ search, onSearch, placeholder, selects }: {
  search?: string; onSearch?: (v: string) => void; placeholder?: string;
  selects?: { value: string; onChange: (v: string) => void; options: string[] }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onSearch && (
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-900/30" />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder}
            className="w-full rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-4 text-sm shadow-sm" />
        </div>
      )}
      {selects?.map((s, i) => (
        <select key={i} value={s.value} onChange={(e) => s.onChange(e.target.value)}
          className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-sm shadow-sm">
          {s.options.map((o) => <option key={o} value={o}>{o === "ALL" ? "All" : o}</option>)}
        </select>
      ))}
    </div>
  );
}
