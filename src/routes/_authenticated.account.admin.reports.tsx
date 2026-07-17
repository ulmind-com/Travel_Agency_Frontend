import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CalendarClock, Download, FileBarChart2, FileJson, FileSpreadsheet,
  FileText, FileType2, Loader2, Mail, Play, Plus, RefreshCcw, Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { downloadBlob, reportsService } from "@/services/enterprise.service";
import type { ReportFormat, ReportJob, ScheduledReport } from "@/types/admin.enterprise";
import {
  Badge, EmptyState, GlassPanel, Pagination, PillTabs, SectionTitle,
  SkeletonRows, fmtBytes, fmtDateTime, relativeTime,
} from "@/components/admin/enterprise/ui";

export const Route = createFileRoute("/_authenticated/account/admin/reports")({
  component: ReportCenterPage,
});

const FORMAT_ICON: Record<ReportFormat, typeof FileText> = {
  CSV: FileText, XLSX: FileSpreadsheet, PDF: FileType2, JSON: FileJson,
};

const STATUS_STYLE: Record<string, string> = {
  QUEUED: "bg-sky-50 text-sky-700",
  RUNNING: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-rose-50 text-rose-700",
};

const TYPE_LABEL: Record<string, string> = {
  USERS: "Users", BOOKINGS: "Bookings", PAYMENTS: "Payments", REVENUE: "Revenue",
  REFUNDS: "Refunds", PACKAGES: "Packages", STAFF: "Staff & Vendors",
  SUPPORT_TICKETS: "Support Tickets", AUDIT_LOGS: "Audit Logs", FRAUD: "Fraud Report",
  LOYALTY: "Loyalty Report", HEALTH_SCORE: "Health Scores",
};

function ReportCenterPage() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"history" | "scheduled">("history");
  const [page, setPage] = useState(1);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);

  const { data: history, isLoading } = useQuery({
    queryKey: ["admin", "reports", "history", page],
    queryFn: () => reportsService.history({ page, page_size: 15 }),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
  const { data: schedules } = useQuery({
    queryKey: ["admin", "reports", "schedules"],
    queryFn: reportsService.schedules,
    enabled: isSuperAdmin,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });

  const downloadMutation = useMutation({
    mutationFn: async (job: ReportJob) => {
      const blob = await reportsService.download(job.id);
      downloadBlob(blob, job.file_name ?? `${job.report_ref}.dat`);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const retryMutation = useMutation({
    mutationFn: (id: string) => reportsService.retry(id),
    onSuccess: () => { toast.success("Report re-queued"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const runNowMutation = useMutation({
    mutationFn: (id: string) => reportsService.runNow(id),
    onSuccess: () => { toast.success("Report queued"); invalidate(); setTab("history"); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => reportsService.deleteSchedule(id),
    onSuccess: () => { toast.success("Schedule deleted"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const toggleScheduleMutation = useMutation({
    mutationFn: (s: ScheduledReport) => reportsService.updateSchedule(s.id, { is_active: !s.is_active }),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const items = history?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ink-900">Report Center</h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Enterprise exports — CSV, Excel, PDF and JSON with scheduling and email delivery.
          </p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <button onClick={() => { setScheduleMode(true); setBuilderOpen(true); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-[12px] font-medium text-ink-900/65 shadow-sm hover:text-ink-900">
              <CalendarClock className="size-3.5" /> Schedule report
            </button>
          )}
          <button onClick={() => { setScheduleMode(false); setBuilderOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2.5 text-[12px] font-semibold text-cream-50 shadow-sm transition-transform hover:scale-[1.02]">
            <Plus className="size-3.5" /> Generate report
          </button>
        </div>
      </div>

      <PillTabs
        tabs={[
          { id: "history" as const, label: "History", icon: FileBarChart2 },
          ...(isSuperAdmin ? [{ id: "scheduled" as const, label: "Scheduled", icon: CalendarClock }] : []),
        ]}
        active={tab} onChange={setTab} />

      {tab === "history" ? (
        <GlassPanel>
          {isLoading ? (
            <SkeletonRows count={5} />
          ) : items.length === 0 ? (
            <EmptyState icon={FileBarChart2} title="No reports generated yet"
              sub="Generate a report — it renders in the background and appears here." />
          ) : (
            <div className="divide-y divide-ink-900/[0.05]">
              {items.map((j, i) => {
                const Icon = FORMAT_ICON[j.format] ?? FileText;
                return (
                  <motion.div key={j.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.25) }}
                    className="flex items-center gap-4 px-4 py-3.5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-900/[0.04]">
                      <Icon className="size-4.5 text-ink-900/50" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-ink-900">
                          {TYPE_LABEL[j.type] ?? j.type}
                        </span>
                        <span className="font-mono text-[9.5px] text-ink-900/35">{j.report_ref}</span>
                        {j.scheduled && (
                          <Badge className="bg-violet-50 text-violet-700">
                            <CalendarClock className="size-2.5" /> Scheduled
                          </Badge>
                        )}
                        {j.emailed_to.length > 0 && (
                          <Badge className="bg-sky-50 text-sky-700">
                            <Mail className="size-2.5" /> Emailed
                          </Badge>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink-900/45">
                        {j.format} · {j.requested_by_name} · {relativeTime(j.queued_at)}
                        {j.row_count != null && ` · ${j.row_count.toLocaleString()} rows`}
                        {j.file_size != null && ` · ${fmtBytes(j.file_size)}`}
                        {j.error && <span className="text-rose-500"> · {j.error}</span>}
                      </span>
                    </span>
                    <Badge className={STATUS_STYLE[j.status] ?? "bg-ink-900/5"}>
                      {j.status === "RUNNING" && <Loader2 className="size-2.5 animate-spin" />}
                      {j.status}
                    </Badge>
                    {j.status === "COMPLETED" && (
                      <button onClick={() => downloadMutation.mutate(j)}
                        className="inline-flex items-center gap-1 rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-900/65 hover:text-ink-900">
                        <Download className="size-3" /> Download
                      </button>
                    )}
                    {j.status === "FAILED" && (
                      <button onClick={() => retryMutation.mutate(j.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
                        <RefreshCcw className="size-3" /> Retry
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
          <Pagination page={history?.page ?? 1} pages={history?.pages ?? 1}
            total={history?.total ?? 0} unit="reports" onPage={setPage} />
        </GlassPanel>
      ) : (
        <GlassPanel>
          {(schedules?.items.length ?? 0) === 0 ? (
            <EmptyState icon={CalendarClock} title="No scheduled reports"
              sub="Schedule daily, weekly, monthly, quarterly or yearly exports with email delivery." />
          ) : (
            <div className="divide-y divide-ink-900/[0.05]">
              {schedules!.items.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-4 py-3.5">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl",
                    s.is_active ? "bg-emerald-50" : "bg-ink-900/[0.04]")}>
                    <CalendarClock className={cn("size-4.5", s.is_active ? "text-emerald-600" : "text-ink-900/30")} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-ink-900">{s.name}</span>
                      <Badge className="bg-ink-900/5 text-ink-900/60">{s.frequency}</Badge>
                      <Badge className="bg-ink-900/5 text-ink-900/60">{s.format}</Badge>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-900/45">
                      {TYPE_LABEL[s.type] ?? s.type} · ran {s.run_count}×
                      {s.next_run_at && ` · next ${fmtDateTime(s.next_run_at)}`}
                      {s.email_to.length > 0 && ` · → ${s.email_to.join(", ")}`}
                    </span>
                  </span>
                  <button onClick={() => runNowMutation.mutate(s.id)} title="Run now"
                    className="grid size-8 place-items-center rounded-full border border-ink-900/10 text-ink-900/50 hover:bg-ink-900 hover:text-cream-50">
                    <Play className="size-3.5" />
                  </button>
                  <button onClick={() => toggleScheduleMutation.mutate(s)}
                    className={cn("rounded-full px-3 py-1.5 text-[10.5px] font-bold",
                      s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500")}>
                    {s.is_active ? "ACTIVE" : "PAUSED"}
                  </button>
                  <button onClick={() => deleteScheduleMutation.mutate(s.id)} title="Delete"
                    className="grid size-8 place-items-center rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      )}

      <ReportBuilderModal open={builderOpen} schedule={scheduleMode}
        onClose={() => setBuilderOpen(false)}
        onDone={() => { setBuilderOpen(false); invalidate(); setTab(scheduleMode ? "scheduled" : "history"); }} />
    </div>
  );
}

// ─── Builder modal ───────────────────────────────────────────────────────────
function ReportBuilderModal({ open, schedule, onClose, onDone }: {
  open: boolean; schedule: boolean; onClose: () => void; onDone: () => void;
}) {
  const [type, setType] = useState("BOOKINGS");
  const [format, setFormat] = useState("CSV");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("WEEKLY");

  const { data: meta } = useQuery({
    queryKey: ["admin", "reports", "meta"],
    queryFn: reportsService.meta,
    enabled: open,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const filters: Record<string, unknown> = {};
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      const emails = emailTo.split(",").map((e) => e.trim()).filter(Boolean);
      if (schedule) {
        return reportsService.createSchedule({
          name: name.trim() || `${TYPE_LABEL[type]} · ${frequency.toLowerCase()}`,
          type, format, filters, frequency, email_to: emails,
        });
      }
      return reportsService.create({ type, format, filters, email_to: emails });
    },
    onSuccess: () => {
      toast.success(schedule ? "Scheduled report created" : "Report queued — generating now");
      onDone();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-ink-900/10 bg-cream-50 p-6 shadow-2xl">
        <h3 className="font-serif text-xl text-ink-900">
          {schedule ? "Schedule a recurring report" : "Generate a report"}
        </h3>
        <div className="mt-4 space-y-3">
          {schedule && (
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Schedule name (e.g. Weekly revenue digest)"
              className="w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
          )}
          <div className="grid grid-cols-2 gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="rounded-2xl border border-ink-900/10 bg-white px-3 py-2.5 text-[13px] outline-none">
              {(meta?.types ?? ["BOOKINGS"]).map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>
              ))}
            </select>
            <div className="flex rounded-2xl border border-ink-900/10 bg-white p-1">
              {(meta?.formats ?? ["CSV"]).map((f) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={cn("flex-1 rounded-xl py-1.5 text-[11px] font-bold transition-colors",
                    format === f ? "bg-ink-900 text-cream-50" : "text-ink-900/45")}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          {schedule && (
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-2xl border border-ink-900/10 bg-white px-3 py-2.5 text-[13px] outline-none">
              {(meta?.frequencies ?? []).map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          )}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-900/40">
              Filter window (exports only the filtered slice)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-2xl border border-ink-900/10 bg-white px-3 py-2 text-[12.5px] outline-none" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="rounded-2xl border border-ink-900/10 bg-white px-3 py-2 text-[12.5px] outline-none" />
            </div>
          </div>
          <input value={emailTo} onChange={(e) => setEmailTo(e.target.value)}
            placeholder="Email delivery (comma-separated, optional)"
            className="w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose}
            className="rounded-full border border-ink-900/10 px-4 py-2 text-[12px] text-ink-900/60">Cancel</button>
          <button disabled={submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-5 py-2 text-[12px] font-semibold text-cream-50 disabled:opacity-40">
            {submitMutation.isPending && <Loader2 className="size-3 animate-spin" />}
            {schedule ? "Create schedule" : "Queue report"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
