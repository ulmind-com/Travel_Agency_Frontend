import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Cloud, Cpu, CreditCard, Database, Gauge, HardDrive, Layers, Lock,
  MailCheck, MemoryStick, Radio, Server, Users2, Webhook, Wifi, Zap,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { monitoringService } from "@/services/enterprise.service";
import type { ServiceStatus } from "@/types/admin.enterprise";
import {
  EmptyState, GlassPanel, SectionTitle, SkeletonRows, fmtDateTime,
} from "@/components/admin/enterprise/ui";

export const Route = createFileRoute("/_authenticated/account/admin/monitoring")({
  component: MonitoringPage,
});

const STATUS_TONE: Record<string, { dot: string; text: string; ring: string }> = {
  UP: { dot: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-200/60" },
  DEGRADED: { dot: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-200/60" },
  DOWN: { dot: "bg-rose-500", text: "text-rose-600", ring: "ring-rose-200/60" },
  UNKNOWN: { dot: "bg-stone-400", text: "text-stone-500", ring: "ring-stone-200/60" },
};

function uptimeLabel(seconds?: number): string {
  if (!seconds) return "—";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

function MonitoringPage() {
  const { isSuperAdmin } = useAuth();

  const { data: m, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["admin", "monitoring", "overview"],
    queryFn: monitoringService.overview,
    enabled: isSuperAdmin,
    refetchInterval: 10_000,          // live wall — auto refresh
    refetchIntervalInBackground: false,
  });
  const { data: endpoints } = useQuery({
    queryKey: ["admin", "monitoring", "endpoints"],
    queryFn: monitoringService.endpoints,
    enabled: isSuperAdmin,
    refetchInterval: 30_000,
  });

  if (!isSuperAdmin) {
    return (
      <GlassPanel>
        <EmptyState icon={Lock} title="Super Admin only"
          sub="System Monitoring is restricted to SUPER_ADMIN accounts." />
      </GlassPanel>
    );
  }

  const overallTone = m?.overall === "HEALTHY" ? "text-emerald-600"
    : m?.overall === "DEGRADED" ? "text-amber-600" : "text-rose-600";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ink-900">System Monitoring</h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Real-time platform health — every probe hits the live dependency.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink-900/10 bg-white/70 px-4 py-2 text-[11px] shadow-sm">
          <span className={cn("size-2 rounded-full",
            m?.overall === "HEALTHY" ? "animate-pulse bg-emerald-500"
              : m?.overall === "DEGRADED" ? "bg-amber-500" : "bg-rose-500")} />
          <span className={cn("font-bold uppercase tracking-wider", overallTone)}>
            {m?.overall ?? "…"}
          </span>
          <span className="text-ink-900/35">· refreshed {new Date(dataUpdatedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {isLoading || !m ? (
        <GlassPanel><SkeletonRows count={6} height="h-20" /></GlassPanel>
      ) : (
        <>
          {/* Service wall */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ServiceCard icon={Database} name="MongoDB" s={m.services.mongodb}
              lines={[
                ["Latency", m.services.mongodb.latency_ms != null ? `${m.services.mongodb.latency_ms}ms` : "—"],
                ["Storage", m.services.mongodb.storage_mb != null ? `${m.services.mongodb.storage_mb} MB` : "—"],
                ["Objects", m.services.mongodb.objects?.toLocaleString() ?? "—"],
              ]} />
            <ServiceCard icon={Zap} name="Redis" s={m.services.redis}
              lines={[
                ["Memory", m.services.redis.memory_used_mb != null ? `${m.services.redis.memory_used_mb} MB` : "—"],
                ["Clients", String(m.services.redis.connected_clients ?? "—")],
                ["Ops/sec", String(m.services.redis.ops_per_sec ?? "—")],
              ]} />
            <ServiceCard icon={Server} name="FastAPI" s={m.services.fastapi}
              lines={[
                ["Uptime", uptimeLabel(m.services.fastapi.uptime_seconds)],
                ["Memory", m.services.fastapi.process_memory_mb != null ? `${m.services.fastapi.process_memory_mb} MB` : "—"],
                ["Threads", String(m.services.fastapi.threads ?? "—")],
              ]} />
            <ServiceCard icon={Cloud} name="Cloudinary" s={m.services.cloudinary}
              lines={[
                ["Storage", m.services.cloudinary.storage_used_mb != null ? `${m.services.cloudinary.storage_used_mb} MB` : "—"],
                ["Credits", m.services.cloudinary.credits_used != null
                  ? `${m.services.cloudinary.credits_used}/${m.services.cloudinary.credits_limit}` : "—"],
                ["Plan", String(m.services.cloudinary.plan ?? "—")],
              ]} />
            <ServiceCard icon={CreditCard} name="Razorpay" s={m.services.razorpay}
              lines={[["Mode", String(m.services.razorpay.mode ?? "—")]]} />
            <ServiceCard icon={MailCheck} name="Email (Resend)" s={m.services.email}
              lines={[["Configured", m.services.email.configured ? "Yes" : "No"]]} />
            <ServiceCard icon={Webhook} name="Webhooks" s={m.services.webhooks}
              lines={[
                ["Last event", m.services.webhooks.last_received
                  ? fmtDateTime(String(m.services.webhooks.last_received)) : "None yet"],
                ["Failed (24h)", String(m.services.webhooks.failed_24h ?? 0)],
              ]} />
            <GlassPanel className="p-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-900/45">
                <Radio className="size-3.5" /> Realtime
              </p>
              <div className="mt-2 space-y-1 text-[11.5px] text-ink-900/60">
                <p className="flex justify-between"><span>Online users (10m)</span>
                  <b className="text-ink-900">{m.realtime.online_users}</b></p>
                <p className="flex justify-between"><span>Admin SSE streams</span>
                  <b className="text-ink-900">{m.realtime.online_admins}</b></p>
                <p className="flex justify-between"><span>WebSockets</span>
                  <b className="text-ink-900">{m.realtime.websocket_connections}</b></p>
              </div>
            </GlassPanel>
          </div>

          {/* Resources */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResourceGauge icon={Cpu} label="CPU" pct={m.resources.cpu_percent}
              sub={`host load`} />
            <ResourceGauge icon={MemoryStick} label="RAM" pct={m.resources.ram_percent}
              sub={`${m.resources.ram_used_gb} / ${m.resources.ram_total_gb} GB`} />
            <ResourceGauge icon={HardDrive} label="Disk" pct={m.resources.disk_percent}
              sub={`${m.resources.disk_used_gb} / ${m.resources.disk_total_gb} GB`} />
          </div>

          {/* API metrics + queues */}
          <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <GlassPanel className="p-5">
              <div className="flex flex-wrap items-center justify-between">
                <SectionTitle>API traffic — last 15 minutes</SectionTitle>
                <div className="flex gap-4 text-[11px] text-ink-900/55">
                  <span>Requests <b className="text-ink-900">{m.api.requests_15m ?? 0}</b></span>
                  <span>Success <b className={cn((m.api.success_rate ?? 100) < 99 ? "text-amber-600" : "text-emerald-600")}>
                    {m.api.success_rate ?? 100}%</b></span>
                  <span>Avg <b className="text-ink-900">{m.api.avg_latency_ms ?? 0}ms</b></span>
                  <span>p95 <b className="text-ink-900">{m.api.p95_ms ?? "—"}ms</b></span>
                  <span>p99 <b className="text-ink-900">{m.api.p99_ms ?? "—"}ms</b></span>
                </div>
              </div>
              <div className="mt-3 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={m.api.per_minute ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000008" vertical={false} />
                    <XAxis dataKey="minute" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="c" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={26} allowDecimals={false} />
                    <YAxis yAxisId="l" orientation="right" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={34}
                      tickFormatter={(v: number) => `${v}ms`} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar yAxisId="c" dataKey="count" name="Requests" fill="#d6d3d1" radius={[3, 3, 0, 0]} maxBarSize={14} />
                    <Bar yAxisId="c" dataKey="errors" name="Errors" fill="#e11d48" radius={[3, 3, 0, 0]} maxBarSize={14} />
                    <Line yAxisId="l" type="monotone" dataKey="avg_ms" name="Avg ms" stroke="#b08d57" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <SectionTitle>Queues & workers</SectionTitle>
              <div className="mt-1 space-y-2">
                {Object.entries(m.queues).map(([name, depth]) => (
                  <div key={name} className="flex items-center gap-2.5">
                    <Layers className="size-3.5 text-ink-900/30" />
                    <span className="flex-1 text-[12.5px] capitalize text-ink-900/65">{name} queue</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                      (depth ?? 0) > 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                      {depth ?? 0} queued
                    </span>
                  </div>
                ))}
              </div>
              <SectionTitle>
                <span className="mt-4 block">Background jobs</span>
              </SectionTitle>
              <div className="space-y-1.5">
                {m.background_jobs.length === 0 ? (
                  <p className="text-[11.5px] text-ink-900/35">No scheduled jobs</p>
                ) : m.background_jobs.map((j) => (
                  <div key={j.id} className="rounded-xl bg-ink-900/[0.03] px-3 py-2">
                    <p className="text-[11.5px] font-medium text-ink-900/75">{j.name}</p>
                    <p className="text-[10px] text-ink-900/40">
                      next run {j.next_run ? fmtDateTime(j.next_run) : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          {/* Endpoint table */}
          <GlassPanel className="p-5">
            <SectionTitle>Hottest endpoints (24h)</SectionTitle>
            {(endpoints?.rows.length ?? 0) === 0 ? (
              <p className="text-[12px] text-ink-900/40">Traffic metrics accumulate as the API serves requests.</p>
            ) : (
              <div className="mt-1 divide-y divide-ink-900/[0.05]">
                {endpoints!.rows.slice(0, 15).map((e) => (
                  <div key={e.endpoint} className="flex items-center gap-3 py-2">
                    <Gauge className="size-3.5 shrink-0 text-ink-900/25" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-900/70">{e.endpoint}</span>
                    <span className="w-16 text-right text-[11.5px] font-semibold text-ink-900">{e.count}</span>
                    <span className={cn("w-14 text-right text-[11px]",
                      e.errors > 0 ? "font-semibold text-rose-600" : "text-ink-900/35")}>
                      {e.errors} err
                    </span>
                    <span className="w-16 text-right text-[11px] text-ink-900/50">{e.avg_ms}ms</span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </>
      )}
    </div>
  );
}

function ServiceCard({ icon: Icon, name, s, lines }: {
  icon: typeof Database; name: string; s: ServiceStatus; lines?: [string, string][];
}) {
  const tone = STATUS_TONE[s.status] ?? STATUS_TONE.UNKNOWN;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl border border-ink-900/[0.08] bg-white/70 p-4 shadow-sm backdrop-blur ring-1 ring-inset",
        tone.ring)}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-900/45">
          <Icon className="size-3.5" /> {name}
        </p>
        <span className={cn("flex items-center gap-1.5 text-[10px] font-bold", tone.text)}>
          <span className={cn("size-1.5 rounded-full", tone.dot,
            s.status === "UP" && "animate-pulse")} />
          {s.status}
        </span>
      </div>
      {s.error ? (
        <p className="mt-2 line-clamp-2 text-[10.5px] text-rose-500">{s.error}</p>
      ) : (
        <div className="mt-2 space-y-0.5">
          {lines?.map(([k, v]) => (
            <p key={k} className="flex justify-between text-[11px] text-ink-900/55">
              <span>{k}</span><b className="text-ink-900/85">{v}</b>
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ResourceGauge({ icon: Icon, label, pct, sub }: {
  icon: typeof Cpu; label: string; pct: number; sub?: string;
}) {
  const tone = pct > 90 ? "#e11d48" : pct > 70 ? "#f59e0b" : "#10b981";
  return (
    <GlassPanel className="flex items-center gap-4 p-4">
      <div className="relative grid size-16 shrink-0 place-items-center">
        <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
          <circle cx="32" cy="32" r="26" fill="none" stroke="#00000010" strokeWidth="7" />
          <motion.circle cx="32" cy="32" r="26" fill="none" stroke={tone} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={2 * Math.PI * 26}
            initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - pct / 100) }}
            transition={{ duration: 0.8, ease: "easeOut" }} />
        </svg>
        <span className="absolute text-[12px] font-bold text-ink-900">{Math.round(pct)}%</span>
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-900/45">
          <Icon className="size-3.5" /> {label}
        </p>
        {sub && <p className="mt-0.5 text-[11.5px] text-ink-900/55">{sub}</p>}
      </div>
    </GlassPanel>
  );
}
