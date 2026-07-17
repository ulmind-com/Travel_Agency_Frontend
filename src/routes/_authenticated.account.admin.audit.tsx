import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Activity, Download, FileClock, Globe2, Lock, Monitor, ScrollText, Search,
  ShieldCheck, Timer, UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { auditService, downloadBlob } from "@/services/enterprise.service";
import type { AuditListParams, AuditRow } from "@/types/admin.enterprise";
import {
  Badge, DrawerHeader, EmptyState, GlassPanel, Pagination, SectionTitle,
  SideDrawer, SkeletonRows, StatCard, fmtDateTime, relativeTime,
} from "@/components/admin/enterprise/ui";

export const Route = createFileRoute("/_authenticated/account/admin/audit")({
  component: AuditCenterPage,
});

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-sky-50 text-sky-700", POST: "bg-emerald-50 text-emerald-700",
  PATCH: "bg-amber-50 text-amber-700", PUT: "bg-amber-50 text-amber-700",
  DELETE: "bg-rose-50 text-rose-700",
};

function actionTone(action: string): string {
  if (/DELETE|REMOVED|BLOCKED|SUSPEND|ESCALAT/i.test(action)) return "bg-rose-50 text-rose-700";
  if (/CREATE|ADDED|APPROVED|VERIF/i.test(action)) return "bg-emerald-50 text-emerald-700";
  if (/UPDATE|CHANGED|REPLACED|OVERRIDE/i.test(action)) return "bg-amber-50 text-amber-700";
  return "bg-ink-900/5 text-ink-900/60";
}

function AuditCenterPage() {
  const { isSuperAdmin } = useAuth();
  const [params, setParams] = useState<AuditListParams>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<AuditRow | null>(null);
  const [view, setView] = useState<"table" | "timeline">("table");

  const effective = useMemo(() => ({
    ...params, q: search.trim() || undefined, page, page_size: 25,
  }), [params, search, page]);

  const { data: stats } = useQuery({
    queryKey: ["admin", "audit", "stats"],
    queryFn: () => auditService.stats(30),
    enabled: isSuperAdmin,
  });
  const { data: filters } = useQuery({
    queryKey: ["admin", "audit", "filters"],
    queryFn: auditService.filters,
    enabled: isSuperAdmin,
    staleTime: 5 * 60_000,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit", "list", effective],
    queryFn: () => auditService.list(effective),
    enabled: isSuperAdmin,
    placeholderData: keepPreviousData,
  });

  if (!isSuperAdmin) {
    return (
      <GlassPanel>
        <EmptyState icon={Lock} title="Super Admin only"
          sub="The Audit Log Center is restricted to SUPER_ADMIN accounts." />
      </GlassPanel>
    );
  }

  const exportLogs = async (format: "csv" | "json") => {
    try {
      const blob = await auditService.export(format, effective as Record<string, unknown>);
      downloadBlob(blob, `audit-logs.${format}`);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const setFilter = (k: keyof AuditListParams) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setParams((p) => ({ ...p, [k]: e.target.value || undefined }));
      setPage(1);
    };

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-3xl text-ink-900">
            Audit Log Center
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="size-3" /> Immutable
            </span>
          </h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Every administrative action, permanently recorded — nobody can edit or delete these entries.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportLogs("csv")}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-3.5 py-2 text-[12px] font-medium text-ink-900/65 shadow-sm hover:text-ink-900">
            <Download className="size-3.5" /> CSV
          </button>
          <button onClick={() => exportLogs("json")}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-3.5 py-2 text-[12px] font-medium text-ink-900/65 shadow-sm hover:text-ink-900">
            <Download className="size-3.5" /> JSON
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ScrollText} label="Total Records" value={stats ? stats.total_records.toLocaleString() : "—"} />
        <StatCard icon={Activity} label="Last 30 Days" value={stats ? stats.window_records.toLocaleString() : "—"} />
        <StatCard icon={UserRound} label="Most Active Admin"
          value={stats?.top_admins[0]?.name ?? "—"}
          sub={stats?.top_admins[0] ? `${stats.top_admins[0].count} actions` : undefined} />
        <StatCard icon={Timer} label="Avg Execution"
          value={stats?.avg_execution_ms != null ? `${stats.avg_execution_ms}ms` : "—"} />
      </div>

      {/* Daily activity chart */}
      {(stats?.daily.length ?? 0) > 1 && (
        <GlassPanel className="p-4">
          <SectionTitle>Admin activity — last 30 days</SectionTitle>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats!.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000008" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" fill="#1c1917" radius={[3, 3, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-900/35" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search action, entity, admin, IP, request ID…"
            className="w-72 rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40" />
        </div>
        <select value={params.action ?? ""} onChange={setFilter("action")}
          className="max-w-44 rounded-full border border-ink-900/10 bg-white px-3 py-2 text-[12px] text-ink-900/65 outline-none">
          <option value="">All actions</option>
          {filters?.actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={params.entity_type ?? ""} onChange={setFilter("entity_type")}
          className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-[12px] text-ink-900/65 outline-none">
          <option value="">All entities</option>
          {filters?.entity_types.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={params.admin_id ?? ""} onChange={setFilter("admin_id")}
          className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-[12px] text-ink-900/65 outline-none">
          <option value="">All admins</option>
          {filters?.admins.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.count})</option>)}
        </select>
        <input type="date" value={params.date_from ?? ""} onChange={setFilter("date_from")}
          className="rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-[12px] text-ink-900/65 outline-none" />
        <input type="date" value={params.date_to ?? ""} onChange={setFilter("date_to")}
          className="rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-[12px] text-ink-900/65 outline-none" />
        <div className="ml-auto flex rounded-full border border-ink-900/10 bg-white p-0.5">
          {(["table", "timeline"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={cn("rounded-full px-3 py-1 text-[11px] font-medium capitalize",
                view === v ? "bg-ink-900 text-cream-50" : "text-ink-900/45")}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Records */}
      <GlassPanel>
        {isLoading ? (
          <SkeletonRows count={8} height="h-12" />
        ) : items.length === 0 ? (
          <EmptyState icon={FileClock} title="No audit records match" />
        ) : view === "table" ? (
          <div className="divide-y divide-ink-900/[0.05]">
            {items.map((r, i) => (
              <motion.button key={r._id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.015, 0.2) }}
                onClick={() => setDetail(r)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-cream-50/70">
                <span className="w-32 shrink-0">
                  <span className="block text-[11px] font-medium text-ink-900/70">{relativeTime(r.created_at)}</span>
                  <span className="block text-[9.5px] text-ink-900/35">{fmtDateTime(r.created_at)}</span>
                </span>
                <Badge className={actionTone(r.action)}>{r.action}</Badge>
                <span className="min-w-0 flex-1 truncate text-[12px] text-ink-900/60">
                  <b className="text-ink-900">{r.actor_name ?? "Unknown"}</b>
                  {" → "}{r.entity_type}
                  <span className="font-mono text-[10px] text-ink-900/40"> {r.entity_id.slice(0, 12)}</span>
                  {r.reason && <span className="italic text-ink-900/45"> — {r.reason}</span>}
                </span>
                {r.http_method && (
                  <Badge className={cn("hidden sm:inline-flex", METHOD_STYLE[r.http_method] ?? "bg-ink-900/5")}>
                    {r.http_method}
                  </Badge>
                )}
                {r.execution_time_ms != null && (
                  <span className="hidden w-14 text-right text-[10px] text-ink-900/40 md:block">
                    {r.execution_time_ms}ms
                  </span>
                )}
                <span className="hidden w-24 truncate text-right text-[10px] text-ink-900/40 lg:block">
                  {r.ip_address}
                </span>
              </motion.button>
            ))}
          </div>
        ) : (
          <TimelineView items={items} onOpen={setDetail} />
        )}
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1}
          total={data?.total ?? 0} unit="records" onPage={setPage} />
      </GlassPanel>

      <AuditDetailDrawer record={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function TimelineView({ items, onOpen }: { items: AuditRow[]; onOpen: (r: AuditRow) => void }) {
  const groups = useMemo(() => {
    const g: Record<string, AuditRow[]> = {};
    for (const r of items) {
      const day = r.created_at.slice(0, 10);
      (g[day] ??= []).push(r);
    }
    return Object.entries(g);
  }, [items]);

  return (
    <div className="space-y-5 px-6 py-5">
      {groups.map(([day, rows]) => (
        <div key={day}>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-ink-900/40">
            {new Date(day).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <ol className="relative ml-2 space-y-3 border-l border-ink-900/10 pl-5">
            {rows.map((r) => (
              <li key={r._id} className="relative">
                <span className={cn("absolute -left-[26px] top-1.5 size-2.5 rounded-full border-2 border-cream-50",
                  /DELETE|REMOVED|ESCALAT/i.test(r.action) ? "bg-rose-500"
                    : /CREATE|APPROVED/i.test(r.action) ? "bg-emerald-500" : "bg-ink-900/50")} />
                <button onClick={() => onOpen(r)} className="text-left">
                  <span className="text-[12.5px] text-ink-900/75">
                    <b className="text-ink-900">{r.actor_name}</b> · {r.action.replaceAll("_", " ").toLowerCase()}
                    {" on "}{r.entity_type}
                  </span>
                  <span className="block text-[10.5px] text-ink-900/40">
                    {new Date(r.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    {r.ip_address ? ` · ${r.ip_address}` : ""}{r.browser ? ` · ${r.browser}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function AuditDetailDrawer({ record: r, onClose }: { record: AuditRow | null; onClose: () => void }) {
  return (
    <SideDrawer open={!!r} onClose={onClose} width="max-w-xl">
      {r && (
        <>
          <DrawerHeader onClose={onClose} title={r.action.replaceAll("_", " ")}
            sub={`${r.entity_type} · ${fmtDateTime(r.created_at)}`} />
          <div data-lenis-prevent="true" className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Who" value={`${r.actor_name ?? "—"} (${r.actor_role ?? "?"})`} />
              <Field label="Entity ID" value={r.entity_id} mono />
              <Field label="Endpoint" value={r.api_endpoint} mono />
              <Field label="Method / Code" value={r.http_method ? `${r.http_method} → ${r.response_code ?? "—"}` : null} />
              <Field label="Execution" value={r.execution_time_ms != null ? `${r.execution_time_ms} ms` : null} />
              <Field label="Timezone" value={r.timezone} />
              <Field label="Session" value={r.session_id} mono />
              <Field label="Request ID" value={r.request_id} mono />
            </div>

            <div>
              <SectionTitle>Client</SectionTitle>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="IP Address" value={r.ip_address} mono icon={Globe2} />
                <Field label="Location"
                  value={[r.city, r.state, r.country].filter(Boolean).join(", ") || null} icon={Globe2} />
                <Field label="Browser" value={r.browser} icon={Monitor} />
                <Field label="OS / Device" value={[r.os, r.device].filter(Boolean).join(" · ") || null} icon={Monitor} />
              </div>
            </div>

            {r.reason && (
              <div>
                <SectionTitle>Reason</SectionTitle>
                <p className="rounded-2xl border border-ink-900/[0.07] bg-white/70 px-4 py-3 text-[13px] italic text-ink-900/70">
                  “{r.reason}”
                </p>
              </div>
            )}

            {(r.old_value || r.new_value) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <DiffCard title="Old value" value={r.old_value} tone="old" />
                <DiffCard title="New value" value={r.new_value} tone="new" />
              </div>
            )}
          </div>
        </>
      )}
    </SideDrawer>
  );
}

function Field({ label, value, mono, icon: Icon }: {
  label: string; value: string | null | undefined; mono?: boolean; icon?: typeof Globe2;
}) {
  return (
    <div className="rounded-xl border border-ink-900/[0.06] bg-white/60 px-3 py-2">
      <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-ink-900/35">
        {Icon && <Icon className="size-2.5" />}{label}
      </p>
      <p className={cn("mt-0.5 break-all text-[12px] text-ink-900/75", mono && "font-mono text-[11px]")}>
        {value || "—"}
      </p>
    </div>
  );
}

function DiffCard({ title, value, tone }: {
  title: string; value: Record<string, unknown> | null; tone: "old" | "new";
}) {
  return (
    <div className={cn("rounded-2xl border p-3.5",
      tone === "old" ? "border-rose-200/60 bg-rose-50/30" : "border-emerald-200/60 bg-emerald-50/30")}>
      <p className={cn("text-[9px] font-bold uppercase tracking-wider",
        tone === "old" ? "text-rose-600" : "text-emerald-600")}>{title}</p>
      <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10.5px] leading-relaxed text-ink-900/70">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}
