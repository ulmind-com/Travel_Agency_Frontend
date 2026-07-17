import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, SlidersHorizontal, ArrowUpDown, CreditCard, CalendarCheck, Users2,
  ChevronRight, ChevronLeft, MapPin, X, Columns3, Check, Clock3,
} from "lucide-react";
import { adminUserBookingsQuery } from "@/lib/queries";
import type { BookingRow } from "@/types/admin.bookings";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookingSummaryCards } from "./BookingSummaryCards";
import { BookingDetailsDrawer, type DrawerTab } from "./BookingDetailsDrawer";
import {
  badge, BOOKING_STATUS_STYLE, PAYMENT_STATUS_STYLE, TRAVEL_STATUS_STYLE,
  REFUND_STATUS_STYLE, INVOICE_STATUS_STYLE, QR_STATUS_STYLE, MODE_LABEL,
} from "./bookingBadges";

type SortKey = "created_at" | "travel_start_date" | "net_amount" | "booking_reference";

const PAGE_SIZE = 10;
const COLS_STORAGE_KEY = "ulmind:booking-intel:columns";

/** Optional columns the admin can toggle. Core columns are always shown. */
const OPTIONAL_COLUMNS = [
  { key: "booked", label: "Booked On" },
  { key: "pax", label: "Travellers" },
  { key: "duration", label: "Duration" },
  { key: "amount", label: "Base Amount" },
  { key: "discount", label: "Discount" },
  { key: "tax", label: "Tax / GST" },
  { key: "final", label: "Final Amount" },
  { key: "refund", label: "Refund" },
  { key: "invoice", label: "Invoice" },
  { key: "qr", label: "QR" },
  { key: "manager", label: "Tour Manager" },
] as const;
type ColKey = (typeof OPTIONAL_COLUMNS)[number]["key"];

const DEFAULT_COLS: Record<ColKey, boolean> = {
  booked: true, pax: true, duration: false, amount: false, discount: false,
  tax: false, final: true, refund: false, invoice: false, qr: false, manager: false,
};

function loadCols(): Record<ColKey, boolean> {
  try {
    const raw = localStorage.getItem(COLS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_COLS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_COLS;
}

const uniq = (arr: (string | null | undefined)[]) =>
  Array.from(new Set(arr.filter(Boolean) as string[])).sort();

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function BookingIntelligence({ userId }: { userId: string }) {
  const { data, isLoading, dataUpdatedAt, isFetching } = useQuery(adminUserBookingsQuery(userId));
  const [selected, setSelected] = useState<{ id: string; tab: DrawerTab } | null>(null);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [cols, setCols] = useState<Record<ColKey, boolean>>(loadCols);
  const colsRef = useRef<HTMLDivElement>(null);

  const [fPayment, setFPayment] = useState("ALL");
  const [fBooking, setFBooking] = useState("ALL");
  const [fTravel, setFTravel] = useState("ALL");
  const [fRefund, setFRefund] = useState("ALL");
  const [fDestination, setFDestination] = useState("ALL");
  const [fYear, setFYear] = useState("ALL");
  const [fMonth, setFMonth] = useState("ALL");
  const [bookedFrom, setBookedFrom] = useState("");
  const [bookedTo, setBookedTo] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const bookings: BookingRow[] = data?.bookings ?? [];

  // persist column choices
  useEffect(() => {
    try { localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify(cols)); } catch { /* ignore */ }
  }, [cols]);

  // close the column menu on outside click
  useEffect(() => {
    if (!showCols) return;
    const onClick = (e: MouseEvent) => {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setShowCols(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [showCols]);

  const destinations = useMemo(() => uniq(bookings.map((b) => b.destination)), [bookings]);
  const years = useMemo(
    () => uniq(bookings.map((b) => (b.travel_start_date ? new Date(b.travel_start_date).getFullYear().toString() : null))),
    [bookings],
  );

  const rows = useMemo(() => {
    let r = [...bookings];
    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter((b) =>
        [
          b.id, b.booking_reference, b.package_title, b.destination, b.payment_reference,
          b.razorpay_payment_id, b.invoice_number, b.city, b.country,
          b.qr_verification_token,
          ...(b.traveler_names ?? []),
        ].some((v: string | null | undefined) => v?.toLowerCase().includes(q)),
      );
    }
    if (fPayment !== "ALL") r = r.filter((b) => b.payment_status === fPayment);
    if (fBooking !== "ALL") r = r.filter((b) => b.status === fBooking);
    if (fTravel !== "ALL") r = r.filter((b) => b.travel_status === fTravel);
    if (fRefund !== "ALL") r = r.filter((b) => b.refund_status === fRefund);
    if (fDestination !== "ALL") r = r.filter((b) => b.destination === fDestination);
    if (fYear !== "ALL") r = r.filter((b) => b.travel_start_date && new Date(b.travel_start_date).getFullYear().toString() === fYear);
    if (fMonth !== "ALL") r = r.filter((b) => b.travel_start_date && new Date(b.travel_start_date).getMonth() === MONTHS.indexOf(fMonth));
    if (bookedFrom) r = r.filter((b) => b.created_at && new Date(b.created_at) >= new Date(bookedFrom));
    if (bookedTo) r = r.filter((b) => b.created_at && new Date(b.created_at) <= new Date(bookedTo + "T23:59:59"));
    if (minAmt) r = r.filter((b) => (b.net_amount ?? b.total_amount ?? 0) >= Number(minAmt));
    if (maxAmt) r = r.filter((b) => (b.net_amount ?? b.total_amount ?? 0) <= Number(maxAmt));

    r.sort((a, b) => {
      let av: any = a[sortKey], bv: any = b[sortKey];
      if (sortKey === "net_amount") { av = a.net_amount ?? a.total_amount ?? 0; bv = b.net_amount ?? b.total_amount ?? 0; }
      if (sortKey === "created_at" || sortKey === "travel_start_date") { av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [bookings, search, fPayment, fBooking, fTravel, fRefund, fDestination, fYear, fMonth, bookedFrom, bookedTo, minAmt, maxAmt, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // reset to first page when the filtered set shrinks below the current page
  useEffect(() => { if (page > pageCount - 1) setPage(0); }, [page, pageCount]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  const activeFilters =
    [fPayment, fBooking, fTravel, fRefund, fDestination, fYear, fMonth].filter((v) => v !== "ALL").length +
    (minAmt || maxAmt ? 1 : 0) + (bookedFrom || bookedTo ? 1 : 0);
  const resetFilters = () => {
    setFPayment("ALL"); setFBooking("ALL"); setFTravel("ALL"); setFRefund("ALL");
    setFDestination("ALL"); setFYear("ALL"); setFMonth("ALL");
    setBookedFrom(""); setBookedTo(""); setMinAmt(""); setMaxAmt(""); setPage(0);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-ink-900/5 animate-pulse" />)}
        </div>
        <div className="h-12 rounded-full bg-ink-900/5 animate-pulse" />
        <div className="h-96 rounded-3xl bg-ink-900/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl font-medium text-ink-900">Booking Intelligence</h3>
          <p className="text-sm text-ink-900/50">Live operational view of every reservation for this customer.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
          <span className={cn("relative flex size-2")}>
            <span className={cn("absolute inline-flex size-full rounded-full bg-emerald-400", isFetching && "animate-ping")} />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live · {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "—"}
        </div>
      </div>

      {data?.summary && <BookingSummaryCards summary={data.summary} />}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-900/40" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search booking ID, package, destination, traveller, payment ID, invoice, QR…"
            className="w-full pl-9 pr-4 py-2.5 rounded-full border border-ink-900/10 bg-white text-sm outline-none transition-shadow focus:ring-2 focus:ring-[color:var(--gold)]/40"
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
              <Columns3 className="size-4" />
              Columns
            </button>
            <AnimatePresence>
              {showCols && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-ink-900/10 bg-white p-1.5 shadow-xl"
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
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-ink-900/[0.07] bg-white/70 p-4 backdrop-blur">
              <Select label="Payment Status" value={fPayment} onChange={(v) => { setFPayment(v); setPage(0); }} options={["ALL", "SUCCESS", "PENDING", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]} />
              <Select label="Booking Status" value={fBooking} onChange={(v) => { setFBooking(v); setPage(0); }} options={["ALL", "CONFIRMED", "PENDING", "PENDING_PAYMENT", "CANCELLATION_REQUESTED", "CANCELLED", "REFUNDED"]} />
              <Select label="Travel Status" value={fTravel} onChange={(v) => { setFTravel(v); setPage(0); }} options={["ALL", "UPCOMING", "ON_TRIP", "COMPLETED", "AWAITING", "CANCELLED"]} />
              <Select label="Refund Status" value={fRefund} onChange={(v) => { setFRefund(v); setPage(0); }} options={["ALL", "NONE", "REQUESTED", "PROCESSED", "REFUNDED"]} />
              <Select label="Destination" value={fDestination} onChange={(v) => { setFDestination(v); setPage(0); }} options={["ALL", ...destinations]} />
              <Select label="Travel Year" value={fYear} onChange={(v) => { setFYear(v); setPage(0); }} options={["ALL", ...years]} />
              <Select label="Travel Month" value={fMonth} onChange={(v) => { setFMonth(v); setPage(0); }} options={["ALL", ...MONTHS]} />
              <div className="grid grid-cols-2 gap-2">
                <DateInput label="Booked From" value={bookedFrom} onChange={(v) => { setBookedFrom(v); setPage(0); }} />
                <DateInput label="Booked To" value={bookedTo} onChange={(v) => { setBookedTo(v); setPage(0); }} />
              </div>
              <NumInput label="Min Amount" value={minAmt} onChange={(v) => { setMinAmt(v); setPage(0); }} placeholder="0" />
              <NumInput label="Max Amount" value={maxAmt} onChange={(v) => { setMaxAmt(v); setPage(0); }} placeholder="∞" />
              <button onClick={resetFilters} className="col-span-2 self-end inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-900/60 transition-colors hover:border-ink-900/30 hover:text-ink-900">
                <X className="size-3.5" /> Reset all filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-3xl border border-ink-900/[0.08] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-cream-50/95 backdrop-blur">
              <tr>
                <Th onClick={() => toggleSort("booking_reference")} sortable active={sortKey === "booking_reference"}>Booking</Th>
                <Th>Destination</Th>
                <Th onClick={() => toggleSort("travel_start_date")} sortable active={sortKey === "travel_start_date"}>Travel</Th>
                {cols.booked && <Th onClick={() => toggleSort("created_at")} sortable active={sortKey === "created_at"}>Booked</Th>}
                {cols.pax && <Th>Pax</Th>}
                {cols.duration && <Th>Duration</Th>}
                {cols.amount && <Th>Base</Th>}
                {cols.discount && <Th>Discount</Th>}
                {cols.tax && <Th>Tax</Th>}
                {cols.final && <Th onClick={() => toggleSort("net_amount")} sortable active={sortKey === "net_amount"}>Amount</Th>}
                <Th>Payment</Th>
                <Th>Status</Th>
                {cols.refund && <Th>Refund</Th>}
                {cols.invoice && <Th>Invoice</Th>}
                {cols.qr && <Th>QR</Th>}
                <Th>Travel Status</Th>
                {cols.manager && <Th>Manager</Th>}
                <Th> </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={20} className="px-6 py-16 text-center">
                    <Clock3 className="mx-auto mb-3 size-8 text-ink-900/15" />
                    <p className="text-ink-900/40">No bookings match your filters.</p>
                  </td>
                </tr>
              ) : pageRows.map((b) => (
                <BookingRowItem
                  key={b.id}
                  b={b}
                  cols={cols}
                  onClick={() => setSelected({ id: b.id, tab: "overview" })}
                  onPaymentClick={() => setSelected({ id: b.id, tab: "payment" })}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer: pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/5 px-4 py-2.5 text-xs text-ink-900/45">
          <span>
            Showing {rows.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, rows.length)} of {rows.length}
            {rows.length !== bookings.length && ` (filtered from ${bookings.length})`}
          </span>
          <div className="flex items-center gap-1.5">
            <PagerBtn disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft className="size-3.5" /></PagerBtn>
            {Array.from({ length: pageCount }).slice(0, 7).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn("size-7 rounded-lg text-xs font-medium transition-colors",
                  i === safePage ? "bg-ink-900 text-cream-50" : "text-ink-900/50 hover:bg-ink-900/5")}
              >
                {i + 1}
              </button>
            ))}
            {pageCount > 7 && <span className="px-1">…</span>}
            <PagerBtn disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}><ChevronRight className="size-3.5" /></PagerBtn>
          </div>
        </div>
      </div>

      <BookingDetailsDrawer
        bookingId={selected?.id ?? null}
        initialTab={selected?.tab ?? "overview"}
        userId={userId}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function BookingRowItem({ b, cols, onClick, onPaymentClick }: {
  b: BookingRow;
  cols: Record<ColKey, boolean>;
  onClick: () => void;
  onPaymentClick: () => void;
}) {
  const pStyle = badge(PAYMENT_STATUS_STYLE, b.payment_status);
  const bStyle = badge(BOOKING_STATUS_STYLE, b.status);
  const tStyle = badge(TRAVEL_STATUS_STYLE, b.travel_status);
  const rStyle = badge(REFUND_STATUS_STYLE, b.refund_status);
  const iStyle = badge(INVOICE_STATUS_STYLE, b.invoice_status);
  const qStyle = badge(QR_STATUS_STYLE, b.qr_status);
  return (
    <tr onClick={onClick} className="group cursor-pointer transition-colors hover:bg-cream-50/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {b.package_thumbnail ? (
            <img src={b.package_thumbnail} alt="" className="size-9 rounded-lg object-cover shrink-0 ring-1 ring-ink-900/5" />
          ) : (
            <div className="grid size-9 place-items-center rounded-lg bg-ink-900/5 text-ink-900/30 shrink-0"><CalendarCheck className="size-4" /></div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-ink-900 text-[13px] truncate max-w-[180px]">{b.package_title || "—"}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-900/40">{b.booking_reference}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="flex items-center gap-1 text-ink-900/70"><MapPin className="size-3 text-ink-900/30" />{b.destination || "—"}</p>
        <p className="text-[11px] text-ink-900/40">{[b.city, b.country].filter(Boolean).join(", ") || "—"}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-ink-900/70">{formatDate(b.travel_start_date)}</p>
        {b.tour_end_date && <p className="text-[11px] text-ink-900/40">→ {formatDate(b.tour_end_date)}</p>}
      </td>
      {cols.booked && (
        <td className="px-4 py-3">
          <p className="text-ink-900/60">{formatDate(b.created_at)}</p>
          <p className="text-[11px] text-ink-900/35">{b.created_at ? new Date(b.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : ""}</p>
        </td>
      )}
      {cols.pax && <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-ink-900/70"><Users2 className="size-3 text-ink-900/30" />{b.travelers_count ?? "—"}</span></td>}
      {cols.duration && <td className="px-4 py-3 text-ink-900/60">{b.duration_days ? `${b.duration_days}D/${b.duration_nights ?? 0}N` : "—"}</td>}
      {cols.amount && <td className="px-4 py-3 tabular-nums text-ink-900/70">{formatCurrency(b.total_amount ?? 0)}</td>}
      {cols.discount && <td className="px-4 py-3 tabular-nums text-emerald-600">{(b.discount_amount ?? 0) > 0 ? `− ${formatCurrency(b.discount_amount!)}` : "—"}</td>}
      {cols.tax && <td className="px-4 py-3 tabular-nums text-ink-900/60">{(b.tax_amount ?? 0) > 0 ? formatCurrency(b.tax_amount!) : "—"}</td>}
      {cols.final && <td className="px-4 py-3 font-semibold text-ink-900 tabular-nums">{formatCurrency(b.net_amount ?? b.total_amount ?? 0)}</td>}
      <td className="px-4 py-3">
        <button
          onClick={(e) => { e.stopPropagation(); onPaymentClick(); }}
          className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-transform hover:scale-105", pStyle.bg, pStyle.text)}
          title="View payment details"
        >
          <CreditCard className="size-2.5" />{pStyle.label}
        </button>
        {b.payment_mode && b.payment_mode !== "UNKNOWN" && <p className="mt-0.5 text-[9px] uppercase tracking-wider text-ink-900/35">{MODE_LABEL[b.payment_mode] ?? b.payment_mode}</p>}
      </td>
      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", bStyle.bg, bStyle.text)}>{bStyle.label}</span></td>
      {cols.refund && <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", rStyle.bg, rStyle.text)}>{rStyle.label}</span></td>}
      {cols.invoice && <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", iStyle.bg, iStyle.text)}>{iStyle.label}</span></td>}
      {cols.qr && <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", qStyle.bg, qStyle.text)}>{qStyle.label}</span></td>}
      <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", tStyle.bg, tStyle.text)}>{tStyle.label}</span></td>
      {cols.manager && <td className="px-4 py-3 text-ink-900/60">{b.tour_manager || "—"}</td>}
      <td className="px-4 py-3 text-ink-900/25 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-900/60"><ChevronRight className="size-4" /></td>
    </tr>
  );
}

function Th({ children, onClick, sortable, active }: { children: React.ReactNode; onClick?: () => void; sortable?: boolean; active?: boolean }) {
  return (
    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-ink-900/40 text-[10px]">
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

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-ink-900/40">{label}</label>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-ink-900/10 bg-white px-2.5 py-2 text-sm outline-none" />
    </div>
  );
}

function NumInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-ink-900/40">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm outline-none" />
    </div>
  );
}
