import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X, Undo2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export type RefundModalMode = "request" | "approve" | "reject";

export interface RefundModalState {
  mode: RefundModalMode;
  refundable: number;          // max refundable amount
  refundId?: string;           // for approve / reject
  requestedAmount?: number;    // shown when approving
}

/**
 * Premium dialog driving the refund approval workflow:
 * request (any admin) → approve / reject (super admin, gateway-backed).
 */
export function RefundModal({
  state, busy, onClose, onSubmit,
}: {
  state: RefundModalState | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: { action: RefundModalMode; amount?: number; reason?: string; refund_id?: string }) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (state) {
      setAmount(String(state.requestedAmount ?? state.refundable));
      setReason("");
    }
  }, [state]);

  const amt = Number(amount);
  const amountValid = state?.mode !== "request" || (amt > 0 && amt <= (state?.refundable ?? 0) + 0.01);
  const reasonValid = state?.mode === "approve" || reason.trim().length >= 5;
  const canSubmit = amountValid && reasonValid && !busy;

  const TITLES: Record<RefundModalMode, string> = {
    request: "Request Refund",
    approve: "Approve Refund",
    reject: "Reject Refund",
  };
  const DESCRIPTIONS: Record<RefundModalMode, string> = {
    request: "Raises a refund request for super-admin approval. The gateway is only charged after approval.",
    approve: "Executes the refund on Razorpay immediately. This cannot be undone.",
    reject: "Closes the open refund request without refunding. The reason is recorded in the audit log.",
  };

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          key="refund-modal"
          className="fixed inset-0 z-[70] grid place-items-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-ink-900/10 bg-cream-50 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            <div className={cn("absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent to-transparent",
              state.mode === "reject" ? "via-red-500" : "via-[color:var(--gold)]")} />

            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-purple-50 text-purple-600">
                  <Undo2 className="size-5" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-medium text-ink-900">{TITLES[state.mode]}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-ink-900/55">{DESCRIPTIONS[state.mode]}</p>
                </div>
              </div>
              <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/50 transition-colors hover:text-ink-900">
                <X className="size-3.5" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-4 space-y-4">
              {state.mode === "request" && (
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-ink-900/40">
                    Refund Amount · max {formatCurrency(state.refundable)}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={state.refundable}
                    min={1}
                    className="w-full rounded-xl border border-ink-900/10 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow focus:ring-2 focus:ring-[color:var(--gold)]/40"
                  />
                  {!amountValid && <p className="mt-1 text-xs text-red-600">Amount must be between ₹1 and {formatCurrency(state.refundable)}.</p>}
                  {amountValid && amt < state.refundable && (
                    <p className="mt-1 text-xs text-purple-600">Partial refund — {formatCurrency(state.refundable - amt)} stays captured.</p>
                  )}
                </div>
              )}

              {state.mode === "approve" && (
                <div className="rounded-xl border border-ink-900/8 bg-white p-3 text-sm">
                  <p className="text-ink-900/55">Amount to refund via Razorpay</p>
                  <p className="font-serif text-2xl font-semibold text-ink-900">{formatCurrency(state.requestedAmount ?? state.refundable)}</p>
                </div>
              )}

              {state.mode !== "approve" && (
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-ink-900/40">
                    {state.mode === "reject" ? "Rejection Reason" : "Refund Reason"}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why (recorded in the immutable audit log)…"
                    className="w-full resize-none rounded-xl border border-ink-900/10 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow focus:ring-2 focus:ring-[color:var(--gold)]/40"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={onClose} disabled={busy}
                  className="rounded-full border border-ink-900/10 bg-white px-5 py-2.5 text-sm font-medium text-ink-900/60 transition-colors hover:text-ink-900 disabled:opacity-40">
                  Cancel
                </button>
                <button
                  onClick={() => onSubmit({
                    action: state.mode,
                    amount: state.mode === "request" ? amt : undefined,
                    reason: reason.trim() || undefined,
                    refund_id: state.refundId,
                  })}
                  disabled={!canSubmit}
                  className={cn("inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-cream-50 transition-opacity disabled:opacity-40",
                    state.mode === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-ink-900 hover:opacity-90")}
                >
                  {busy && <Loader2 className="size-3.5 animate-spin" />}
                  {TITLES[state.mode]}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
