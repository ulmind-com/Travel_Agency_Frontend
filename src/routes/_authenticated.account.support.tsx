import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, Headset, Loader2, LifeBuoy, Plus, RotateCcw, Send, Star,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { supportCustomerService } from "@/services/enterprise.service";
import type { TicketDetail, TicketRow } from "@/types/admin.enterprise";
import {
  Badge, EmptyState, GlassPanel, SkeletonRows, fmtDateTime, relativeTime,
} from "@/components/admin/enterprise/ui";
import { CATEGORY_LABEL, PRIORITY_STYLE, STATUS_STYLE } from "@/components/admin/support/supportBadges";

export const Route = createFileRoute("/_authenticated/account/support")({
  head: () => ({ meta: [{ title: "Support · Ulmind Travel" }] }),
  component: CustomerSupportPage,
});

function CustomerSupportPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["support", "tickets"],
    queryFn: () => supportCustomerService.list({ page: 1, page_size: 50 }),
  });

  const items = data?.items ?? [];

  if (openId) {
    return <TicketThread id={openId} onBack={() => setOpenId(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ink-900">Support</h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Talk to our concierge team — we reply fast and track every request to resolution.
          </p>
        </div>
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2.5 text-[12px] font-semibold text-cream-50 shadow-sm transition-transform hover:scale-[1.02]">
          <Plus className="size-3.5" /> New ticket
        </button>
      </div>

      <GlassPanel>
        {isLoading ? (
          <SkeletonRows count={4} />
        ) : items.length === 0 ? (
          <EmptyState icon={LifeBuoy} title="No support tickets yet"
            sub="Raise a ticket and our team will get back to you within the SLA." />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {items.map((t, i) => <CustomerTicketLine key={t.id} t={t} index={i} onOpen={() => setOpenId(t.id)} />)}
          </div>
        )}
      </GlassPanel>

      <NewTicketModal open={creating} onClose={() => setCreating(false)}
        onCreated={(id) => { setCreating(false); setOpenId(id); }} />
    </div>
  );
}

function CustomerTicketLine({ t, index, onOpen }: { t: TicketRow; index: number; onOpen: () => void }) {
  const st = STATUS_STYLE[t.status];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      onClick={onOpen}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-cream-50/70">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", st.bg)}>
        <Headset className={cn("size-4", st.text)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-ink-900">{t.subject}</span>
          {t.unread_for_customer > 0 && (
            <span className="grid min-w-4 shrink-0 place-items-center rounded-full bg-[color:var(--gold)] px-1 text-[9px] font-bold text-white">
              {t.unread_for_customer}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[11px] text-ink-900/45">
          {t.ticket_ref} · {CATEGORY_LABEL[t.category] ?? t.category} · updated {relativeTime(t.updated_at)}
        </span>
      </span>
      <Badge className={cn(st.bg, st.text)}>{st.label}</Badge>
    </motion.button>
  );
}

// ─── Thread view ─────────────────────────────────────────────────────────────
function TicketThread({ id, onBack }: { id: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: t, isLoading } = useQuery({
    queryKey: ["support", "ticket", id],
    queryFn: () => supportCustomerService.detail(id),
    refetchInterval: 20_000,
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [t?.messages.length]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["support"] });
  };

  const replyMutation = useMutation({
    mutationFn: () => supportCustomerService.reply(id, draft.trim()),
    onSuccess: () => { setDraft(""); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const rateMutation = useMutation({
    mutationFn: () => supportCustomerService.rate(id, rating, feedback.trim() || undefined),
    onSuccess: () => { toast.success("Thanks for your feedback!"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const reopenMutation = useMutation({
    mutationFn: () => supportCustomerService.reopen(id),
    onSuccess: () => { toast.success("Ticket reopened"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (isLoading || !t) {
    return (
      <div className="grid h-80 place-items-center">
        <Loader2 className="size-6 animate-spin text-ink-900/30" />
      </div>
    );
  }

  const st = STATUS_STYLE[t.status];
  const closedish = t.status === "RESOLVED" || t.status === "CLOSED";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack}
          className="inline-flex items-center gap-1 rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-[12px] text-ink-900/60 hover:text-ink-900">
          <ChevronLeft className="size-3.5" /> All tickets
        </button>
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl text-ink-900">{t.subject}</h3>
          <p className="text-[11px] text-ink-900/45">
            {t.ticket_ref} · opened {fmtDateTime(t.created_at)}
            {t.booking_reference ? ` · ${t.booking_reference}` : ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge className={cn(st.bg, st.text)}>{st.label}</Badge>
          <Badge className={cn(PRIORITY_STYLE[t.priority].bg, PRIORITY_STYLE[t.priority].text)}>
            {PRIORITY_STYLE[t.priority].label}
          </Badge>
          {closedish && (
            <button onClick={() => reopenMutation.mutate()}
              className="inline-flex items-center gap-1 rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-[11px] text-ink-900/60 hover:text-ink-900">
              <RotateCcw className="size-3" /> Reopen
            </button>
          )}
        </div>
      </div>

      <GlassPanel className="flex h-[60vh] flex-col">
        <div ref={scrollRef} data-lenis-prevent="true" className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {t.messages.map((m) => {
            const mine = m.sender_role === "CUSTOMER";
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm",
                  mine ? "rounded-tr-md bg-ink-900 text-cream-50"
                    : "rounded-tl-md border border-ink-900/[0.07] bg-white")}>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{m.body}</p>
                  <p className={cn("mt-1 text-[10px]", mine ? "text-cream-50/50" : "text-ink-900/35")}>
                    {mine ? "You" : m.sender_name ?? "Support"} · {relativeTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {t.status !== "CLOSED" ? (
          <div className="border-t border-ink-900/[0.07] bg-white/70 p-3 backdrop-blur">
            <div className="flex items-end gap-2">
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) replyMutation.mutate();
                }}
                rows={2} placeholder="Write a message… (⌘↵ to send)"
                className="flex-1 resize-none rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40" />
              <button disabled={!draft.trim() || replyMutation.isPending}
                onClick={() => replyMutation.mutate()}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-900 text-cream-50 shadow-sm disabled:opacity-30">
                {replyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-ink-900/[0.07] bg-white/60 px-5 py-3 text-center text-[12px] text-ink-900/45">
            This ticket is closed. Reopen it to continue the conversation.
          </div>
        )}
      </GlassPanel>

      {/* Rating */}
      {closedish && t.rating === null && (
        <GlassPanel className="p-5">
          <p className="font-serif text-lg text-ink-900">How did we do?</p>
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} onClick={() => setRating(i + 1)}>
                <Star className={cn("size-6 transition-colors",
                  i < rating ? "fill-amber-400 text-amber-400" : "text-ink-900/15 hover:text-amber-300")} />
              </button>
            ))}
          </div>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2}
            placeholder="Optional feedback…"
            className="mt-3 w-full resize-none rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
          <button disabled={rating === 0 || rateMutation.isPending}
            onClick={() => rateMutation.mutate()}
            className="mt-3 rounded-full bg-ink-900 px-5 py-2 text-[12px] font-semibold text-cream-50 disabled:opacity-30">
            Submit rating
          </button>
        </GlassPanel>
      )}
      {t.rating !== null && (
        <GlassPanel className="flex items-center gap-2 p-4">
          <span className="text-[12.5px] text-ink-900/55">You rated this ticket</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn("size-4",
              i < (t.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-ink-900/15")} />
          ))}
        </GlassPanel>
      )}
    </div>
  );
}

// ─── New ticket modal ────────────────────────────────────────────────────────
function NewTicketModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (id: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [priority, setPriority] = useState("MEDIUM");
  const [bookingId, setBookingId] = useState("");

  const { data: meta } = useQuery({
    queryKey: ["support", "meta"],
    queryFn: supportCustomerService.meta,
    enabled: open,
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => supportCustomerService.create({
      subject: subject.trim(), description: description.trim(),
      category, priority, booking_id: bookingId || null,
    }),
    onSuccess: (res) => {
      toast.success(`Ticket ${res.ticket_ref} created`);
      queryClient.invalidateQueries({ queryKey: ["support"] });
      setSubject(""); setDescription(""); setBookingId("");
      onCreated(res.id);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="fixed inset-x-4 top-[10vh] z-50 mx-auto max-w-lg rounded-3xl border border-ink-900/10 bg-cream-50 p-6 shadow-2xl">
            <h3 className="font-serif text-xl text-ink-900">Raise a support ticket</h3>
            <div className="mt-4 space-y-3">
              <input value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject — what do you need help with?"
                className="w-full rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                placeholder="Describe the issue in detail…"
                className="w-full resize-none rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40" />
              <div className="grid grid-cols-2 gap-2">
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="rounded-2xl border border-ink-900/10 bg-white px-3 py-2.5 text-[13px] outline-none">
                  {(meta?.categories ?? ["OTHER"]).map((c: string) => (
                    <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>
                  ))}
                </select>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="rounded-2xl border border-ink-900/10 bg-white px-3 py-2.5 text-[13px] outline-none">
                  {(meta?.priorities ?? ["MEDIUM"]).map((p: string) => (
                    <option key={p} value={p}>{p} priority</option>
                  ))}
                </select>
              </div>
              {(meta?.bookings?.length ?? 0) > 0 && (
                <select value={bookingId} onChange={(e) => setBookingId(e.target.value)}
                  className="w-full rounded-2xl border border-ink-900/10 bg-white px-3 py-2.5 text-[13px] outline-none">
                  <option value="">Not related to a booking</option>
                  {meta!.bookings.map((b: { id: string; reference: string; title: string | null }) => (
                    <option key={b.id} value={b.id}>{b.reference} — {b.title ?? "Trip"}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose}
                className="rounded-full border border-ink-900/10 px-4 py-2 text-[12px] text-ink-900/60">Cancel</button>
              <button
                disabled={subject.trim().length < 3 || description.trim().length < 3 || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-5 py-2 text-[12px] font-semibold text-cream-50 disabled:opacity-30">
                {createMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                Create ticket
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
