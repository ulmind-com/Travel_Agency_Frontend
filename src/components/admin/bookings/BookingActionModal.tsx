import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionModalConfig {
  title: string;
  description?: string;
  /** Input kind. "none" renders a pure confirm dialog. */
  input?: "text" | "date" | "textarea" | "none";
  label?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  danger?: boolean;
  /** Called with the input value (empty string for "none"). */
  onConfirm: (value: string) => void;
}

/**
 * Premium confirm/input dialog used by the Booking Operations Center.
 * Replaces window.prompt with an on-brand, animated, keyboard-friendly modal.
 */
export function BookingActionModal({
  config,
  busy,
  onClose,
}: {
  config: ActionModalConfig | null;
  busy?: boolean;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (config) {
      setValue(config.initialValue ?? "");
      // focus after the enter animation starts
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [config]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (config) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [config, onClose]);

  const needsInput = config?.input && config.input !== "none";
  const canConfirm = !needsInput || value.trim().length > 0;

  const submit = () => {
    if (!config || busy || !canConfirm) return;
    config.onConfirm(needsInput ? value.trim() : "");
  };

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          key="booking-action-modal"
          className="fixed inset-0 z-[70] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-ink-900/10 bg-cream-50 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            {/* gold hairline */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent" />

            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div>
                <h4 className="font-serif text-xl font-medium text-ink-900">{config.title}</h4>
                {config.description && (
                  <p className="mt-1 text-sm leading-relaxed text-ink-900/55">{config.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="grid size-8 shrink-0 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/50 transition-colors hover:text-ink-900"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-4">
              {needsInput && (
                <div className="mb-5">
                  {config.label && (
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-ink-900/40">
                      {config.label}
                    </label>
                  )}
                  {config.input === "textarea" ? (
                    <textarea
                      ref={(el) => { inputRef.current = el; }}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={config.placeholder}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-ink-900/10 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow focus:ring-2 focus:ring-[color:var(--gold)]/40"
                    />
                  ) : (
                    <input
                      ref={(el) => { inputRef.current = el; }}
                      type={config.input === "date" ? "date" : "text"}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      placeholder={config.placeholder}
                      className="w-full rounded-xl border border-ink-900/10 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-shadow focus:ring-2 focus:ring-[color:var(--gold)]/40"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  disabled={busy}
                  className="rounded-full border border-ink-900/10 bg-white px-5 py-2.5 text-sm font-medium text-ink-900/60 transition-colors hover:text-ink-900 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={busy || !canConfirm}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-cream-50 transition-opacity disabled:opacity-40",
                    config.danger ? "bg-red-600 hover:bg-red-700" : "bg-ink-900 hover:opacity-90",
                  )}
                >
                  {busy && <Loader2 className="size-3.5 animate-spin" />}
                  {config.confirmLabel ?? "Confirm"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
