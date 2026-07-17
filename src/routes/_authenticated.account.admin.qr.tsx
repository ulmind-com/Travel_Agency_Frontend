import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, SlidersHorizontal, Download, ChevronLeft, ChevronRight, ArrowUpDown,
  QrCode, ScanLine, X, ShieldCheck, ShieldX, Maximize2,
} from "lucide-react";
import { toast } from "sonner";

import { adminQrSummaryQuery, adminQrListQuery } from "@/lib/queries";
import { qrService } from "@/services/realtime.service";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QRListResponse, QRRow, QRVerifyResponse } from "@/types/admin.realtime";
import { QrKpiCards } from "@/components/admin/qr/QrKpiCards";
import { QrDetailDrawer } from "@/components/admin/qr/QrDetailDrawer";
import { QR_VERIFICATION_STYLE, SCAN_RESULT_STYLE, badgeOf, relativeTime, expiryCountdown } from "@/components/admin/qr/qrBadges";

export const Route = createFileRoute("/_authenticated/account/admin/qr")({
  validateSearch: (search: Record<string, unknown>): { focus?: string } => ({
    focus: typeof search.focus === "string" ? search.focus : undefined,
  }),
  component: QrCenterPage,
});

const PAGE_SIZE = 15;

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function QrCenterPage() {
  const { focus } = useSearch({ from: "/_authenticated/account/admin/qr" });
  const [selected, setSelected] = useState<string | null>(focus ?? null);
  const [showScanner, setShowScanner] = useState(false);

  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim(), 350);
  const [fStatus, setFStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState<"created_at" | "expiry" | "scan_count" | "download_count" | "invalid_attempts" | "last_scan_time">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // deep-link support: /account/admin/qr?focus=<qr_id>
  useEffect(() => { if (focus) setSelected(focus); }, [focus]);

  const params = useMemo(() => ({
    search: q, status: fStatus, sort_by: sortBy, sort_dir: sortDir, page, page_size: PAGE_SIZE,
  }), [q, fStatus, sortBy, sortDir, page]);

  const { data: summary, isLoading: sumLoading, dataUpdatedAt, isFetching } = useQuery(adminQrSummaryQuery());
  const { data: list, isLoading: listLoading } = useQuery(adminQrListQuery(params));
  const res = list as QRListResponse | undefined;
  const rows = res?.items ?? [];
  const pageCount = res?.pages ?? 1;

  useEffect(() => { setPage(1); }, [q, fStatus]);

  const toggleSort = (k: typeof sortBy) => {
    if (sortBy === k) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortBy(k); setSortDir("desc"); }
  };

  const doExport = async () => {
    try {
      const blob = await qrService.exportCsv();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `qr_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success("QR ledger exported (CSV)");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Export failed"));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium text-ink-900">QR Management</h2>
          <p className="mt-1 text-sm text-ink-900/60">
            Every boarding QR — signed, versioned, scan-audited and live.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-sm font-semibold text-cream-50 shadow-sm transition-transform hover:scale-[1.02]"
          >
            <ScanLine className="size-4" /> Verify a QR
          </button>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            <span className="relative flex size-2">
              <span className={cn("absolute inline-flex size-full rounded-full bg-emerald-400", isFetching && "animate-ping")} />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Live · {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "—"}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      {sumLoading || !summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-900/5" />)}
        </div>
      ) : (
        <QrKpiCards s={summary} />
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-900/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking reference, customer name or email…"
            className="w-full rounded-full border border-ink-900/10 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[color:var(--gold)]/40"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
              showFilters || fStatus !== "ALL" ? "border-ink-900 bg-ink-900 text-cream-50" : "border-ink-900/10 bg-white text-ink-900/70 hover:border-ink-900/30")}
          >
            <SlidersHorizontal className="size-4" /> Filters{fStatus !== "ALL" ? " · 1" : ""}
          </button>
          <button
            onClick={doExport}
            className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-white px-4 py-2.5 text-sm font-medium text-ink-900/70 transition-colors hover:border-ink-900/30"
          >
            <Download className="size-4" /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap gap-2 rounded-2xl border border-ink-900/[0.07] bg-white/70 p-4 backdrop-blur">
              {["ALL", "PENDING", "VERIFIED", "EXPIRED", "REVOKED", "BLOCKED"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFStatus(s)}
                  className={cn("rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                    fStatus === s ? "bg-ink-900 text-cream-50" : "bg-ink-900/5 text-ink-900/60 hover:bg-ink-900/10")}
                >
                  {s === "ALL" ? "All statuses" : badgeOf(QR_VERIFICATION_STYLE, s).label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-ink-900/[0.08] bg-white shadow-sm">
        <div className="max-h-[680px] overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="sticky top-0 z-10 bg-cream-50/95 backdrop-blur">
              <tr>
                <Th>QR / Booking</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th sortable active={sortBy === "expiry"} onClick={() => toggleSort("expiry")}>Expiry</Th>
                <Th sortable active={sortBy === "scan_count"} onClick={() => toggleSort("scan_count")}>Scans</Th>
                <Th sortable active={sortBy === "invalid_attempts"} onClick={() => toggleSort("invalid_attempts")}>Invalid</Th>
                <Th sortable active={sortBy === "download_count"} onClick={() => toggleSort("download_count")}>Downloads</Th>
                <Th sortable active={sortBy === "last_scan_time"} onClick={() => toggleSort("last_scan_time")}>Last Scan</Th>
                <Th sortable active={sortBy === "created_at"} onClick={() => toggleSort("created_at")}>Issued</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {listLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="h-10 animate-pulse rounded-lg bg-ink-900/5" /></td></tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <QrCode className="mx-auto mb-3 size-8 text-ink-900/15" />
                    <p className="text-ink-900/40">No QR codes match your filters.</p>
                    <p className="mt-1 text-xs text-ink-900/30">QRs are generated automatically when a booking payment succeeds.</p>
                  </td>
                </tr>
              ) : rows.map((r) => <QrRowItem key={r._id} r={r} onClick={() => setSelected(r._id)} />)}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/5 px-4 py-2.5 text-xs text-ink-900/45">
          <span>
            Showing {(res?.total ?? 0) === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, res?.total ?? 0)} of {res?.total ?? 0} QR codes
          </span>
          <div className="flex items-center gap-1.5">
            <PagerBtn disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="size-3.5" /></PagerBtn>
            {Array.from({ length: Math.min(pageCount, 7) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn("size-7 rounded-lg text-xs font-medium transition-colors",
                  i + 1 === page ? "bg-ink-900 text-cream-50" : "text-ink-900/50 hover:bg-ink-900/5")}
              >
                {i + 1}
              </button>
            ))}
            {pageCount > 7 && <span className="px-1">…</span>}
            <PagerBtn disabled={page >= pageCount} onClick={() => setPage(page + 1)}><ChevronRight className="size-3.5" /></PagerBtn>
          </div>
        </div>
      </div>

      <QrDetailDrawer qrId={selected} onClose={() => setSelected(null)} />
      <VerifyScannerModal open={showScanner} onClose={() => setShowScanner(false)} onOpenQr={(id) => { setShowScanner(false); setSelected(id); }} />
    </div>
  );
}

function QrRowItem({ r, onClick }: { r: QRRow; onClick: () => void }) {
  const v = badgeOf(QR_VERIFICATION_STYLE, r.verification_status);
  const countdown = expiryCountdown(r.expiry);
  const last = r.last_scan_result ? badgeOf(SCAN_RESULT_STYLE, r.last_scan_result) : null;
  return (
    <tr onClick={onClick} className="group cursor-pointer transition-colors hover:bg-cream-50/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {r.booking?.qr_code_url ? (
            <span className="relative">
              <img src={r.booking.qr_code_url} alt="" className="size-10 rounded-lg border border-ink-900/10 object-contain p-0.5" />
              <span className="absolute inset-0 grid place-items-center rounded-lg bg-ink-900/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="size-3.5 text-cream-50" />
              </span>
            </span>
          ) : (
            <span className="grid size-10 place-items-center rounded-lg bg-ink-900/5 text-ink-900/30"><QrCode className="size-4" /></span>
          )}
          <div>
            <p className="font-mono text-[12px] font-medium text-ink-900">{r.booking?.booking_reference ?? "—"}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-900/40">
              v{r.version}{r.history_count > 0 ? ` · ${r.history_count} regen` : ""}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {r.user?.profile_image?.url ? (
            <img src={r.user.profile_image.url} alt="" className="size-7 rounded-full object-cover" />
          ) : (
            <span className="grid size-7 place-items-center rounded-full bg-ink-900/5 text-[11px] font-medium text-ink-900/50">
              {(r.user?.name ?? "?").charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="max-w-[150px] truncate text-[13px] font-medium text-ink-900">{r.user?.name ?? "—"}</p>
            <p className="max-w-[150px] truncate text-[11px] text-ink-900/45">{r.user?.email ?? ""}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", v.bg, v.text)}>
          <span className={cn("size-1.5 rounded-full", v.dot)} /> {v.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className={cn("text-[12px]", countdown.expired ? "text-rose-600" : "text-ink-900/70")}>{countdown.label}</p>
        <p className="text-[10px] text-ink-900/35">{formatDate(r.expiry)}</p>
      </td>
      <td className="px-4 py-3 tabular-nums">
        <span className="text-ink-900">{r.scan_count}</span>
        {r.successful_scans > 0 && <span className="ml-1 text-[11px] text-emerald-600">✓{r.successful_scans}</span>}
        {r.failed_scans > 0 && <span className="ml-1 text-[11px] text-rose-500">✗{r.failed_scans}</span>}
      </td>
      <td className={cn("px-4 py-3 tabular-nums", r.invalid_attempts ? "font-semibold text-rose-600" : "text-ink-900/40")}>
        {r.invalid_attempts || "—"}
      </td>
      <td className="px-4 py-3 tabular-nums text-ink-900/60">{r.download_count || "—"}</td>
      <td className="px-4 py-3">
        {r.last_scan_time ? (
          <>
            <p className="flex items-center gap-1.5 text-[12px] text-ink-900/70">
              {last && <span className={cn("inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase", last.bg, last.text)}>{last.label}</span>}
              {relativeTime(r.last_scan_time)}
            </p>
            <p className="text-[10px] text-ink-900/35">{r.last_scan_device ?? ""}{r.last_scan_location ? ` · ${r.last_scan_location}` : ""}</p>
          </>
        ) : <span className="text-[12px] text-ink-900/30">Never</span>}
      </td>
      <td className="px-4 py-3">
        <p className="text-ink-900/60">{formatDate(r.created_at)}</p>
        <p className="text-[10px] text-ink-900/35">{relativeTime(r.created_at)}</p>
      </td>
    </tr>
  );
}

// ─── Verify scanner modal ────────────────────────────────────────────────
function VerifyScannerModal({ open, onClose, onOpenQr }: {
  open: boolean; onClose: () => void; onOpenQr: (id: string) => void;
}) {
  const [payload, setPayload] = useState("");
  const [result, setResult] = useState<QRVerifyResponse | null>(null);

  const m = useMutation({
    mutationFn: async () => {
      // best-effort device GPS — richer scan logs when the browser allows it
      const gps = await new Promise<{ latitude: number; longitude: number } | undefined>((resolve) => {
        if (!navigator.geolocation) return resolve(undefined);
        const t = setTimeout(() => resolve(undefined), 2500);
        navigator.geolocation.getCurrentPosition(
          (pos) => { clearTimeout(t); resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); },
          () => { clearTimeout(t); resolve(undefined); },
          { timeout: 2000 },
        );
      });
      return qrService.verify(payload.trim(), gps);
    },
    onSuccess: (r) => {
      setResult(r);
      if (r.verified) toast.success(`Verified — ${r.booking_reference} checked in`);
      else toast.error(`Scan failed: ${r.failure_reason ?? r.result}`);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  useEffect(() => { if (!open) { setPayload(""); setResult(null); } }, [open]);

  const rStyle = result ? badgeOf(SCAN_RESULT_STYLE, result.result) : null;

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
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-serif text-xl text-ink-900">Verify a QR</h4>
                <p className="mt-1 text-sm text-ink-900/55">
                  Paste the decoded QR payload or type a booking reference. Every attempt is logged immutably — device, IP, location and result.
                </p>
              </div>
              <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-900/5 text-ink-900/50 hover:text-ink-900">
                <X className="size-4" />
              </button>
            </div>

            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={3}
              placeholder='{"b_ref":"ULM-BKG-2026-…","v":1,…}  —  or just ULM-BKG-2026-00000001'
              className="mt-4 w-full rounded-xl border border-ink-900/10 bg-cream-50/60 px-3 py-2.5 font-mono text-xs outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40"
            />
            <button
              onClick={() => m.mutate()}
              disabled={!payload.trim() || m.isPending}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-cream-50 disabled:opacity-40"
            >
              <ScanLine className={cn("size-4", m.isPending && "animate-pulse")} />
              {m.isPending ? "Verifying…" : "Verify"}
            </button>

            <AnimatePresence>
              {result && rStyle && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={cn("mt-4 rounded-2xl border p-4", result.verified ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60")}
                >
                  <div className="flex items-center gap-3">
                    {result.verified
                      ? <ShieldCheck className="size-8 text-emerald-600" />
                      : <ShieldX className="size-8 text-rose-600" />}
                    <div className="flex-1">
                      <p className={cn("font-semibold", result.verified ? "text-emerald-800" : "text-rose-800")}>
                        {rStyle.label}{result.failure_reason ? ` — ${result.failure_reason}` : ""}
                      </p>
                      <p className="text-xs text-ink-900/55">
                        {result.booking_reference ?? "Unknown booking"} · {new Date(result.scanned_at + "Z").toLocaleTimeString("en-IN")}
                      </p>
                    </div>
                    {result.qr_id && (
                      <button onClick={() => onOpenQr(result.qr_id!)} className="rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-xs font-medium text-ink-900/70 hover:border-ink-900/30">
                        Open QR
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Th({ children, onClick, sortable, active }: { children: React.ReactNode; onClick?: () => void; sortable?: boolean; active?: boolean }) {
  return (
    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-ink-900/40">
      <button onClick={onClick} disabled={!sortable} className={cn("inline-flex items-center gap-1", sortable && "hover:text-ink-900", active && "text-ink-900")}>
        {children}
        {sortable && <ArrowUpDown className="size-3" />}
      </button>
    </th>
  );
}

function PagerBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="grid size-7 place-items-center rounded-lg text-ink-900/50 transition-colors hover:bg-ink-900/5 disabled:opacity-30">
      {children}
    </button>
  );
}
