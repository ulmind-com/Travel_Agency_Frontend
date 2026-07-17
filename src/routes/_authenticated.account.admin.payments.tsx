import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, SlidersHorizontal, Columns3, Check, ArrowUpDown, ChevronLeft,
  ChevronRight, X, Download, FileJson, FileSpreadsheet, Printer, CreditCard,
  Landmark, Clock3, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { adminPaymentsDashboardQuery, adminPaymentsListQuery } from "@/lib/queries";
import { usePaymentsStream } from "@/hooks/useDashboardStream";
import { adminService } from "@/services/admin.service";
import type { PaymentListResponse, PaymentRow } from "@/types/admin.payments";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PaymentKpiCards } from "@/components/admin/payments/PaymentKpiCards";
import { PaymentDetailsDrawer, type PaymentDrawerTab } from "@/components/admin/payments/PaymentDetailsDrawer";
import {
  badge, PAYMENT_STATUS_STYLE, SETTLEMENT_STATUS_STYLE, REFUND_STATUS_STYLE,
  WEBHOOK_STATUS_STYLE, MODE_LABEL,
} from "@/components/admin/payments/paymentBadges";

export const Route = createFileRoute("/_authenticated/account/admin/payments")({
  component: PaymentCenterPage,
});

const PAGE_SIZE = 15;
const COLS_STORAGE_KEY = "ulmind:payment-center:columns";

const OPTIONAL_COLUMNS = [
  { key: "customer", label: "Customer" },
  { key: "package", label: "Package" },
  { key: "gateway_ids", label: "Gateway IDs" },
  { key: "mode", label: "Method" },
  { key: "amounts", label: "Subtotal / Discount / GST" },
  { key: "refund_amount", label: "Refund Amount" },
  { key: "coupon", label: "Coupon" },
  { key: "settlement", label: "Settlement" },
  { key: "refund", label: "Refund Status" },
  { key: "webhook", label: "Webhook" },
  { key: "dates", label: "Payment Date" },
] as const;
type ColKey = (typeof OPTIONAL_COLUMNS)[number]["key"];

const DEFAULT_COLS: Record<ColKey, boolean> = {
  customer: true, package: true, gateway_ids: false, mode: true, amounts: false,
  refund_amount: false, coupon: false, settlement: true, refund: true, webhook: false, dates: true,
};

function loadCols(): Record<ColKey, boolean> {
  try {
    const raw = localStorage.getItem(COLS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_COLS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_COLS;
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function PaymentCenterPage() {
  usePaymentsStream(); // SSE — live refresh on every payment mutation
  const [selected, setSelected] = useState<{ id: string; tab: PaymentDrawerTab } | null>(null);

  // ── server-side query state ────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim(), 350);
  const [fStatus, setFStatus] = useState("ALL");
  const [fMode, setFMode] = useState("ALL");
  const [fSettlement, setFSettlement] = useState("ALL");
  const [fRefund, setFRefund] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [coupon, setCoupon] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "payment_date" | "net_amount" | "status">("created_at");
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  const [page, setPage] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [cols, setCols] = useState<Record<ColKey, boolean>>(loadCols);
  const colsRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const params = useMemo(() => ({
    q, payment_status: fStatus, mode: fMode, settlement: fSettlement, refund: fRefund,
    date_from: dateFrom, date_to: dateTo, min_amount: minAmt, max_amount: maxAmt, coupon,
    sort_by: sortBy, sort_dir: sortDir, skip: page * PAGE_SIZE, limit: PAGE_SIZE,
  }), [q, fStatus, fMode, fSettlement, fRefund, dateFrom, dateTo, minAmt, maxAmt, coupon, sortBy, sortDir, page]);

  const { data: dashboard, isLoading: dashLoading, dataUpdatedAt, isFetching } = useQuery(adminPaymentsDashboardQuery());
  const { data: list, isLoading: listLoading } = useQuery(adminPaymentsListQuery(params));
  const res = list as PaymentListResponse | undefined;
  const rows = res?.items ?? [];
  const total = res?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    try { localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify(cols)); } catch { /* ignore */ }
  }, [cols]);

  // reset page whenever a filter changes
  useEffect(() => { setPage(0); }, [q, fStatus, fMode, fSettlement, fRefund, dateFrom, dateTo, minAmt, maxAmt, coupon]);

  // close menus on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setShowCols(false);
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const toggleSort = (k: typeof sortBy) => {
    if (sortBy === k) setSortDir((d) => (d === -1 ? 1 : -1));
    else { setSortBy(k); setSortDir(-1); }
  };

  const activeFilters =
    [fStatus, fMode, fSettlement, fRefund].filter((v) => v !== "ALL").length +
    (minAmt || maxAmt ? 1 : 0) + (dateFrom || dateTo ? 1 : 0) + (coupon ? 1 : 0);
  const resetFilters = () => {
    setFStatus("ALL"); setFMode("ALL"); setFSettlement("ALL"); setFRefund("ALL");
    setDateFrom(""); setDateTo(""); setMinAmt(""); setMaxAmt(""); setCoupon("");
  };

  const doExport = async (format: "csv" | "json") => {
    setShowExport(false);
    try {
      const blob = await adminService.exportPayments(format, params);
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `payments-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success(`Exported ${format.toUpperCase()} (filtered ledger)`);
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium text-ink-900">Payment Center</h2>
          <p className="mt-1 text-sm text-ink-900/60">Enterprise view of every transaction — revenue, settlements, refunds and webhooks.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
          <span className="relative flex size-2">
            <span className={cn("absolute inline-flex size-full rounded-full bg-emerald-400", isFetching && "animate-ping")} />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live · {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "—"}
        </div>
      </div>

      {/* KPI grid */}
      {dashLoading || !dashboard ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-900/5" />)}
        </div>
      ) : (
        <PaymentKpiCards d={dashboard} />
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-900/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment ID, order ID, customer, email, phone, booking, invoice, coupon, package…"
            className="w-full rounded-full border border-ink-900/10 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[color:var(--gold)]/40"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
              showFilters || activeFilters ? "border-ink-900 bg-ink-900 text-cream-50" : "border-ink-900/10 bg-white text-ink-900/70 hover:border-ink-900/30")}
          >
            <SlidersHorizontal className="size-4" />
            Filters{activeFilters ? ` · ${activeFilters}` : ""}
          </button>

          <div className="relative" ref={colsRef}>
            <button
              onClick={() => setShowCols((s) => !s)}
              className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                showCols ? "border-ink-900 bg-ink-900 text-cream-50" : "border-ink-900/10 bg-white text-ink-900/70 hover:border-ink-900/30")}
            >
              <Columns3 className="size-4" /> Columns
            </button>
            <AnimatePresence>
              {showCols && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-900/10 bg-white p-1.5 shadow-xl"
                >
                  {OPTIONAL_COLUMNS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setCols((prev) => ({ ...prev, [c.key]: !prev[c.key] }))}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-ink-900/70 transition-colors hover:bg-cream-50"
                    >
                      {c.label}
                      <span className={cn("grid size-4 place-items-center rounded border transition-colors",
                        cols[c.key] ? "border-ink-900 bg-ink-900 text-cream-50" : "border-ink-900/20")}>
                        {cols[c.key] && <Check className="size-3" />}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExport((s) => !s)}
              className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                showExport ? "border-ink-900 bg-ink-900 text-cream-50" : "border-ink-900/10 bg-white text-ink-900/70 hover:border-ink-900/30")}
            >
              <Download className="size-4" /> Export
            </button>
            <AnimatePresence>
              {showExport && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-ink-900/10 bg-white p-1.5 shadow-xl"
                >
                  <ExportItem icon={FileSpreadsheet} label="CSV / Excel" onClick={() => doExport("csv")} />
                  <ExportItem icon={FileJson} label="JSON" onClick={() => doExport("json")} />
                  <ExportItem icon={Printer} label="Print / PDF" onClick={() => { setShowExport(false); window.print(); }} />
                  <p className="px-3 py-1.5 text-[10px] text-ink-900/35">Exports respect the current filters.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-ink-900/[0.07] bg-white/70 p-4 backdrop-blur lg:grid-cols-4">
              <Select label="Payment Status" value={fStatus} onChange={setFStatus}
                options={["ALL", "SUCCESS", "PENDING", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]} />
              <Select label="Method" value={fMode} onChange={setFMode}
                options={["ALL", "UPI", "CARD", "NETBANKING", "WALLET", "EMI"]} />
              <Select label="Settlement" value={fSettlement} onChange={setFSettlement}
                options={["ALL", "PENDING", "SETTLED", "NOT_APPLICABLE"]} />
              <Select label="Refund" value={fRefund} onChange={setFRefund}
                options={["ALL", "REQUESTED", "PROCESSED", "NONE"]} />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-ink-900/40">From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 w-full rounded-lg border border-ink-900/10 bg-white px-2.5 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-ink-900/40">To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 w-full rounded-lg border border-ink-900/10 bg-white px-2.5 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-ink-900/40">Min Amount</label>
                <input type="number" value={minAmt} onChange={(e) => setMinAmt(e.target.value)} placeholder="0" className="mt-1 w-full rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-ink-900/40">Max Amount</label>
                <input type="number" value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} placeholder="∞" className="mt-1 w-full rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-ink-900/40">Coupon Code</label>
                <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="e.g. SUMMER25" className="mt-1 w-full rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm outline-none" />
              </div>
              <button onClick={resetFilters} className="col-span-2 inline-flex items-center justify-center gap-1.5 self-end rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-900/60 transition-colors hover:border-ink-900/30 hover:text-ink-900 lg:col-span-1">
                <X className="size-3.5" /> Reset all filters
              </button>
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
                <Th>Payment</Th>
                {cols.customer && <Th>Customer</Th>}
                {cols.package && <Th>Package</Th>}
                {cols.gateway_ids && <Th>Gateway IDs</Th>}
                {cols.mode && <Th>Method</Th>}
                {cols.amounts && <Th>Subtotal / Disc / GST</Th>}
                <Th onClick={() => toggleSort("net_amount")} sortable active={sortBy === "net_amount"}>Amount</Th>
                {cols.refund_amount && <Th>Refunded</Th>}
                {cols.coupon && <Th>Coupon</Th>}
                <Th onClick={() => toggleSort("status")} sortable active={sortBy === "status"}>Status</Th>
                {cols.settlement && <Th>Settlement</Th>}
                {cols.refund && <Th>Refund</Th>}
                {cols.webhook && <Th>Webhook</Th>}
                {cols.dates && <Th onClick={() => toggleSort("created_at")} sortable active={sortBy === "created_at"}>Date</Th>}
                <Th> </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {listLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={15} className="px-4 py-3"><div className="h-10 animate-pulse rounded-lg bg-ink-900/5" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-6 py-16 text-center">
                    <Clock3 className="mx-auto mb-3 size-8 text-ink-900/15" />
                    <p className="text-ink-900/40">No payments match your filters.</p>
                  </td>
                </tr>
              ) : rows.map((p) => (
                <PaymentRowItem
                  key={p.id}
                  p={p}
                  cols={cols}
                  onClick={() => setSelected({ id: p.id, tab: "overview" })}
                  onStatusClick={() => setSelected({ id: p.id, tab: "gateway" })}
                  onRefundClick={() => setSelected({ id: p.id, tab: "refunds" })}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/5 px-4 py-2.5 text-xs text-ink-900/45">
          <span>
            Showing {total === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} payments
          </span>
          <div className="flex items-center gap-1.5">
            <PagerBtn disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="size-3.5" /></PagerBtn>
            {Array.from({ length: Math.min(pageCount, 7) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn("size-7 rounded-lg text-xs font-medium transition-colors",
                  i === page ? "bg-ink-900 text-cream-50" : "text-ink-900/50 hover:bg-ink-900/5")}
              >
                {i + 1}
              </button>
            ))}
            {pageCount > 7 && <span className="px-1">…</span>}
            <PagerBtn disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}><ChevronRight className="size-3.5" /></PagerBtn>
          </div>
        </div>
      </div>

      <PaymentDetailsDrawer
        paymentId={selected?.id ?? null}
        initialTab={selected?.tab ?? "overview"}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function PaymentRowItem({ p, cols, onClick, onStatusClick, onRefundClick }: {
  p: PaymentRow;
  cols: Record<ColKey, boolean>;
  onClick: () => void;
  onStatusClick: () => void;
  onRefundClick: () => void;
}) {
  const s = badge(PAYMENT_STATUS_STYLE, p.status);
  const st = badge(SETTLEMENT_STATUS_STYLE, p.settlement_status);
  const rf = badge(REFUND_STATUS_STYLE, p.refund_status);
  const wh = badge(WEBHOOK_STATUS_STYLE, p.webhook_status === "NONE" ? "NONE" : (p.webhook_status?.includes("fail") ? "FAILED" : "PROCESSED"));
  return (
    <tr onClick={onClick} className="group cursor-pointer transition-colors hover:bg-cream-50/60">
      <td className="px-4 py-3">
        <p className="font-mono text-[12px] font-medium text-ink-900">{p.payment_reference}</p>
        <p className="text-[10px] uppercase tracking-wider text-ink-900/40">{p.booking_reference || "—"}</p>
      </td>
      {cols.customer && (
        <td className="px-4 py-3">
          <p className="text-[13px] font-medium text-ink-900">{p.customer_name || "—"}</p>
          <p className="max-w-[180px] truncate text-[11px] text-ink-900/45">{p.customer_email || "—"}</p>
        </td>
      )}
      {cols.package && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            {p.package_thumbnail && <img src={p.package_thumbnail} alt="" className="size-8 rounded-lg object-cover ring-1 ring-ink-900/5" />}
            <div className="min-w-0">
              <p className="max-w-[160px] truncate text-[13px] text-ink-900/80">{p.package_title || "—"}</p>
              <p className="text-[11px] text-ink-900/40">{p.destination || "—"}</p>
            </div>
          </div>
        </td>
      )}
      {cols.gateway_ids && (
        <td className="px-4 py-3">
          <p className="max-w-[170px] truncate font-mono text-[11px] text-ink-900/60">{p.razorpay_payment_id || "—"}</p>
          <p className="max-w-[170px] truncate font-mono text-[10px] text-ink-900/35">{p.razorpay_order_id || "—"}</p>
        </td>
      )}
      {cols.mode && <td className="px-4 py-3 text-ink-900/60">{MODE_LABEL[p.mode ?? "UNKNOWN"] ?? p.mode}</td>}
      {cols.amounts && (
        <td className="px-4 py-3 tabular-nums text-[12px] text-ink-900/60">
          {formatCurrency(p.amount ?? 0)}
          {(p.discount_amount ?? 0) > 0 && <span className="text-emerald-600"> −{formatCurrency(p.discount_amount!)}</span>}
          {(p.gst_amount ?? 0) > 0 && <span className="text-ink-900/40"> +{formatCurrency(p.gst_amount!)}</span>}
        </td>
      )}
      <td className="px-4 py-3 font-semibold tabular-nums text-ink-900">{formatCurrency(p.net_amount ?? p.amount ?? 0)}</td>
      {cols.refund_amount && <td className="px-4 py-3 tabular-nums text-purple-600">{(p.refund_amount ?? 0) > 0 ? `− ${formatCurrency(p.refund_amount!)}` : "—"}</td>}
      {cols.coupon && <td className="px-4 py-3 text-[11px] uppercase tracking-wide text-ink-900/60">{p.coupon_code || "—"}</td>}
      <td className="px-4 py-3">
        <button
          onClick={(e) => { e.stopPropagation(); onStatusClick(); }}
          className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-transform hover:scale-105", s.bg, s.text)}
          title="View gateway details"
        >
          <CreditCard className="size-2.5" />{s.label}
        </button>
      </td>
      {cols.settlement && (
        <td className="px-4 py-3">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", st.bg, st.text)}>
            <Landmark className="size-2.5" />{st.label}
          </span>
        </td>
      )}
      {cols.refund && (
        <td className="px-4 py-3">
          <button
            onClick={(e) => { e.stopPropagation(); onRefundClick(); }}
            className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-transform hover:scale-105", rf.bg, rf.text)}
            title="View refunds"
          >
            {rf.label}{(p.open_refund_requests ?? 0) > 0 ? ` · ${p.open_refund_requests}` : ""}
          </button>
        </td>
      )}
      {cols.webhook && <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", wh.bg, wh.text)}>{wh.label}</span></td>}
      {cols.dates && (
        <td className="px-4 py-3">
          <p className="text-ink-900/60">{formatDate(p.payment_date || p.created_at)}</p>
          <p className="text-[11px] text-ink-900/35">{(p.payment_date || p.created_at) ? new Date((p.payment_date || p.created_at)!).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : ""}</p>
        </td>
      )}
      <td className="px-4 py-3">
        <button
          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.razorpay_payment_id || p.payment_reference).then(() => toast.success("Payment ID copied")); }}
          className="grid size-7 place-items-center rounded-lg text-ink-900/25 transition-colors hover:bg-ink-900/5 hover:text-ink-900/70"
          title="Copy payment ID"
        >
          <Copy className="size-3.5" />
        </button>
      </td>
    </tr>
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

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-ink-900/40">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm outline-none">
        {options.map((o) => <option key={o} value={o}>{o === "ALL" ? "All" : o.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );
}

function ExportItem({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink-900/70 transition-colors hover:bg-cream-50">
      <Icon className="size-4 text-ink-900/40" /> {label}
    </button>
  );
}
