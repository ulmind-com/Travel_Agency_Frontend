import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Download, RefreshCw, Ban, ShieldCheck, Maximize2, FileImage,
  FileCode2, FileText, MapPin, Monitor, Globe, Clock3, History,
  ScanLine, User as UserIcon, AlertTriangle, CheckCircle2, Timer,
} from "lucide-react";
import { toast } from "sonner";

import { adminQrDetailQuery, adminQrHistoryQuery, adminQrAnalyticsQuery } from "@/lib/queries";
import { qrService } from "@/services/realtime.service";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QRDetail, QRScanLogRow } from "@/types/admin.realtime";
import {
  QR_VERIFICATION_STYLE, SCAN_RESULT_STYLE, badgeOf, relativeTime, expiryCountdown,
} from "./qrBadges";

export type QrDrawerTab = "overview" | "scans" | "analytics" | "versions";

export function QrDetailDrawer({ qrId, onClose }: { qrId: string | null; onClose: () => void }) {
  const [tab, setTab] = useState<QrDrawerTab>("overview");
  const [showPreview, setShowPreview] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => { if (qrId) { setTab("overview"); setShowPreview(false); } }, [qrId]);

  const { data, isLoading } = useQuery(adminQrDetailQuery(qrId));
  const d = data as QRDetail | undefined;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "qr"] });
  const onError = (e: unknown) => toast.error(apiErrorMessage(e));

  const statusM = useMutation({
    mutationFn: (s: "ACTIVE" | "REVOKED" | "BLOCKED") =>
      qrService.setStatus(qrId!, s, s === "ACTIVE" ? "Reactivated from admin panel" : undefined),
    onSuccess: (r) => { toast.success(`QR is now ${r.qr_status}`); invalidate(); },
    onError,
  });

  const download = async (format: "png" | "svg" | "pdf") => {
    try {
      const blob = await qrService.download(qrId!, format);
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${d?.booking?.booking_reference ?? "qr"}_v${d?.version ?? 1}.${format}`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success(`QR downloaded as ${format.toUpperCase()}`);
      invalidate();
    } catch (e) { onError(e); }
  };

  const vStyle = badgeOf(QR_VERIFICATION_STYLE, d?.verification_status);
  const countdown = expiryCountdown(d?.expiry);

  return (
    <>
      <AnimatePresence>
        {qrId && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-cream-50 shadow-2xl"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-ink-900/10 bg-cream-50/90 px-6 py-4 backdrop-blur">
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-900/40">QR Management</p>
                    <h3 className="truncate font-serif text-2xl font-medium text-ink-900">
                      {d?.booking?.booking_reference || "…"}
                    </h3>
                  </div>
                  <button onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/60 transition-colors hover:text-ink-900">
                    <X className="size-4" />
                  </button>
                </div>
                {d && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", vStyle.bg, vStyle.text)}>
                      <span className={cn("size-1.5 rounded-full", vStyle.dot)} /> {vStyle.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink-900/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-900/60">
                      v{d.version}
                    </span>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                      countdown.expired ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
                      <Timer className="size-3" /> {countdown.label}
                    </span>
                  </div>
                )}
                <div className="mt-4 flex gap-1 overflow-x-auto">
                  {(["overview", "scans", "analytics", "versions"] as QrDrawerTab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cn("shrink-0 rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors",
                        tab === t ? "bg-ink-900 text-cream-50" : "text-ink-900/50 hover:bg-ink-900/5")}
                    >
                      {t === "scans" ? `Scan History · ${d?.scan_count ?? 0}` : t === "versions" ? `Versions · ${(d?.history_count ?? 0) + 1}` : t}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading || !d ? (
                <div className="space-y-4 p-6">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-ink-900/5" />)}
                </div>
              ) : (
                <div className="space-y-6 p-6">
                  {tab === "overview" && (
                    <OverviewTab
                      d={d}
                      isSuperAdmin={!!isSuperAdmin}
                      onPreview={() => setShowPreview(true)}
                      onDownload={download}
                      onRegenerate={() => setShowRegen(true)}
                      onStatus={(s) => statusM.mutate(s)}
                      statusPending={statusM.isPending}
                    />
                  )}
                  {tab === "scans" && <ScansTab qrId={qrId} />}
                  {tab === "analytics" && <AnalyticsTab qrId={qrId} />}
                  {tab === "versions" && <VersionsTab d={d} />}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Large QR preview modal */}
      <AnimatePresence>
        {showPreview && d?.booking?.qr_code_url && (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center bg-ink-900/70 p-6 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-3xl bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-900/40">Boarding QR · v{d.version}</p>
              <h4 className="mt-1 font-serif text-2xl text-ink-900">{d.booking.booking_reference}</h4>
              <motion.img
                src={d.booking.qr_code_url}
                alt={`QR for ${d.booking.booking_reference}`}
                className="mx-auto mt-6 aspect-square w-full max-w-[320px] rounded-2xl border border-ink-900/10 object-contain p-3"
                initial={{ rotate: -2 }} animate={{ rotate: 0 }}
              />
              <p className="mt-4 text-xs text-ink-900/50">
                {d.booking.package_snapshot?.title ?? ""} · valid until {formatDateTime(d.expiry)}
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <DownloadBtn icon={FileImage} label="PNG" onClick={() => download("png")} />
                <DownloadBtn icon={FileCode2} label="SVG" onClick={() => download("svg")} />
                <DownloadBtn icon={FileText} label="PDF" onClick={() => download("pdf")} />
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-ink-900/5 text-ink-900/50 transition-colors hover:text-ink-900"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RegenerateModal
        open={showRegen}
        onClose={() => setShowRegen(false)}
        qrId={qrId}
        bookingRef={d?.booking?.booking_reference}
        onDone={invalidate}
      />
    </>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────
function OverviewTab({ d, isSuperAdmin, onPreview, onDownload, onRegenerate, onStatus, statusPending }: {
  d: QRDetail;
  isSuperAdmin: boolean;
  onPreview: () => void;
  onDownload: (f: "png" | "svg" | "pdf") => void;
  onRegenerate: () => void;
  onStatus: (s: "ACTIVE" | "REVOKED" | "BLOCKED") => void;
  statusPending: boolean;
}) {
  const b = d.booking;
  const u = d.user;
  return (
    <>
      {/* QR preview + actions */}
      <section className="rounded-2xl border border-ink-900/[0.07] bg-white/80 p-5 backdrop-blur">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          {b?.qr_code_url ? (
            <button onClick={onPreview} className="group relative shrink-0" title="Enlarge QR">
              <motion.img
                src={b.qr_code_url} alt="QR preview"
                className="size-36 rounded-2xl border border-ink-900/10 object-contain p-2 transition-shadow group-hover:shadow-lg"
                whileHover={{ scale: 1.03 }}
              />
              <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-ink-900 text-cream-50 opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="size-3" />
              </span>
            </button>
          ) : (
            <div className="grid size-36 shrink-0 place-items-center rounded-2xl bg-ink-900/5 text-ink-900/30">
              <ScanLine className="size-8" />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Package" value={b?.package_snapshot?.title ?? "—"} />
              <Info label="Travel Date" value={b?.travel_start_date ? new Date(b.travel_start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
              <Info label="Travelers" value={String(b?.travelers_count ?? "—")} />
              <Info label="Expiry" value={formatDateTime(d.expiry)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <DownloadBtn icon={FileImage} label="PNG" onClick={() => onDownload("png")} />
              <DownloadBtn icon={FileCode2} label="SVG" onClick={() => onDownload("svg")} />
              <DownloadBtn icon={FileText} label="PDF" onClick={() => onDownload("pdf")} />
              <span className="ml-auto inline-flex items-center gap-1 self-center text-[11px] text-ink-900/40">
                <Download className="size-3" /> {d.download_count} downloads
              </span>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-900/5 pt-4">
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-cream-50 transition-transform hover:scale-[1.02]"
            >
              <RefreshCw className="size-3.5" /> Regenerate QR
            </button>
            {d.status !== "REVOKED" && (
              <button onClick={() => onStatus("REVOKED")} disabled={statusPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50">
                <Ban className="size-3.5" /> Revoke
              </button>
            )}
            {d.status !== "BLOCKED" && (
              <button onClick={() => onStatus("BLOCKED")} disabled={statusPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:opacity-50">
                <AlertTriangle className="size-3.5" /> Block
              </button>
            )}
            {d.status !== "ACTIVE" && (
              <button onClick={() => onStatus("ACTIVE")} disabled={statusPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50">
                <ShieldCheck className="size-3.5" /> Reactivate
              </button>
            )}
            <p className="w-full text-[10px] text-ink-900/35">Super Admin controls — every action is audited immutably.</p>
          </div>
        )}
      </section>

      {/* Customer */}
      <section className="rounded-2xl border border-ink-900/[0.07] bg-white/80 p-5 backdrop-blur">
        <SectionTitle icon={UserIcon} title="Customer" />
        <div className="mt-3 flex items-center gap-3">
          {u?.profile_image?.url ? (
            <img src={u.profile_image.url} alt="" className="size-11 rounded-full object-cover ring-2 ring-[color:var(--gold)]/30" />
          ) : (
            <span className="grid size-11 place-items-center rounded-full bg-ink-900/5 font-serif text-lg text-ink-900/50">
              {(u?.name ?? "?").charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {u?._id ? (
              <Link to="/account/admin/users/$id" params={{ id: u._id }} className="font-medium text-ink-900 hover:underline">
                {u.name ?? "Unknown"}
              </Link>
            ) : (
              <p className="font-medium text-ink-900">{u?.name ?? "Unknown"}</p>
            )}
            <p className="truncate text-xs text-ink-900/45">{u?.email ?? "—"}{u?.phone ? ` · ${u.phone}` : ""}</p>
          </div>
          {b?.is_checked_in && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="size-3" /> Checked in {relativeTime(b.check_in_time)}
            </span>
          )}
        </div>
      </section>

      {/* Last scan */}
      <section className="rounded-2xl border border-ink-900/[0.07] bg-white/80 p-5 backdrop-blur">
        <SectionTitle icon={ScanLine} title="Last Scan" />
        {d.last_scan_time ? (
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Info label="When" value={`${relativeTime(d.last_scan_time)}`} sub={formatDateTime(d.last_scan_time)} />
            <Info label="Result" value={badgeOf(SCAN_RESULT_STYLE, d.last_scan_result).label} />
            <Info label="Device" value={d.last_scan_device ?? "—"} />
            <Info label="Browser" value={d.last_scan_browser ?? "—"} />
            <Info label="Location" value={d.last_scan_location ?? "—"} />
            <Info label="IP" value={d.last_scan_ip ?? "—"} mono />
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-900/40">This QR has never been scanned.</p>
        )}
      </section>

      {/* Recent scans preview */}
      {d.recent_scans.length > 0 && (
        <section className="rounded-2xl border border-ink-900/[0.07] bg-white/80 p-5 backdrop-blur">
          <SectionTitle icon={History} title={`Recent Attempts · ${d.recent_scans.length}`} />
          <div className="mt-3 space-y-2">
            {d.recent_scans.slice(0, 5).map((s) => <ScanRow key={s._id} s={s} compact />)}
          </div>
        </section>
      )}
    </>
  );
}

// ─── Scan history tab ────────────────────────────────────────────────────
function ScansTab({ qrId }: { qrId: string | null }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery(adminQrHistoryQuery(qrId, page));
  if (isLoading || !data) return <div className="h-64 animate-pulse rounded-2xl bg-ink-900/5" />;
  return (
    <section className="space-y-2">
      {data.scans.length === 0 ? (
        <EmptyState icon={ScanLine} text="No verification attempts recorded yet." />
      ) : data.scans.map((s) => <ScanRow key={s._id} s={s} />)}
      {data.pages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-ink-900/45">
          <span>Page {data.page} of {data.pages} · {data.total_scans} attempts</span>
          <div className="flex gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-ink-900/10 px-3 py-1.5 disabled:opacity-30">Prev</button>
            <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="rounded-lg border border-ink-900/10 px-3 py-1.5 disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </section>
  );
}

function ScanRow({ s, compact }: { s: QRScanLogRow; compact?: boolean }) {
  const style = badgeOf(SCAN_RESULT_STYLE, s.result);
  const loc = [s.city, s.state, s.country].filter(Boolean).join(", ");
  return (
    <div className="flex items-start gap-3 rounded-xl border border-ink-900/[0.06] bg-white p-3">
      <span className={cn("mt-0.5 inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", style.bg, style.text)}>
        {style.label}
      </span>
      <div className="min-w-0 flex-1 text-xs text-ink-900/60">
        <p className="text-[13px] text-ink-900">
          {s.scanner_name ?? "Unknown scanner"}
          {s.scanner_role && <span className="ml-1.5 rounded bg-ink-900/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-900/50">{s.scanner_role}</span>}
          {s.failure_reason && <span className="ml-1.5 text-rose-600">· {s.failure_reason}</span>}
        </p>
        {!compact && (
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {s.device && <span className="inline-flex items-center gap-1"><Monitor className="size-3" />{s.device} · {s.browser} · {s.os}</span>}
            {loc && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{loc}</span>}
            {s.ip_address && <span className="inline-flex items-center gap-1 font-mono"><Globe className="size-3" />{s.ip_address}</span>}
            {s.latitude != null && s.longitude != null && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />{s.latitude.toFixed(3)}, {s.longitude.toFixed(3)} ({s.gps_source})
              </span>
            )}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right text-[11px] text-ink-900/40" title={formatDateTime(s.scanned_at)}>
        <Clock3 className="ml-auto mb-0.5 size-3" />{relativeTime(s.scanned_at)}
      </div>
    </div>
  );
}

// ─── Analytics tab ───────────────────────────────────────────────────────
function AnalyticsTab({ qrId }: { qrId: string | null }) {
  const { data, isLoading } = useQuery(adminQrAnalyticsQuery(qrId));
  if (isLoading || !data) return <div className="h-64 animate-pulse rounded-2xl bg-ink-900/5" />;
  const a = data;
  const stat = (label: string, value: string | number, tone = "text-ink-900") => (
    <div className="rounded-xl border border-ink-900/[0.06] bg-white p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-900/40">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", tone)}>{value}</p>
    </div>
  );
  const maxTimeline = Math.max(...a.timeline.map((t) => t.scans), 1);
  return (
    <section className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        {stat("Total Scans", a.total_scans)}
        {stat("Verified", a.successful_scans, "text-emerald-600")}
        {stat("Failed", a.failed_scans, "text-rose-600")}
        {stat("Invalid Attempts", a.invalid_attempts, a.invalid_attempts ? "text-rose-600" : "text-ink-900")}
        {stat("Downloads", a.downloads, "text-purple-600")}
        {stat("Verify Rate", `${a.verification_rate}%`, "text-[color:var(--gold)]")}
      </div>

      {a.timeline.length > 0 && (
        <div className="rounded-2xl border border-ink-900/[0.07] bg-white/80 p-5">
          <SectionTitle icon={ScanLine} title="Scans Over Time" />
          <div className="mt-4 flex h-28 items-end gap-1">
            {a.timeline.map((t) => (
              <div key={t.date} className="group relative flex-1" title={`${t.date}: ${t.scans} scans (${t.verified} verified)`}>
                <div className="w-full rounded-t bg-ink-900/10 transition-colors group-hover:bg-ink-900/20"
                  style={{ height: `${(t.scans / maxTimeline) * 100}%`, minHeight: 4 }}>
                  <div className="w-full rounded-t bg-emerald-400/80" style={{ height: `${t.scans ? (t.verified / t.scans) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-ink-900/35">Green = verified share · hover for details</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <BreakdownCard title="By Result" entries={Object.entries(a.by_result)} styleMap={SCAN_RESULT_STYLE} />
        <BreakdownCard title="By Device" entries={Object.entries(a.by_device)} />
      </div>

      {a.top_locations.length > 0 && (
        <div className="rounded-2xl border border-ink-900/[0.07] bg-white/80 p-5">
          <SectionTitle icon={MapPin} title="Top Scan Locations" />
          <div className="mt-3 space-y-1.5">
            {a.top_locations.map((l) => (
              <div key={`${l.city}-${l.country}`} className="flex items-center justify-between text-sm">
                <span className="text-ink-900/70">{l.city}, {l.country}</span>
                <span className="font-semibold tabular-nums text-ink-900">{l.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function BreakdownCard({ title, entries, styleMap }: {
  title: string;
  entries: [string, number][];
  styleMap?: Record<string, { label: string; bg: string; text: string }>;
}) {
  const total = entries.reduce((s, [, n]) => s + n, 0) || 1;
  return (
    <div className="rounded-2xl border border-ink-900/[0.07] bg-white/80 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-900/40">{title}</p>
      <div className="mt-3 space-y-2">
        {entries.length === 0 && <p className="text-sm text-ink-900/40">No data yet.</p>}
        {entries.sort((a, b) => b[1] - a[1]).map(([k, n]) => {
          const st = styleMap ? badgeOf(styleMap, k) : null;
          return (
            <div key={k}>
              <div className="flex items-center justify-between text-xs">
                <span className={cn("font-medium", st?.text ?? "text-ink-900/70")}>{st?.label ?? k}</span>
                <span className="tabular-nums text-ink-900/50">{n}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-900/5">
                <motion.div
                  className={cn("h-full rounded-full", st?.bg.replace("bg-", "bg-").replace("-50", "-400") ?? "bg-ink-900/30")}
                  initial={{ width: 0 }} animate={{ width: `${(n / total) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Versions tab ────────────────────────────────────────────────────────
function VersionsTab({ d }: { d: QRDetail }) {
  const versions = [...(d.history ?? [])].reverse();
  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-emerald-800">Version {d.version} — current</p>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">Active signature</span>
        </div>
        <p className="mt-1 font-mono text-[10px] text-emerald-700/70 break-all">{d.qr_hash}</p>
      </div>
      {versions.length === 0 ? (
        <EmptyState icon={History} text="No previous versions — this QR was never regenerated." />
      ) : versions.map((v) => (
        <div key={v.version} className="rounded-2xl border border-ink-900/[0.07] bg-white/80 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-900/70">Version {v.version} — invalidated</p>
            <span className="text-[11px] text-ink-900/40" title={formatDateTime(v.invalidated_at)}>{relativeTime(v.invalidated_at)}</span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-ink-900/35 break-all">{v.qr_hash}</p>
          <p className="mt-2 text-xs text-ink-900/50">
            By {v.invalidated_by_name ?? "unknown"}{v.reason ? ` — “${v.reason}”` : ""}
          </p>
        </div>
      ))}
    </section>
  );
}

// ─── Regenerate modal ────────────────────────────────────────────────────
function RegenerateModal({ open, onClose, qrId, bookingRef, onDone }: {
  open: boolean; onClose: () => void; qrId: string | null; bookingRef?: string; onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [extendDays, setExtendDays] = useState("");
  const m = useMutation({
    mutationFn: () => qrService.regenerate(qrId!, {
      reason: reason.trim() || undefined,
      extend_days: extendDays ? Number(extendDays) : undefined,
    }),
    onSuccess: (r) => { toast.success(r.message); onDone(); onClose(); setReason(""); setExtendDays(""); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-ink-900/60 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-serif text-xl text-ink-900">Regenerate QR</h4>
            <p className="mt-1 text-sm text-ink-900/55">
              Issues a new signed QR for <span className="font-medium text-ink-900">{bookingRef}</span> and permanently
              invalidates every previously distributed image. The customer must use the new code.
            </p>
            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-wider text-ink-900/40">Reason (audited)</label>
            <textarea
              value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="e.g. Customer reported the ticket leaked on social media"
              className="mt-1 w-full rounded-xl border border-ink-900/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40"
            />
            <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-ink-900/40">Extend expiry (days, optional)</label>
            <input
              type="number" min={1} max={730} value={extendDays} onChange={(e) => setExtendDays(e.target.value)}
              placeholder="Keep current expiry"
              className="mt-1 w-full rounded-xl border border-ink-900/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-full border border-ink-900/10 px-4 py-2 text-sm text-ink-900/60 hover:border-ink-900/30">Cancel</button>
              <button
                onClick={() => m.mutate()} disabled={m.isPending}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-5 py-2 text-sm font-semibold text-cream-50 disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3.5", m.isPending && "animate-spin")} />
                {m.isPending ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/40">
      <Icon className="size-3.5" /> {title}
    </p>
  );
}

function Info({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-900/35">{label}</p>
      <p className={cn("mt-0.5 text-[13px] text-ink-900", mono && "font-mono text-[12px]")}>{value}</p>
      {sub && <p className="text-[10px] text-ink-900/40">{sub}</p>}
    </div>
  );
}

function DownloadBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-3.5 py-1.5 text-xs font-medium text-ink-900/70 transition-colors hover:border-ink-900/40 hover:text-ink-900"
    >
      <Icon className="size-3.5" /> {label}
    </button>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-900/10 bg-white/50 px-6 py-12 text-center">
      <Icon className="mx-auto mb-3 size-8 text-ink-900/15" />
      <p className="text-sm text-ink-900/40">{text}</p>
    </div>
  );
}
