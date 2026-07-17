import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  X, CreditCard, ReceiptText, CalendarClock, CheckCircle2, RefreshCw, Undo2,
  Copy, Download, Mail, QrCode, Landmark, Webhook, History, User as UserIcon,
  MapPin, Ticket, ExternalLink, ShieldAlert, AtSign, Phone, Loader2, FileJson,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminPaymentDetailQuery, adminPaymentTimelineQuery, adminPaymentWebhooksQuery,
} from "@/lib/queries";
import { adminService } from "@/services/admin.service";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentDetailResponse, RefundRecord, WebhookLogRecord } from "@/types/admin.payments";
import {
  badge, PAYMENT_STATUS_STYLE, SETTLEMENT_STATUS_STYLE, REFUND_STATUS_STYLE,
  WEBHOOK_STATUS_STYLE, MODE_LABEL,
} from "./paymentBadges";
import { RefundModal, type RefundModalState } from "./RefundModal";

export type PaymentDrawerTab = "overview" | "gateway" | "refunds" | "webhooks" | "timeline";

async function downloadPdf(url: string, filename: string) {
  const { data } = await api.get(url, { responseType: "blob" });
  const href = URL.createObjectURL(data as Blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

function copyText(value: string | null | undefined, label: string) {
  if (!value) return toast.error(`No ${label} available`);
  navigator.clipboard.writeText(value).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Copy failed"),
  );
}

export function PaymentDetailsDrawer({
  paymentId, initialTab = "overview", onClose,
}: {
  paymentId: string | null;
  initialTab?: PaymentDrawerTab;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const [tab, setTab] = useState<PaymentDrawerTab>(initialTab);
  const [refundModal, setRefundModal] = useState<RefundModalState | null>(null);
  const { data, isLoading } = useQuery(adminPaymentDetailQuery(paymentId));

  useEffect(() => { if (paymentId) setTab(initialTab); }, [paymentId, initialTab]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "payments"] });
  };
  const onError = (e: any) => toast.error(e?.response?.data?.detail || "Action failed");

  const refundM = useMutation({
    mutationFn: (body: { action: "request" | "approve" | "reject"; amount?: number; reason?: string; refund_id?: string }) =>
      adminService.paymentRefundAction(paymentId!, body),
    onSuccess: (_, v) => {
      toast.success(v.action === "request" ? "Refund request raised" : v.action === "approve" ? "Refund processed via gateway" : "Refund request rejected");
      setRefundModal(null);
      invalidate();
    },
    onError,
  });
  const retryM = useMutation({
    mutationFn: () => adminService.retryPaymentWebhook(paymentId!),
    onSuccess: (r) => { toast.success(`Gateway re-synced · status: ${r.gateway_status}`); invalidate(); },
    onError,
  });
  const settleM = useMutation({
    mutationFn: () => adminService.settlePayment(paymentId!),
    onSuccess: (r) => { toast.success(`Marked settled · ${r.settlement_id}`); invalidate(); },
    onError,
  });
  const emailM = useMutation({
    mutationFn: () => adminService.resendEmail(d!.payment.booking_id as string),
    onSuccess: () => toast.success("Confirmation email resent"),
    onError,
  });

  const d = data as PaymentDetailResponse | undefined;
  const p = d?.payment;
  const cust = d?.customer;
  const booking = d?.booking;
  const coupon = d?.coupon;
  const refunds = d?.refunds ?? [];
  const gw = d?.gateway_response;

  const refundable = p ? (p.net_amount ?? p.amount ?? 0) - (p.refund_amount ?? 0) : 0;
  const openRequest = refunds.find((r) => r.status === "REQUESTED");
  const pStyle = badge(PAYMENT_STATUS_STYLE, p?.status);

  return (
    <>
    <AnimatePresence>
      {paymentId && (
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-900/40">Payment Details</p>
                  <h3 className="truncate font-serif text-2xl font-medium text-ink-900">{p?.payment_reference || "…"}</h3>
                </div>
                <button onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/60 transition-colors hover:text-ink-900">
                  <X className="size-4" />
                </button>
              </div>
              {p && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge s={pStyle} />
                  <Badge s={badge(SETTLEMENT_STATUS_STYLE, p.settlement_status)} />
                  <Badge s={badge(REFUND_STATUS_STYLE, p.refund_status)} />
                  <span className="ml-auto font-serif text-xl font-semibold text-ink-900">{formatCurrency(p.net_amount ?? p.amount ?? 0)}</span>
                </div>
              )}
              <div className="mt-4 flex gap-1 overflow-x-auto">
                {(["overview", "gateway", "refunds", "webhooks", "timeline"] as PaymentDrawerTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors",
                      tab === t ? "bg-ink-900 text-cream-50" : "text-ink-900/50 hover:bg-ink-900/5",
                    )}
                  >
                    {t === "refunds" && refunds.length ? `Refunds · ${refunds.length}` : t}
                  </button>
                ))}
              </div>
            </div>

            {isLoading || !p ? (
              <div className="space-y-4 p-6">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-ink-900/5" />)}
              </div>
            ) : (
              <div className="space-y-6 p-6">
                {tab === "overview" && (
                  <>
                    <Section title="Payment Summary">
                      <Grid>
                        <Field icon={CreditCard} label="Status" value={pStyle.label} />
                        <Field icon={CreditCard} label="Method" value={MODE_LABEL[p.mode ?? "UNKNOWN"] ?? p.mode ?? "—"} />
                        <Field icon={ReceiptText} label="Gateway" value={p.gateway || "RAZORPAY"} />
                        <Field icon={ReceiptText} label="Currency" value={p.currency || "INR"} />
                        <Field icon={CalendarClock} label="Initiated" value={formatDateTime(p.created_at)} />
                        <Field icon={CalendarClock} label="Paid At" value={p.payment_date ? formatDateTime(p.payment_date) : "—"} />
                        <Field icon={RefreshCw} label="Retry Count" value={String(p.retry_count ?? 0)} />
                        <Field icon={Webhook} label="Webhook" value={badge(WEBHOOK_STATUS_STYLE, p.webhook_status).label} />
                      </Grid>
                    </Section>

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
                          <Link
                            to="/account/admin/users/$id"
                            params={{ id: String(cust.id) }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-xs font-medium text-ink-900/70 transition-colors hover:border-ink-900/30 hover:text-ink-900"
                          >
                            <UserIcon className="size-3" /> View Customer
                          </Link>
                        </div>
                      </Section>
                    )}

                    {booking && (
                      <Section title="Booking & Package">
                        <div className="flex gap-4">
                          {p.package_thumbnail && <img src={p.package_thumbnail} alt="" className="size-16 rounded-xl object-cover ring-1 ring-ink-900/5" />}
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium text-ink-900">{p.package_title || "—"}</p>
                            <p className="flex items-center gap-1.5 text-sm text-ink-900/60"><MapPin className="size-3.5" />{p.destination || "—"}</p>
                            <p className="text-xs text-ink-900/45">
                              {p.booking_reference} · booked {formatDate(p.booking_created_at)} · travel {formatDate(p.travel_start_date)}
                            </p>
                          </div>
                        </div>
                        {(booking.travelers ?? []).length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {(booking.travelers as any[]).map((t, i) => (
                              <p key={i} className="text-xs text-ink-900/55">
                                <span className="font-medium text-ink-900/80">{t.name}</span> · {t.traveler_type}{t.phone ? ` · ${t.phone}` : ""}
                              </p>
                            ))}
                          </div>
                        )}
                      </Section>
                    )}

                    <Section title="Amount Breakdown">
                      <div className="rounded-xl border border-ink-900/8 bg-white p-4 text-sm">
                        <Row label="Subtotal" value={formatCurrency(p.amount ?? 0)} />
                        {(p.discount_amount ?? 0) > 0 && <Row label={`Discount${p.coupon_code ? ` (${p.coupon_code})` : ""}`} value={`− ${formatCurrency(p.discount_amount!)}`} accent="text-emerald-600" />}
                        {(p.gst_amount ?? 0) > 0 && <Row label="GST" value={formatCurrency(p.gst_amount!)} />}
                        {(p.tax_amount ?? 0) > 0 && <Row label="Tax" value={formatCurrency(p.tax_amount!)} />}
                        <div className="mt-2 border-t border-ink-900/10 pt-2">
                          <Row label="Net Paid" value={formatCurrency(p.net_amount ?? p.amount ?? 0)} bold />
                        </div>
                        {(p.refund_amount ?? 0) > 0 && <Row label="Refunded" value={`− ${formatCurrency(p.refund_amount!)}`} accent="text-purple-600" />}
                        {(p.gateway_fee ?? 0) > 0 && <Row label="Gateway Fee" value={formatCurrency(p.gateway_fee!)} accent="text-ink-900/50" />}
                        {(p.gateway_fee_gst ?? 0) > 0 && <Row label="GST on Fee" value={formatCurrency(p.gateway_fee_gst!)} accent="text-ink-900/50" />}
                      </div>
                    </Section>

                    {coupon && (
                      <Section title="Coupon">
                        <Grid>
                          <Field icon={Ticket} label="Code" value={coupon.code} />
                          <Field icon={Ticket} label="Type" value={coupon.discount_type} />
                          <Field icon={Ticket} label="Value" value={coupon.discount_type === "PERCENTAGE" ? `${coupon.discount_value}%` : formatCurrency(coupon.discount_value)} />
                          <Field icon={Ticket} label="Applied Discount" value={formatCurrency(p.discount_amount ?? 0)} />
                          <Field icon={UserIcon} label="Owner" value={coupon.owner_name || "—"} />
                          <Field icon={CalendarClock} label="Expiry" value={coupon.valid_until ? formatDate(coupon.valid_until) : "—"} />
                        </Grid>
                      </Section>
                    )}

                    <Section title="Settlement">
                      <Grid>
                        <Field icon={Landmark} label="Status" value={badge(SETTLEMENT_STATUS_STYLE, p.settlement_status).label} />
                        <Field icon={Landmark} label="Settlement ID" value={p.settlement_id || "—"} />
                        <Field icon={CalendarClock} label="Settled On" value={p.settlement_date ? formatDateTime(p.settlement_date) : "—"} />
                        <Field icon={CreditCard} label="Net Settlement" value={p.settlement_amount != null ? formatCurrency(p.settlement_amount) : "—"} />
                      </Grid>
                      {isSuperAdmin && p.settlement_status !== "SETTLED" && p.status === "SUCCESS" && (
                        <button
                          onClick={() => settleM.mutate()}
                          disabled={settleM.isPending}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-4 py-2 text-xs font-medium text-ink-900/70 transition-colors hover:border-ink-900/30 hover:text-ink-900 disabled:opacity-40"
                        >
                          {settleM.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Landmark className="size-3.5" />}
                          Mark Settled (manual)
                        </button>
                      )}
                    </Section>
                  </>
                )}

                {tab === "gateway" && (
                  <>
                    <Section title="Razorpay Identifiers">
                      <div className="space-y-2">
                        <CopyRow label="Order ID" value={p.razorpay_order_id} />
                        <CopyRow label="Payment ID" value={p.razorpay_payment_id} />
                        <CopyRow label="Transaction ID" value={p.transaction_id} />
                        <CopyRow label="Payment Reference" value={p.payment_reference} />
                      </div>
                    </Section>
                    <Section title="Gateway Metadata">
                      {!gw ? (
                        <p className="text-sm text-ink-900/40">No gateway response captured for this payment yet.</p>
                      ) : (
                        <>
                          <Grid>
                            <Field icon={CreditCard} label="Gateway Status" value={String(gw.status ?? "—")} />
                            {/* Older records store a trimmed gateway_response — fall back to the payment's own mode */}
                            <Field icon={CreditCard} label="Method" value={String(gw.method ?? (p.mode ? (MODE_LABEL[p.mode] ?? p.mode) : "—"))} />
                            <Field icon={CreditCard} label="Bank" value={String(gw.bank ?? "—")} />
                            <Field icon={CreditCard} label="Wallet" value={String(gw.wallet ?? "—")} />
                            <Field icon={CreditCard} label="UPI / VPA" value={String(gw.vpa ?? "—")} />
                            <Field icon={CreditCard} label="Card" value={gw.card ? `${(gw.card as any).network ?? ""} ${(gw.card as any).type ?? ""}`.trim() || "—" : "—"} />
                            <Field icon={CheckCircle2} label="Captured" value={gw.captured || gw.status === "captured" ? "Yes" : "No"} />
                            <Field icon={CreditCard} label="Fee / GST" value={gw.fee != null ? `${formatCurrency((gw.fee as number) / 100)} · ${formatCurrency(((gw.tax as number) ?? 0) / 100)}` : "—"} />
                          </Grid>
                          <details className="mt-4 group">
                            <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-ink-900/50 hover:text-ink-900">
                              <FileJson className="size-3.5" /> Raw gateway response
                            </summary>
                            <pre className="mt-2 max-h-72 overflow-auto rounded-xl border border-ink-900/8 bg-ink-900 p-3 text-[11px] leading-relaxed text-cream-50/90">
                              {JSON.stringify(gw, null, 2)}
                            </pre>
                          </details>
                        </>
                      )}
                    </Section>
                  </>
                )}

                {tab === "refunds" && (
                  <Section title={`Refund History (${refunds.length})`}>
                    {refunds.length === 0 ? (
                      <p className="text-sm text-ink-900/40">No refunds recorded for this payment.</p>
                    ) : (
                      <div className="space-y-3">
                        {refunds.map((r) => <RefundCard key={r.id} r={r} isSuperAdmin={isSuperAdmin}
                          onApprove={() => setRefundModal({ mode: "approve", refundable, refundId: r.id, requestedAmount: r.amount })}
                          onReject={() => setRefundModal({ mode: "reject", refundable, refundId: r.id })}
                        />)}
                      </div>
                    )}
                    {!openRequest && refundable > 0 && (p.status === "SUCCESS" || p.status === "PARTIALLY_REFUNDED") && (
                      <button
                        onClick={() => setRefundModal({ mode: "request", refundable })}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-xs font-medium text-cream-50 transition-opacity hover:opacity-90"
                      >
                        <Undo2 className="size-3.5" /> Request Refund
                      </button>
                    )}
                  </Section>
                )}

                {tab === "webhooks" && <WebhookCenter paymentId={paymentId} />}

                {tab === "timeline" && <PaymentTimeline paymentId={paymentId} />}

                {/* Quick Actions */}
                <Section title="Quick Actions">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <ActionBtn icon={Copy} label="Copy Payment ID" onClick={() => copyText(p.razorpay_payment_id, "Razorpay Payment ID")} />
                    <ActionBtn icon={Copy} label="Copy Txn ID" onClick={() => copyText(p.transaction_id, "Transaction ID")} />
                    <ActionBtn icon={Download} label="Invoice PDF" disabled={!p.booking_id}
                      onClick={() => downloadPdf(`/payments/${p.booking_id}/invoice`, `Invoice-${p.booking_reference || p.payment_reference}.pdf`).then(() => toast.success("Invoice downloaded")).catch(() => toast.error("Download failed"))} />
                    <ActionBtn icon={Download} label="Receipt / Ticket" disabled={!p.booking_id}
                      onClick={() => downloadPdf(`/payments/${p.booking_id}/ticket`, `Receipt-${p.booking_reference || p.payment_reference}.pdf`).then(() => toast.success("Receipt downloaded")).catch(() => toast.error("Download failed"))} />
                    <ActionBtn icon={QrCode} label="Download QR" disabled={!booking?.qr_code_url} onClick={() => window.open(booking!.qr_code_url, "_blank")} />
                    <ActionBtn icon={Mail} label="Resend Email" disabled={!p.booking_id} busy={emailM.isPending} onClick={() => emailM.mutate()} />
                    <ActionBtn icon={Undo2} label="Request Refund"
                      disabled={!!openRequest || refundable <= 0 || !(p.status === "SUCCESS" || p.status === "PARTIALLY_REFUNDED")}
                      onClick={() => setRefundModal({ mode: "request", refundable })} />
                    {isSuperAdmin && (
                      <ActionBtn icon={RefreshCw} label="Retry Webhook" busy={retryM.isPending} disabled={!p.razorpay_payment_id} onClick={() => retryM.mutate()} />
                    )}
                    {!isSuperAdmin && (
                      <div className="col-span-2 flex items-center gap-1.5 rounded-xl border border-dashed border-ink-900/10 px-3 py-2.5 text-[11px] text-ink-900/40 sm:col-span-1">
                        <ShieldAlert className="size-3.5 shrink-0" /> Approvals need Super Admin
                      </div>
                    )}
                  </div>
                </Section>

                {/* Audit history */}
                {d!.audit_history.length > 0 && (
                  <Section title="Audit History">
                    <div className="space-y-2">
                      {d!.audit_history.map((a: any) => (
                        <div key={a.id} className="rounded-xl border border-ink-900/8 bg-white p-3 text-xs">
                          <p className="font-medium text-ink-900">{String(a.action).replace(/_/g, " ")}</p>
                          <p className="text-ink-900/45">{formatDateTime(a.created_at)}{a.ip_address ? ` · IP ${a.ip_address}` : ""}</p>
                          {a.reason && <p className="mt-0.5 text-ink-900/55">“{a.reason}”</p>}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>

    <RefundModal
      state={refundModal}
      busy={refundM.isPending}
      onClose={() => setRefundModal(null)}
      onSubmit={(payload) => refundM.mutate(payload)}
    />
    </>
  );
}

function RefundCard({ r, isSuperAdmin, onApprove, onReject }: {
  r: RefundRecord; isSuperAdmin: boolean; onApprove: () => void; onReject: () => void;
}) {
  const s = badge(REFUND_STATUS_STYLE, r.status);
  return (
    <div className="rounded-xl border border-ink-900/8 bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
            {r.refund_reference}
            {r.is_partial && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-600">Partial</span>}
          </p>
          <p className="mt-0.5 text-xs text-ink-900/50">Requested {formatDateTime(r.requested_at)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-semibold text-ink-900 tabular-nums">{formatCurrency(r.amount)}</span>
          <Badge s={s} />
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-900/60">“{r.reason}”</p>
      {r.razorpay_refund_id && <p className="mt-1 text-[11px] text-ink-900/40">Gateway refund: {r.razorpay_refund_id}</p>}
      {r.rejection_reason && <p className="mt-1 text-[11px] text-red-600">Rejected: {r.rejection_reason}</p>}
      {r.failure_reason && <p className="mt-1 text-[11px] text-red-600">Failed: {r.failure_reason}</p>}
      {r.status === "REQUESTED" && isSuperAdmin && (
        <div className="mt-3 flex gap-2">
          <button onClick={onApprove} className="rounded-full bg-ink-900 px-4 py-1.5 text-xs font-medium text-cream-50 hover:opacity-90">Approve</button>
          <button onClick={onReject} className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Reject</button>
        </div>
      )}
      {r.status === "REQUESTED" && !isSuperAdmin && (
        <p className="mt-2 text-[11px] text-ink-900/40">Awaiting Super Admin approval.</p>
      )}
    </div>
  );
}

function WebhookCenter({ paymentId }: { paymentId: string }) {
  const { data: logs, isLoading } = useQuery(adminPaymentWebhooksQuery(paymentId));
  if (isLoading) return <p className="animate-pulse text-sm text-ink-900/40">Loading webhook deliveries…</p>;
  const list = (logs ?? []) as WebhookLogRecord[];
  return (
    <Section title={`Webhook Deliveries (${list.length})`}>
      {list.length === 0 ? (
        <p className="text-sm text-ink-900/40">No webhook deliveries recorded for this payment.</p>
      ) : (
        <div className="space-y-3">
          {list.map((w) => {
            const s = badge(WEBHOOK_STATUS_STYLE, w.processing_status);
            return (
              <div key={w.id} className="rounded-xl border border-ink-900/8 bg-white p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
                      <Webhook className="size-3.5 text-ink-900/35" />{w.event}
                      {w.is_manual_retry && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-600">Manual Retry #{w.retry_count}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-900/50">{formatDateTime(w.received_at)} · {w.payload_size} bytes · HTTP {w.response_code}</p>
                    <p className="text-[11px] text-ink-900/40">
                      Signature: {w.signature_valid === true ? "verified" : w.signature_valid === false ? "INVALID" : "not configured"}
                    </p>
                  </div>
                  <Badge s={s} />
                </div>
                {w.failure_reason && <p className="mt-2 text-xs text-red-600">{w.failure_reason}</p>}
                {w.payload && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-medium text-ink-900/45 hover:text-ink-900">Raw payload</summary>
                    <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-ink-900 p-2.5 text-[10px] leading-relaxed text-cream-50/90">{JSON.stringify(w.payload, null, 2)}</pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function PaymentTimeline({ paymentId }: { paymentId: string }) {
  const { data: events, isLoading } = useQuery(adminPaymentTimelineQuery(paymentId));
  if (isLoading) return <p className="animate-pulse text-sm text-ink-900/40">Loading timeline…</p>;
  if (!events || events.length === 0) return <p className="text-sm text-ink-900/40">No timeline events.</p>;
  return (
    <Section title="Payment Timeline">
      <ol className="relative space-y-4 border-l border-ink-900/10 pl-5">
        {events.map((e: any, i: number) => (
          <motion.li
            key={i}
            className="relative"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <span className={cn(
              "absolute -left-[27px] top-1 grid size-3.5 place-items-center rounded-full ring-4 ring-cream-50",
              e.icon === "audit" ? "bg-ink-900/30"
                : e.icon === "cancel" || e.icon === "warning" ? "bg-red-400"
                : e.icon === "refund" ? "bg-purple-400"
                : e.icon === "webhook" ? "bg-sky-400"
                : "bg-[color:var(--gold)]",
            )} />
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
              {e.icon === "audit" && <History className="size-3 text-ink-900/40" />}
              {e.label}
            </p>
            <p className="text-xs text-ink-900/45">{e.at ? formatDateTime(e.at) : "—"}{e.meta ? ` · ${e.meta}` : ""}</p>
            {(e.ip || e.browser) && (
              <p className="text-[10px] text-ink-900/35">
                {e.ip ? `IP ${e.ip}` : ""}{e.browser ? ` · ${String(e.browser).slice(0, 60)}` : ""}
              </p>
            )}
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
function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: string }) {
  return <div className="flex justify-between py-0.5"><span className={cn("text-ink-900/55", bold && "font-semibold text-ink-900")}>{label}</span><span className={cn("tabular-nums", bold ? "font-semibold text-ink-900" : "text-ink-900/80", accent)}>{value}</span></div>;
}
function CopyRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-900/8 bg-white px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-ink-900/40">{label}</p>
        <p className="truncate font-mono text-sm text-ink-900">{value || "—"}</p>
      </div>
      <button
        onClick={() => copyText(value, label)}
        disabled={!value}
        className="grid size-8 shrink-0 place-items-center rounded-lg border border-ink-900/10 text-ink-900/50 transition-colors hover:text-ink-900 disabled:opacity-30"
      >
        <Copy className="size-3.5" />
      </button>
    </div>
  );
}
function ActionBtn({ icon: Icon, label, onClick, disabled, busy }: { icon: any; label: string; onClick: () => void; disabled?: boolean; busy?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="flex items-center justify-center gap-1.5 rounded-xl border border-ink-900/10 bg-white px-2 py-2.5 text-[11px] font-medium text-ink-900/70 transition-colors hover:border-ink-900/25 hover:text-ink-900 disabled:opacity-40"
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />}
      {label}
    </button>
  );
}
