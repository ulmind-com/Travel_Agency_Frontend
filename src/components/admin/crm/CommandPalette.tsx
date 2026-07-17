import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, X, User, ShieldCheck, CalendarCheck, CreditCard, FileText,
  Map, Ticket, QrCode, Clock, TrendingUp, CornerDownLeft, Loader2, Sparkles,
} from "lucide-react";

import { crmSearchQuery, crmSearchHistoryQuery, crmSuggestionsQuery } from "@/lib/queries";
import { searchService } from "@/services/crm.service";
import { cn } from "@/lib/utils";
import type { SearchEntityType, SearchResult } from "@/types/admin.crm";

const TYPE_META: Record<SearchEntityType, { label: string; icon: typeof User; color: string }> = {
  USER: { label: "Customers", icon: User, color: "text-sky-600 bg-sky-50" },
  ADMIN: { label: "Admins", icon: ShieldCheck, color: "text-violet-600 bg-violet-50" },
  BOOKING: { label: "Bookings", icon: CalendarCheck, color: "text-indigo-600 bg-indigo-50" },
  PAYMENT: { label: "Payments", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
  INVOICE: { label: "Invoices", icon: FileText, color: "text-teal-600 bg-teal-50" },
  PACKAGE: { label: "Packages", icon: Map, color: "text-amber-600 bg-amber-50" },
  COUPON: { label: "Coupons", icon: Ticket, color: "text-purple-600 bg-purple-50" },
  QR: { label: "QR Codes", icon: QrCode, color: "text-cyan-600 bg-cyan-50" },
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700", CONFIRMED: "bg-emerald-50 text-emerald-700",
  SUCCESS: "bg-emerald-50 text-emerald-700", SENT: "bg-emerald-50 text-emerald-700",
  GENERATED: "bg-sky-50 text-sky-700", PENDING: "bg-amber-50 text-amber-700",
  PENDING_PAYMENT: "bg-amber-50 text-amber-700", FAILED: "bg-rose-50 text-rose-700",
  CANCELLED: "bg-rose-50 text-rose-700", BLOCKED: "bg-rose-50 text-rose-700",
  SUSPENDED: "bg-orange-50 text-orange-700", REVOKED: "bg-rose-50 text-rose-700",
  EXPIRED: "bg-ink-900/5 text-ink-900/50", REFUNDED: "bg-purple-50 text-purple-700",
  INACTIVE: "bg-ink-900/5 text-ink-900/50",
};

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Header search trigger + global ⌘K / Ctrl+K enterprise command palette. */
export function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group hidden items-center gap-2 rounded-full border border-ink-900/10 bg-white/70 py-2 pl-4 pr-2 text-sm text-ink-900/45 shadow-sm backdrop-blur transition-colors hover:text-ink-900/70 sm:inline-flex"
        aria-label="Global search (Ctrl+K)"
      >
        <Search className="size-3.5" />
        <span className="text-[13px]">Search everything…</span>
        <kbd className="ml-2 rounded-md border border-ink-900/10 bg-cream-50 px-1.5 py-0.5 text-[10px] font-semibold text-ink-900/45">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-full border border-ink-900/10 bg-white/70 text-ink-900/60 shadow-sm backdrop-blur sm:hidden"
        aria-label="Global search"
      >
        <Search className="size-4" />
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [term, setTerm] = useState("");
  const [cursor, setCursor] = useState(0);
  const q = useDebounced(term.trim(), 250);

  const { data, isFetching } = useQuery({ ...crmSearchQuery(q), enabled: open && q.length >= 2 });
  const { data: history } = useQuery({ ...crmSearchHistoryQuery(), enabled: open });
  const { data: sugg } = useQuery({ ...crmSuggestionsQuery(q), enabled: open && q.length >= 2 });

  const results = useMemo(() => data?.results ?? [], [data]);
  const flat: (SearchResult | { historyTerm: string })[] = useMemo(() => {
    if (q.length >= 2) return results;
    return (history?.items ?? []).map((h) => ({ historyTerm: h }));
  }, [q, results, history]);

  useEffect(() => { setCursor(0); }, [q, open]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setTerm("");
  }, [open]);

  const openResult = (r: SearchResult) => {
    onClose();
    const [pathname, queryString] = r.link.split("?");
    navigate({
      to: pathname as never,
      search: (queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {}) as never,
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (!flat.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[cursor];
      if (!item) return;
      if ("historyTerm" in item) setTerm(item.historyTerm);
      else openResult(item);
    }
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  // Grouped rendering with a flat index for keyboard navigation
  let runningIdx = -1;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-ink-900/45 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog" aria-label="Global search"
            className="fixed left-1/2 top-[12vh] z-[70] w-[min(680px,92vw)] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/40 bg-white/85 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent" />
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-ink-900/[0.07] px-5 py-4">
              {isFetching ? <Loader2 className="size-4.5 animate-spin text-[color:var(--gold)]" />
                          : <Search className="size-4.5 text-ink-900/35" />}
              <input
                ref={inputRef}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search customers, bookings, payments, invoices, QR, coupons…"
                className="flex-1 bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-900/30"
              />
              {data?.fuzzy && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--gold)]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[color:var(--gold)]">
                  <Sparkles className="size-2.5" /> fuzzy
                </span>
              )}
              <button onClick={onClose} className="grid size-7 place-items-center rounded-full text-ink-900/40 hover:bg-ink-900/5">
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2.5" data-lenis-prevent="true">
              {q.length < 2 ? (
                <div>
                  {(history?.items?.length ?? 0) > 0 && (
                    <>
                      <div className="flex items-center justify-between px-3 pb-1 pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/35">Recent searches</p>
                        <button
                          onClick={async () => {
                            await searchService.clearHistory();
                            queryClient.invalidateQueries({ queryKey: ["admin", "crm", "search-history"] });
                          }}
                          className="text-[10px] font-medium text-ink-900/35 hover:text-ink-900/60"
                        >
                          Clear
                        </button>
                      </div>
                      {history!.items.map((h, i) => (
                        <button
                          key={h}
                          data-idx={i}
                          onClick={() => setTerm(h)}
                          className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] text-ink-900/70",
                            cursor === i ? "bg-ink-900/[0.05]" : "hover:bg-ink-900/[0.03]")}
                        >
                          <Clock className="size-3.5 text-ink-900/30" /> {h}
                        </button>
                      ))}
                    </>
                  )}
                  <div className="px-3 py-6 text-center text-xs text-ink-900/35">
                    Type at least 2 characters — search by name, email, phone, booking ref,
                    payment / Razorpay ID, invoice number, QR, destination, coupon…
                  </div>
                </div>
              ) : results.length === 0 && !isFetching ? (
                <div className="px-4 py-12 text-center">
                  <Search className="mx-auto mb-3 size-8 text-ink-900/10" />
                  <p className="font-serif text-lg text-ink-900/50">No matches for “{q}”</p>
                  {(sugg?.entities?.length ?? 0) > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {sugg!.entities.map((s) => (
                        <button key={s} onClick={() => setTerm(s)}
                          className="rounded-full bg-ink-900/5 px-2.5 py-1 text-[11px] text-ink-900/55 hover:bg-ink-900/10">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                Object.entries(data?.grouped ?? {}).map(([type, items]) => {
                  const meta = TYPE_META[type as SearchEntityType];
                  if (!meta || !items?.length) return null;
                  return (
                    <div key={type} className="mb-1">
                      <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/35">
                        {meta.label}
                      </p>
                      {items.map((r) => {
                        runningIdx += 1;
                        const idx = runningIdx;
                        const Icon = meta.icon;
                        return (
                          <button
                            key={`${r.type}-${r.id}`}
                            data-idx={idx}
                            onClick={() => openResult(r)}
                            onMouseEnter={() => setCursor(idx)}
                            className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                              cursor === idx ? "bg-ink-900/[0.05]" : "hover:bg-ink-900/[0.03]")}
                          >
                            {r.image ? (
                              <img src={r.image} alt="" className="size-8 shrink-0 rounded-full object-cover ring-1 ring-ink-900/10" />
                            ) : (
                              <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", meta.color)}>
                                <Icon className="size-4" />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline gap-2">
                                <span className="truncate text-[13px] font-semibold text-ink-900">{r.title}</span>
                                <span className="truncate text-[11px] text-ink-900/45">{r.subtitle}</span>
                              </span>
                              {r.preview && <span className="mt-0.5 block truncate text-[11px] text-ink-900/40">{r.preview}</span>}
                            </span>
                            {r.status && (
                              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                STATUS_COLOR[r.status] ?? "bg-ink-900/5 text-ink-900/50")}>
                                {r.status.replace(/_/g, " ")}
                              </span>
                            )}
                            {cursor === idx && <CornerDownLeft className="size-3.5 shrink-0 text-ink-900/30" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-ink-900/[0.06] px-5 py-2 text-[10px] text-ink-900/35">
              <span className="inline-flex items-center gap-1"><Kbd>↑↓</Kbd> navigate</span>
              <span className="inline-flex items-center gap-1"><Kbd>↵</Kbd> open</span>
              <span className="inline-flex items-center gap-1"><Kbd>Esc</Kbd> close</span>
              {data && <span className="ml-auto inline-flex items-center gap-1"><TrendingUp className="size-3" /> {data.total} results</span>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-ink-900/15 bg-white px-1 py-px font-sans text-[9px] font-semibold text-ink-900/50">
      {children}
    </kbd>
  );
}
