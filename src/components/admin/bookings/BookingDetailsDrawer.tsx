import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X, MapPin, CalendarClock, Hotel, Utensils, Bus, ShieldCheck, Plane,
  CreditCard, QrCode, FileText, Download, Mail, UserPlus, CalendarCog,
  Ban, RefreshCw, ReceiptText, Loader2, CheckCircle2, User as UserIcon,
  ExternalLink, Phone, AtSign, History,
} from "lucide-react";
import { toast } from "sonner";
import { adminBookingDetailQuery, adminBookingTimelineQuery } from "@/lib/queries";
import { adminService } from "@/services/admin.service";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  badge, BOOKING_STATUS_STYLE, PAYMENT_STATUS_STYLE, TRAVEL_STATUS_STYLE, MODE_LABEL,
} from "./bookingBadges";
import { BookingActionModal, type ActionModalConfig } from "./BookingActionModal";
import { AssignmentPanel } from "@/components/admin/operations/AssignmentPanel";

export type DrawerTab = "overview" | "payment" | "qr" | "staff" | "timeline";

async function downloadPdf(url: string, filename: string) {
  const { data } = await api.get(url, { responseType: "blob" });
  const href = URL.createObjectURL(data as Blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

export function BookingDetailsDrawer({
  bookingId, userId, initialTab = "overview", onClose,
}: {
  bookingId: string | null;
  userId: string;
  initialTab?: DrawerTab;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const [tab, setTab] = useState<DrawerTab>(initialTab);
  const [modal, setModal] = useState<ActionModalConfig | null>(null);
  const { data, isLoading } = useQuery(adminBookingDetailQuery(bookingId));

  // land on the requested tab each time a booking is opened
  useEffect(() => { if (bookingId) setTab(initialTab); }, [bookingId, initialTab]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "users", userId, "bookings"] });
    qc.invalidateQueries({ queryKey: ["admin", "bookings", bookingId] });
  };

  const onError = (e: any) => toast.error(e?.response?.data?.detail || "Action failed");
  const done = (msg: string) => () => { toast.success(msg); setModal(null); invalidate(); };

  const cancelM = useMutation({ mutationFn: (reason: string) => adminService.cancelBooking(bookingId!, reason), onSuccess: done("Booking cancelled"), onError });
  const managerM = useMutation({ mutationFn: (name: string) => adminService.assignManager(bookingId!, name), onSuccess: done("Tour manager assigned"), onError });
  const guideM = useMutation({ mutationFn: (name: string) => adminService.assignGuide(bookingId!, name), onSuccess: done("Guide assigned"), onError });
  const invoiceM = useMutation({ mutationFn: () => adminService.generateInvoice(bookingId!), onSuccess: done("Invoice generated"), onError });
  const emailM = useMutation({ mutationFn: () => adminService.resendEmail(bookingId!), onSuccess: done("Confirmation email resent"), onError });
  const qrM = useMutation({ mutationFn: () => adminService.regenerateQr(bookingId!), onSuccess: done("QR regenerated"), onError });
  const dateM = useMutation({
    mutationFn: (d: string) => adminService.updateBooking(bookingId!, { travel_start_date: new Date(d).toISOString() }),
    onSuccess: done("Travel date updated"), onError,
  });
  const anyBusy = cancelM.isPending || managerM.isPending || guideM.isPending || dateM.isPending;

  const b = data?.booking;
  const cust = data?.customer;
  const pay = data?.payment;
  const payments = data?.payments ?? [];
  const qr = data?.qr_tracking;
  const travelers = data?.travelers ?? [];
  const lead = travelers[0];

  const bStyle = badge(BOOKING_STATUS_STYLE, b?.status);

  return (
    <>
    <AnimatePresence>
      {bookingId && (
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-900/40">Booking Details</p>
                  <h3 className="truncate font-serif text-2xl font-medium text-ink-900">{b?.booking_reference || "…"}</h3>
                </div>
                <button onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/60 transition-colors hover:text-ink-900">
                  <X className="size-4" />
                </button>
              </div>
              {b && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge s={bStyle} />
                  <Badge s={badge(PAYMENT_STATUS_STYLE, b.payment_status)} />
                  <Badge s={badge(TRAVEL_STATUS_STYLE, b.travel_status)} />
                  <span className="ml-auto font-serif text-xl font-semibold text-ink-900">{formatCurrency(b.net_amount ?? b.total_amount ?? 0)}</span>
                </div>
              )}
              {/* Tabs */}
              <div className="mt-4 flex gap-1">
                {(["overview", "payment", "qr", "staff", "timeline"] as DrawerTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors",
                      tab === t ? "bg-ink-900 text-cream-50" : "text-ink-900/50 hover:bg-ink-900/5",
                    )}
                  >
                    {t === "qr" ? "QR & Invoice" : t}
                  </button>
                ))}
              </div>
            </div>

            {isLoading || !b ? (
              <div className="space-y-4 p-6">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-ink-900/5" />)}
              </div>
            ) : (
              <div className="space-y-6 p-6">
                {tab === "overview" && (
                  <>
                    {/* Package */}
                    <Section title="Package Information">
                      <div className="flex gap-4">
                        {b.package_thumbnail && (
                          <img src={b.package_thumbnail} alt="" className="size-20 rounded-xl object-cover ring-1 ring-ink-900/5" />
                        )}
                        <div className="space-y-1">
                          <p className="font-medium text-ink-900">{b.package_title}</p>
                          <p className="flex items-center gap-1.5 text-sm text-ink-900/60"><MapPin className="size-3.5" />{[b.destination, b.city, b.state, b.country].filter(Boolean).join(", ") || "—"}</p>
                          <p className="text-sm text-ink-900/60">{b.duration_days ? `${b.duration_days}D / ${b.duration_nights ?? 0}N` : "—"}</p>
                        </div>
                      </div>
                    </Section>

                    {/* Customer */}
                    {cust && (
                      <Section title="Customer">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 place-items-center rounded-full bg-ink-900/5 font-serif text-lg text-ink-900/60">{(cust.name || "?").slice(0, 1)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-ink-900">{cust.name}</p>
                            <p className="flex flex-wrap items-center gap-x-3 text-xs text-ink-900/50">
                              {cust.email && <span className="inline-flex items-center gap-1"><AtSign className="size-3" />{cust.email}</span>}
                              {cust.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{cust.phone}</span>}
                            </p>
                          </div>
                        </div>
                      </Section>
                    )}

                    {/* Schedule */}
                    <Section title="Travel Schedule">
                      <Grid>
                        <Field icon={Plane} label="Departure" value={formatDate(b.travel_start_date)} />
                        <Field icon={CalendarClock} label="Return" value={b.tour_end_date ? formatDate(b.tour_end_date) : "—"} />
                        <Field icon={MapPin} label="Pickup" value={b.pickup_point || "—"} />
                        <Field icon={MapPin} label="Drop" value={b.drop_point || "—"} />
                      </Grid>
                    </Section>

                    {/* Components */}
                    <Section title="Trip Components">
                      <Grid>
                        <Field icon={Hotel} label="Hotel" value={b.hotel_name || "—"} />
                        <Field icon={Hotel} label="Room" value={b.room_type ? `${b.room_type} × ${b.rooms_count ?? 1}` : "—"} />
                        <Field icon={Utensils} label="Meal Plan" value={b.meal_plan || "—"} />
                        <Field icon={Bus} label="Transport" value={b.transportation || "—"} />
                        <Field icon={UserIcon} label="Tour Manager" value={b.tour_manager || "Not assigned"} />
                        <Field icon={UserIcon} label="Guide" value={b.guide_assigned || "Not assigned"} />
                        <Field icon={ShieldCheck} label="Insurance" value={b.insurance_included ? "Included" : "—"} />
                        <Field icon={ShieldCheck} label="Visa" value={b.visa_included ? "Included" : "—"} />
                      </Grid>
                      {b.special_requests && <p className="mt-3 text-sm text-ink-900/60"><span className="font-medium text-ink-900">Special requests: </span>{b.special_requests}</p>}
                    </Section>

                    {/* Travellers */}
                    <Section title={`Travellers (${travelers.length})`}>
                      <div className="space-y-2">
                        {travelers.length === 0 && <p className="text-sm text-ink-900/40">No traveller records.</p>}
                        {travelers.map((t: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl border border-ink-900/8 bg-white p-3">
                            {t.photo?.url ? <img src={t.photo.url} className="size-9 rounded-full object-cover" /> : <div className="grid size-9 place-items-center rounded-full bg-ink-900/5 text-xs font-medium text-ink-900/50">{(t.name || "?").slice(0, 1)}</div>}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-ink-900">{t.name}{i === 0 && <span className="ml-2 rounded-full bg-[color:var(--gold)]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[color:var(--gold)]">Lead</span>}</p>
                              <p className="text-xs text-ink-900/50">{t.traveler_type}{t.phone ? ` · ${t.phone}` : ""}{t.email ? ` · ${t.email}` : ""}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {(lead?.phone || cust?.phone) && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-900/50">
                          <Phone className="size-3 text-ink-900/30" />
                          <span className="font-medium text-ink-900/70">Emergency contact:</span> {lead?.name || cust?.name} · {lead?.phone || cust?.phone}
                        </p>
                      )}
                    </Section>

                    {/* Pricing */}
                    <Section title="Pricing Breakdown">
                      <div className="rounded-xl border border-ink-900/8 bg-white p-4 text-sm">
                        <Row label="Base Amount" value={formatCurrency(b.total_amount ?? 0)} />
                        {(b.discount_amount ?? 0) > 0 && <Row label={`Discount${b.applied_promo_code ? ` (${b.applied_promo_code})` : ""}`} value={`− ${formatCurrency(b.discount_amount)}`} accent="text-emerald-600" />}
                        {(b.tax_amount ?? 0) > 0 && <Row label="Tax / GST" value={formatCurrency(b.tax_amount)} />}
                        {(b.refund_amount ?? 0) > 0 && <Row label="Refunded" value={`− ${formatCurrency(b.refund_amount)}`} accent="text-purple-600" />}
                        <div className="mt-2 border-t border-ink-900/10 pt-2">
                          <Row label="Final Amount" value={formatCurrency(b.net_amount ?? b.total_amount ?? 0)} bold />
                        </div>
                      </div>
                    </Section>
                  </>
                )}

                {tab === "payment" && (
                  <>
                    <Section title="Payment Details">
                      {!pay ? <p className="text-sm text-ink-900/40">No payment recorded.</p> : (
                        <Grid>
                          <Field icon={CreditCard} label="Status" value={badge(PAYMENT_STATUS_STYLE, pay.status).label} />
                          <Field icon={CreditCard} label="Method" value={MODE_LABEL[pay.mode] ?? pay.mode ?? "—"} />
                          <Field icon={ReceiptText} label="Payment Ref" value={pay.payment_reference || "—"} />
                          <Field icon={ReceiptText} label="Razorpay Payment ID" value={pay.razorpay_payment_id || "—"} />
                          <Field icon={ReceiptText} label="Order ID" value={pay.razorpay_order_id || "—"} />
                          <Field icon={ReceiptText} label="Transaction ID" value={pay.transaction_id || "—"} />
                          <Field icon={CreditCard} label="Gateway" value={pay.gateway || "RAZORPAY"} />
                          <Field icon={CreditCard} label="Currency" value={pay.currency || "INR"} />
                          <Field icon={CreditCard} label="Amount" value={formatCurrency(pay.amount ?? 0)} />
                          <Field icon={CreditCard} label="Discount" value={formatCurrency(pay.discount_amount ?? 0)} />
                          <Field icon={CreditCard} label="GST" value={formatCurrency(pay.gst_amount ?? 0)} />
                          <Field icon={CreditCard} label="Net Paid" value={formatCurrency(pay.net_amount ?? 0)} />
                          <Field icon={RefreshCw} label="Refund" value={formatCurrency(pay.refund_amount ?? 0)} />
                          <Field icon={CalendarClock} label="Paid At" value={pay.payment_date ? formatDateTime(pay.payment_date) : "—"} />
                          <Field icon={CheckCircle2} label="Webhook" value={pay.webhook_status || "—"} />
                          <Field icon={CheckCircle2} label="Settlement" value={pay.status === "SUCCESS" ? "Settled" : "Unsettled"} />
                        </Grid>
                      )}
                    </Section>
                    {payments.length > 1 && (
                      <Section title={`Payment History (${payments.length})`}>
                        <div className="space-y-2">
                          {payments.map((p: any) => {
                            const ps = badge(PAYMENT_STATUS_STYLE, p.status);
                            return (
                              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-900/8 bg-white p-3 text-sm">
                                <div className="min-w-0">
                                  <p className="font-medium text-ink-900">{p.payment_reference || p.razorpay_order_id}</p>
                                  <p className="text-xs text-ink-900/45">{formatDateTime(p.created_at)}{p.mode && p.mode !== "UNKNOWN" ? ` · ${MODE_LABEL[p.mode] ?? p.mode}` : ""}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="tabular-nums font-medium text-ink-900">{formatCurrency(p.net_amount || p.amount || 0)}</span>
                                  <Badge s={ps} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Section>
                    )}
                  </>
                )}

                {tab === "qr" && (
                  <>
                    <Section title="QR / Check-In">
                      <div className="flex gap-4">
                        {b.qr_code_url ? <img src={b.qr_code_url} alt="QR" className="size-28 rounded-xl border border-ink-900/10 bg-white p-1" /> : <div className="grid size-28 place-items-center rounded-xl border border-dashed border-ink-900/15 text-ink-900/30"><QrCode className="size-8" /></div>}
                        <div className="flex-1 space-y-1.5 text-sm">
                          <Field2 label="Status" value={b.is_checked_in ? "Checked In" : (b.qr_code_url ? "Active" : "Pending")} />
                          <Field2 label="Scan Count" value={String(qr?.scan_count ?? 0)} />
                          <Field2 label="Download Count" value={String(qr?.download_count ?? 0)} />
                          <Field2 label="Last Scan" value={qr?.last_scan_time ? formatDateTime(qr.last_scan_time) : "—"} />
                          <Field2 label="Last Scan Device" value={qr?.last_scan_device || "—"} />
                          <Field2 label="Last Scan Location" value={qr?.last_scan_location || "—"} />
                          <Field2 label="Generated" value={qr?.created_at ? formatDate(qr.created_at) : "—"} />
                          <Field2 label="Expiry" value={qr?.expiry ? formatDate(qr.expiry) : "—"} />
                        </div>
                      </div>
                    </Section>
                    <Section title="Invoice">
                      <Grid>
                        <Field icon={ReceiptText} label="Invoice No." value={b.invoice_number || "Not generated"} />
                        <Field icon={FileText} label="Status" value={b.invoice_status || "PENDING"} />
                        <Field icon={CalendarClock} label="Generated" value={b.invoice_generated_at ? formatDate(b.invoice_generated_at) : "—"} />
                      </Grid>
                      {b.invoice_pdf_url && (
                        <a
                          href={b.invoice_pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-xs font-medium text-ink-900/70 transition-colors hover:border-ink-900/30 hover:text-ink-900"
                        >
                          <ExternalLink className="size-3.5" /> Preview Invoice PDF
                        </a>
                      )}
                    </Section>
                  </>
                )}

                {tab === "staff" && bookingId && (
                  <div className="relative"><AssignmentPanel bookingId={bookingId} /></div>
                )}
                {tab === "timeline" && <BookingTimeline bookingId={bookingId} />}

                {/* Quick Actions */}
                <Section title="Quick Actions">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <ActionBtn icon={Download} label="Invoice PDF" onClick={() => downloadPdf(`/payments/${bookingId}/invoice`, `Invoice-${b.booking_reference}.pdf`).then(() => toast.success("Invoice downloaded")).catch(() => toast.error("Download failed"))} />
                    <ActionBtn icon={Download} label="Ticket PDF" onClick={() => downloadPdf(`/payments/${bookingId}/ticket`, `Ticket-${b.booking_reference}.pdf`).then(() => toast.success("Ticket downloaded")).catch(() => toast.error("Download failed"))} />
                    <ActionBtn icon={QrCode} label="Download QR" disabled={!b.qr_code_url} onClick={() => window.open(b.qr_code_url, "_blank")} />
                    <ActionBtn icon={ReceiptText} label="Generate Invoice" busy={invoiceM.isPending} onClick={() => invoiceM.mutate()} />
                    <ActionBtn icon={Mail} label="Resend Email" busy={emailM.isPending} onClick={() => emailM.mutate()} />
                    <ActionBtn
                      icon={CalendarCog} label="Change Date" busy={dateM.isPending}
                      onClick={() => setModal({
                        title: "Change Travel Date",
                        description: `Reschedule departure for ${b.booking_reference}. The customer should be notified separately.`,
                        input: "date", label: "New travel date",
                        initialValue: b.travel_start_date ? String(b.travel_start_date).slice(0, 10) : "",
                        confirmLabel: "Update Date",
                        onConfirm: (v) => dateM.mutate(v),
                      })}
                    />
                    <ActionBtn
                      icon={UserPlus} label="Assign Manager" busy={managerM.isPending}
                      onClick={() => setModal({
                        title: "Assign Tour Manager",
                        description: "The manager's name will appear on this booking's operational record.",
                        input: "text", label: "Manager name", placeholder: "e.g. Ravi Kumar",
                        initialValue: b.tour_manager || "",
                        confirmLabel: "Assign",
                        onConfirm: (v) => managerM.mutate(v),
                      })}
                    />
                    <ActionBtn
                      icon={UserPlus} label="Assign Guide" busy={guideM.isPending}
                      onClick={() => setModal({
                        title: "Assign Guide",
                        description: "Assign an on-ground guide for this trip.",
                        input: "text", label: "Guide name", placeholder: "e.g. Anita Sharma",
                        initialValue: b.guide_assigned || "",
                        confirmLabel: "Assign",
                        onConfirm: (v) => guideM.mutate(v),
                      })}
                    />
                    {isSuperAdmin && <ActionBtn icon={RefreshCw} label="Regenerate QR" busy={qrM.isPending} onClick={() => qrM.mutate()} />}
                    <ActionBtn
                      icon={Ban} label="Cancel Booking" danger
                      disabled={b.status === "CANCELLED"} busy={cancelM.isPending}
                      onClick={() => setModal({
                        title: "Cancel Booking",
                        description: `This will cancel ${b.booking_reference} and release its seats back to inventory. This action is audited.`,
                        input: "textarea", label: "Cancellation reason", placeholder: "Why is this booking being cancelled?",
                        confirmLabel: "Cancel Booking", danger: true,
                        onConfirm: (v) => cancelM.mutate(v),
                      })}
                    />
                  </div>
                </Section>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
    <BookingActionModal config={modal} busy={anyBusy} onClose={() => setModal(null)} />
    </>
  );
}

function BookingTimeline({ bookingId }: { bookingId: string }) {
  const { data: events, isLoading } = useQuery(adminBookingTimelineQuery(bookingId));
  if (isLoading) return <p className="animate-pulse text-sm text-ink-900/40">Loading timeline…</p>;
  if (!events || events.length === 0) return <p className="text-sm text-ink-900/40">No timeline events.</p>;
  return (
    <Section title="Booking Timeline">
      <ol className="relative space-y-4 border-l border-ink-900/10 pl-5">
        {events.map((e, i) => (
          <motion.li
            key={i}
            className="relative"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <span className={cn(
              "absolute -left-[27px] top-1 grid size-3.5 place-items-center rounded-full ring-4 ring-cream-50",
              e.icon === "audit" ? "bg-ink-900/30" : e.icon === "cancel" || e.icon === "warning" ? "bg-red-400" : "bg-[color:var(--gold)]",
            )} />
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
              {e.icon === "audit" && <History className="size-3 text-ink-900/40" />}
              {e.label}
            </p>
            <p className="text-xs text-ink-900/45">{e.at ? formatDateTime(e.at) : "—"}{e.meta ? ` · ${e.meta}` : ""}</p>
            {e.ip && <p className="text-[10px] text-ink-900/35">Admin action · IP {e.ip}</p>}
          </motion.li>
        ))}
      </ol>
    </Section>
  );
}

/* ── small presentational helpers ─────────────────────────────────────────── */
function Badge({ s }: { s: { bg: string; text: string; label: string } }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", s.bg, s.text)}>{s.label}</span>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-900/[0.07] bg-white/70 p-4 shadow-sm">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-900/40">{title}</p>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}
function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-ink-900/30" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-ink-900/40">{label}</p>
        <p className="truncate text-sm font-medium text-ink-900" title={value}>{value}</p>
      </div>
    </div>
  );
}
function Field2({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-ink-900/45">{label}</span><span className="truncate text-right font-medium text-ink-900" title={value}>{value}</span></div>;
}
function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: string }) {
  return <div className="flex justify-between py-0.5"><span className={cn("text-ink-900/55", bold && "font-semibold text-ink-900")}>{label}</span><span className={cn("tabular-nums", bold ? "font-semibold text-ink-900" : "text-ink-900/80", accent)}>{value}</span></div>;
}
function ActionBtn({ icon: Icon, label, onClick, danger, disabled, busy }: { icon: any; label: string; onClick: () => void; danger?: boolean; disabled?: boolean; busy?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[11px] font-medium transition-colors disabled:opacity-40",
        danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-ink-900/10 bg-white text-ink-900/70 hover:border-ink-900/25 hover:text-ink-900",
      )}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />}
      {label}
    </button>
  );
}
