/**
 * Ticket 360° drawer — conversation, internal / private / call / meeting
 * notes, timeline, SLA panel, assignment, workflow actions, escalation.
 */
import { useMemo, useRef, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlarmClock, ArrowUpRight, CheckCircle2, ChevronDown, Clock, ExternalLink,
  Loader2, Lock, MessageSquare, NotebookPen, Phone, Send, ShieldAlert, Star,
  StickyNote, Timer, User2, Users2, Video,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { supportAdminService } from "@/services/enterprise.service";
import type { MessageType, TicketDetail, TicketMessage } from "@/types/admin.enterprise";
import {
  Badge, DrawerHeader, EmptyState, SectionTitle, SideDrawer, fmtDateTime,
  fmtMins, inr, relativeTime,
} from "@/components/admin/enterprise/ui";
import { CATEGORY_LABEL, PRIORITY_STYLE, SLA_STYLE, STATUS_STYLE } from "./supportBadges";

const NOTE_TABS: { id: MessageType; label: string; icon: typeof MessageSquare }[] = [
  { id: "MESSAGE", label: "Reply", icon: MessageSquare },
  { id: "INTERNAL_NOTE", label: "Internal", icon: StickyNote },
  { id: "PRIVATE_ADMIN_NOTE", label: "Private", icon: Lock },
  { id: "CALL_NOTE", label: "Call", icon: Phone },
  { id: "MEETING_NOTE", label: "Meeting", icon: Video },
];

const MSG_STYLE: Record<string, { border: string; label: string; icon: typeof MessageSquare }> = {
  INTERNAL_NOTE: { border: "border-amber-300/60 bg-amber-50/60", label: "Internal note", icon: StickyNote },
  PRIVATE_ADMIN_NOTE: { border: "border-rose-300/60 bg-rose-50/50", label: "Private note", icon: Lock },
  CALL_NOTE: { border: "border-sky-300/60 bg-sky-50/60", label: "Call note", icon: Phone },
  VOICE_CALL_LOG: { border: "border-sky-300/60 bg-sky-50/60", label: "Voice call log", icon: Phone },
  MEETING_NOTE: { border: "border-violet-300/60 bg-violet-50/60", label: "Meeting note", icon: Video },
  SYSTEM: { border: "border-ink-900/10 bg-ink-900/[0.03]", label: "System", icon: Clock },
};

export function TicketDrawer({ ticketId, onClose }: { ticketId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"conversation" | "timeline" | "sla">("conversation");
  const [noteType, setNoteType] = useState<MessageType>("MESSAGE");
  const [draft, setDraft] = useState("");
  const [setWaiting, setSetWaiting] = useState(false);
  const [callDuration, setCallDuration] = useState("");
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: t, isLoading } = useQuery({
    queryKey: ["admin", "support", "detail", ticketId],
    queryFn: () => supportAdminService.detail(ticketId!),
    enabled: !!ticketId,
  });
  const { data: meta } = useQuery({
    queryKey: ["admin", "support", "meta"],
    queryFn: supportAdminService.meta,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    // Keep the thread pinned to the newest message
    if (tab === "conversation" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [t?.messages.length, tab]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "support"] });
  };

  const sendMutation = useMutation({
    mutationFn: () => supportAdminService.sendMessage(ticketId!, {
      body: draft.trim(),
      type: noteType,
      set_waiting: noteType === "MESSAGE" ? setWaiting : undefined,
      call_meta: (noteType === "CALL_NOTE" && callDuration)
        ? { duration_seconds: Number(callDuration) * 60 } : undefined,
    }),
    onSuccess: () => {
      setDraft(""); setCallDuration("");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => supportAdminService.setStatus(ticketId!, status),
    onSuccess: (_, status) => { toast.success(`Ticket → ${status.replaceAll("_", " ")}`); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const assignMutation = useMutation({
    mutationFn: (v: { assigned_to: string | null; assigned_team?: string }) =>
      supportAdminService.assign(ticketId!, v.assigned_to, v.assigned_team),
    onSuccess: () => { toast.success("Assignment updated"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const escalateMutation = useMutation({
    mutationFn: () => supportAdminService.escalate(ticketId!, escalateReason.trim()),
    onSuccess: () => {
      toast.success("Ticket escalated");
      setEscalateOpen(false); setEscalateReason("");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const nextStatuses = useMemo(() => {
    if (!t) return [];
    const flow: Record<string, string[]> = {
      OPEN: ["PENDING", "WAITING_FOR_CUSTOMER", "RESOLVED"],
      PENDING: ["WAITING_FOR_CUSTOMER", "RESOLVED"],
      WAITING_FOR_CUSTOMER: ["PENDING", "RESOLVED"],
      ESCALATED: ["PENDING", "RESOLVED"],
      RESOLVED: ["CLOSED", "OPEN"],
      CLOSED: [],
    };
    return flow[t.status] ?? [];
  }, [t]);

  return (
    <SideDrawer open={!!ticketId} onClose={onClose} width="max-w-3xl">
      {isLoading || !t ? (
        <div className="grid flex-1 place-items-center">
          <Loader2 className="size-6 animate-spin text-ink-900/30" />
        </div>
      ) : (
        <>
          <DrawerHeader
            onClose={onClose}
            title={<span className="flex items-center gap-2">{t.subject}
              {t.escalation_count > 0 && <ShieldAlert className="size-4 shrink-0 text-rose-500" />}</span>}
            sub={<span className="flex flex-wrap items-center gap-2">
              <span className="font-mono">{t.ticket_ref}</span>
              <Badge className={cn(STATUS_STYLE[t.status].bg, STATUS_STYLE[t.status].text)}>
                <span className={cn("size-1.5 rounded-full", STATUS_STYLE[t.status].dot)} />
                {STATUS_STYLE[t.status].label}
              </Badge>
              <Badge className={cn(PRIORITY_STYLE[t.priority].bg, PRIORITY_STYLE[t.priority].text)}>
                {PRIORITY_STYLE[t.priority].label}
              </Badge>
              <span>{CATEGORY_LABEL[t.category] ?? t.category}</span>
              {t.booking_reference && (
                <span className="font-mono text-[10px]">{t.booking_reference}</span>
              )}
            </span>}
          >
            {t.status !== "CLOSED" && t.status !== "RESOLVED" && (
              <button onClick={() => setEscalateOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-100">
                <ArrowUpRight className="size-3" /> Escalate
              </button>
            )}
            {nextStatuses.length > 0 && (
              <div className="relative">
                <select
                  value=""
                  onChange={(e) => e.target.value && statusMutation.mutate(e.target.value)}
                  className="appearance-none rounded-full border border-ink-900/10 bg-white py-1.5 pl-3 pr-7 text-[11px] font-semibold text-ink-900/70 outline-none">
                  <option value="" disabled>Move to…</option>
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-ink-900/40" />
              </div>
            )}
          </DrawerHeader>

          {/* Customer strip + assignment */}
          <div className="flex flex-wrap items-center gap-3 border-b border-ink-900/[0.06] bg-white/50 px-6 py-3">
            {t.customer && (
              <Link to="/account/admin/users/$id" params={{ id: t.customer.id }}
                className="group flex items-center gap-2.5">
                {t.customer.profile_image ? (
                  <img src={t.customer.profile_image} alt=""
                    className="size-8 rounded-full object-cover ring-1 ring-ink-900/10" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-ink-900/5 font-serif text-sm text-ink-900/50">
                    {t.customer.name?.charAt(0)}
                  </span>
                )}
                <span>
                  <span className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-900 group-hover:underline">
                    {t.customer.name} <ExternalLink className="size-2.5 text-ink-900/30" />
                  </span>
                  <span className="block text-[10.5px] text-ink-900/40">
                    {t.customer.booking_count} bookings · {inr(t.customer.lifetime_spending)} lifetime
                  </span>
                </span>
              </Link>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Users2 className="size-3.5 text-ink-900/35" />
              <select
                value={t.assigned_to ?? ""}
                onChange={(e) => assignMutation.mutate({
                  assigned_to: e.target.value || null,
                  assigned_team: t.assigned_team ?? undefined,
                })}
                className="rounded-full border border-ink-900/10 bg-white py-1.5 pl-3 pr-6 text-[11px] outline-none">
                <option value="">Unassigned</option>
                {meta?.executives.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <select
                value={t.assigned_team ?? ""}
                onChange={(e) => assignMutation.mutate({
                  assigned_to: t.assigned_to, assigned_team: e.target.value || undefined,
                })}
                className="rounded-full border border-ink-900/10 bg-white py-1.5 pl-3 pr-6 text-[11px] outline-none">
                <option value="">No team</option>
                {meta?.teams.map((team) => <option key={team} value={team}>{team}</option>)}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-ink-900/[0.06] bg-white/40 px-6 pt-2">
            {([["conversation", "Conversation"], ["timeline", "Timeline"], ["sla", "SLA & History"]] as const)
              .map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)}
                  className={cn("rounded-t-xl px-4 py-2 text-[12px] font-medium transition-colors",
                    tab === id ? "border border-b-0 border-ink-900/[0.08] bg-cream-50 text-ink-900"
                      : "text-ink-900/45 hover:text-ink-900")}>
                  {label}
                  {id === "conversation" && <span className="ml-1 text-[10px] text-ink-900/35">({t.messages.length})</span>}
                </button>
              ))}
          </div>

          {/* Body */}
          {tab === "conversation" && (
            <>
              <div ref={scrollRef} data-lenis-prevent="true" className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
                {t.messages.length === 0 ? (
                  <EmptyState title="No messages yet" />
                ) : t.messages.map((m) => <MessageBubble key={m.id} m={m} />)}
              </div>

              {/* Composer */}
              <div className="border-t border-ink-900/[0.07] bg-white/70 px-6 py-3 backdrop-blur">
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  {NOTE_TABS.map((n) => (
                    <button key={n.id} onClick={() => setNoteType(n.id)}
                      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-colors",
                        noteType === n.id ? "bg-ink-900 text-cream-50" : "bg-ink-900/5 text-ink-900/50 hover:text-ink-900")}>
                      <n.icon className="size-3" /> {n.label}
                    </button>
                  ))}
                  {noteType === "MESSAGE" && (
                    <label className="ml-auto flex items-center gap-1.5 text-[10.5px] text-ink-900/50">
                      <input type="checkbox" checked={setWaiting} onChange={(e) => setSetWaiting(e.target.checked)}
                        className="size-3 accent-ink-900" />
                      Set “Waiting for customer”
                    </label>
                  )}
                  {noteType === "CALL_NOTE" && (
                    <input value={callDuration} onChange={(e) => setCallDuration(e.target.value.replace(/\D/g, ""))}
                      placeholder="Call mins"
                      className="ml-auto w-20 rounded-full border border-ink-900/10 bg-white px-3 py-1 text-[10.5px] outline-none" />
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) sendMutation.mutate();
                    }}
                    rows={2}
                    placeholder={noteType === "MESSAGE" ? "Reply to the customer… (⌘↵ to send)" : "Add a note… (⌘↵ to save)"}
                    className={cn("flex-1 resize-none rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40",
                      noteType === "MESSAGE" ? "border-ink-900/10" : "border-amber-300/50 bg-amber-50/40")}
                  />
                  <button
                    disabled={!draft.trim() || sendMutation.isPending}
                    onClick={() => sendMutation.mutate()}
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-900 text-cream-50 shadow-sm transition-transform hover:scale-105 disabled:opacity-30">
                    {sendMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === "timeline" && (
            <div data-lenis-prevent="true" className="flex-1 overflow-y-auto px-6 py-4">
              <ol className="relative ml-3 space-y-4 border-l border-ink-900/10 pl-5">
                {[...t.timeline].reverse().map((ev, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }} className="relative">
                    <span className="absolute -left-[26px] top-1 size-2.5 rounded-full border-2 border-cream-50 bg-ink-900/60" />
                    <p className="text-[12.5px] font-medium text-ink-900">{ev.description}</p>
                    <p className="mt-0.5 text-[10.5px] text-ink-900/40">
                      {ev.actor_name ? `${ev.actor_name} · ` : ""}{fmtDateTime(ev.at)}
                    </p>
                  </motion.li>
                ))}
              </ol>
            </div>
          )}

          {tab === "sla" && (
            <div data-lenis-prevent="true" className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
              <div>
                <SectionTitle>Service level agreement</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SlaCard icon={Timer} label="First response" leg={t.sla.first_response}
                    actual={fmtMins(t.sla.first_response_minutes)} />
                  <SlaCard icon={AlarmClock} label="Resolution" leg={t.sla.resolution}
                    actual={fmtMins(t.sla.resolution_minutes)} />
                </div>
              </div>

              {t.rating !== null && (
                <div>
                  <SectionTitle>Customer rating</SectionTitle>
                  <div className="rounded-2xl border border-ink-900/[0.08] bg-white/70 p-4">
                    <span className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("size-4",
                          i < (t.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-ink-900/15")} />
                      ))}
                      <span className="ml-2 text-sm font-semibold text-ink-900">{t.rating}/5</span>
                    </span>
                    {t.feedback && <p className="mt-2 text-[12.5px] italic text-ink-900/60">“{t.feedback}”</p>}
                  </div>
                </div>
              )}

              {t.escalations.length > 0 && (
                <div>
                  <SectionTitle>Escalation history</SectionTitle>
                  <div className="space-y-2">
                    {t.escalations.map((e, i) => (
                      <div key={i} className="rounded-2xl border border-rose-200/60 bg-rose-50/40 p-3.5">
                        <p className="text-[12px] font-semibold text-rose-700">
                          {e.from_priority} → {e.to_priority}
                        </p>
                        <p className="mt-0.5 text-[12px] text-ink-900/60">{e.reason}</p>
                        <p className="mt-1 text-[10.5px] text-ink-900/40">
                          {e.escalated_by_name} · {fmtDateTime(e.at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {t.reopens.length > 0 && (
                <div>
                  <SectionTitle>Reopen history</SectionTitle>
                  <div className="space-y-2">
                    {t.reopens.map((r, i) => (
                      <div key={i} className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-3.5">
                        <p className="text-[12px] text-ink-900/70">
                          Reopened from <b>{r.previous_status}</b>
                          {r.reason ? ` — ${r.reason}` : ""}
                        </p>
                        <p className="mt-1 text-[10.5px] text-ink-900/40">
                          {r.reopened_by_name} · {fmtDateTime(r.at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Escalate modal */}
          {escalateOpen && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-ink-900/30 p-6 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-3xl border border-ink-900/10 bg-cream-50 p-6 shadow-2xl">
                <h4 className="font-serif text-lg text-ink-900">Escalate {t.ticket_ref}</h4>
                <p className="mt-1 text-[12px] text-ink-900/50">
                  Raises priority ({t.priority} → next tier), tightens the SLA and alerts every admin.
                </p>
                <textarea value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)}
                  rows={3} placeholder="Reason for escalation (required)…"
                  className="mt-3 w-full resize-none rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300/50" />
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setEscalateOpen(false)}
                    className="rounded-full border border-ink-900/10 px-4 py-2 text-[12px] text-ink-900/60">
                    Cancel
                  </button>
                  <button
                    disabled={escalateReason.trim().length < 3 || escalateMutation.isPending}
                    onClick={() => escalateMutation.mutate()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40">
                    {escalateMutation.isPending && <Loader2 className="size-3 animate-spin" />}
                    Escalate ticket
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </SideDrawer>
  );
}

function MessageBubble({ m }: { m: TicketMessage }) {
  const isCustomer = m.sender_role === "CUSTOMER";
  const special = MSG_STYLE[m.type];

  if (special) {
    const Icon = special.icon;
    return (
      <div className={cn("mx-auto w-full max-w-xl rounded-2xl border px-4 py-2.5", special.border)}>
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-900/45">
          <Icon className="size-3" /> {special.label}
          {m.call_meta?.duration_seconds ? (
            <span className="font-normal normal-case">· {Math.round(Number(m.call_meta.duration_seconds) / 60)} min</span>
          ) : null}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-[13px] text-ink-900/75">{m.body}</p>
        <p className="mt-1 text-[10px] text-ink-900/35">{m.sender_name} · {relativeTime(m.created_at)}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2.5", isCustomer ? "justify-start" : "justify-end")}>
      {isCustomer && (
        m.sender_image
          ? <img src={m.sender_image} alt="" className="size-7 shrink-0 rounded-full object-cover ring-1 ring-ink-900/10" />
          : <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink-900/5 text-[11px] font-serif text-ink-900/50">
              {m.sender_name?.charAt(0) ?? <User2 className="size-3" />}
            </span>
      )}
      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
        isCustomer ? "rounded-tl-md border border-ink-900/[0.07] bg-white" : "rounded-tr-md bg-ink-900 text-cream-50")}>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{m.body}</p>
        <p className={cn("mt-1 text-[10px]", isCustomer ? "text-ink-900/35" : "text-cream-50/50")}>
          {m.sender_name} · {relativeTime(m.created_at)}
        </p>
      </div>
    </div>
  );
}

function SlaCard({ icon: Icon, label, leg, actual }: {
  icon: typeof Timer; label: string; leg: TicketDetail["sla"]["first_response"]; actual: string;
}) {
  const style = SLA_STYLE[leg.status];
  return (
    <div className="rounded-2xl border border-ink-900/[0.08] bg-white/70 p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-900/40">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className={cn("mt-1.5 flex items-center gap-1.5 font-serif text-xl", style.text)}>
        {leg.status === "MET" && <CheckCircle2 className="size-4" />}
        {style.label}
      </p>
      <p className="mt-1 text-[11px] text-ink-900/45">
        {leg.completed_at
          ? `Done in ${actual}`
          : leg.due
            ? `Due ${fmtDateTime(leg.due)}${leg.minutes_remaining !== undefined ? ` · ${fmtMins(leg.minutes_remaining)} left` : ""}`
            : "No target set"}
      </p>
    </div>
  );
}
