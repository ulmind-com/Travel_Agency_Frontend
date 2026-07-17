import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlarmClockOff, ArrowUpDown, Download, Headset, Inbox, MessageSquareText,
  Search, Star, Ticket, Timer, TrendingUp,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { supportAdminService } from "@/services/enterprise.service";
import type { TicketPriority, TicketRow, TicketStatus } from "@/types/admin.enterprise";
import {
  Badge, EmptyState, GlassPanel, Pagination, PillTabs, SkeletonRows, StatCard,
  fmtMins, parseUtc, relativeTime,
} from "@/components/admin/enterprise/ui";
import { TicketDrawer } from "@/components/admin/support/TicketDrawer";
import { CATEGORY_LABEL, PRIORITY_STYLE, STATUS_STYLE } from "@/components/admin/support/supportBadges";

export const Route = createFileRoute("/_authenticated/account/admin/support")({
  component: SupportCenterPage,
});

type BoardTab = "active" | "waiting" | "breached" | "resolved" | "all";

const BOARD_TABS: { id: BoardTab; label: string; icon?: typeof Inbox }[] = [
  { id: "active", label: "Active", icon: Inbox },
  { id: "waiting", label: "Waiting", icon: Timer },
  { id: "breached", label: "SLA Breached", icon: AlarmClockOff },
  { id: "resolved", label: "Resolved" },
  { id: "all", label: "All" },
];

function SupportCenterPage() {
  const [tab, setTab] = useState<BoardTab>("active");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [sortDesc, setSortDesc] = useState(true);
  const [openTicket, setOpenTicket] = useState<string | null>(null);

  const { data: summary } = useQuery({
    queryKey: ["admin", "support", "summary"],
    queryFn: supportAdminService.summary,
    refetchInterval: 60_000,
  });
  const { data: meta } = useQuery({
    queryKey: ["admin", "support", "meta"],
    queryFn: supportAdminService.meta,
    staleTime: 5 * 60_000,
  });

  const params = useMemo(() => {
    const p: Record<string, unknown> = {
      page, page_size: 20,
      sort: "updated_at", order: sortDesc ? "desc" : "asc",
    };
    if (search.trim()) p.q = search.trim();
    if (priority) p.priority = priority;
    if (category) p.category = category;
    if (tab === "active") p.status = "OPEN,PENDING,ESCALATED";
    else if (tab === "waiting") p.status = "WAITING_FOR_CUSTOMER";
    else if (tab === "breached") p.sla = "breached";
    else if (tab === "resolved") p.status = "RESOLVED,CLOSED";
    return p;
  }, [tab, search, priority, category, page, sortDesc]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "support", "tickets", params],
    queryFn: () => supportAdminService.list(params),
    placeholderData: keepPreviousData,
  });

  const exportCsv = async () => {
    const res = await api.get(supportAdminService.exportUrl({}), { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = "support-tickets.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const s = summary;
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ink-900">Support Center</h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Enterprise ticket operations — conversations, SLA tracking, escalations and CSAT.
          </p>
        </div>
        <button onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-white px-3.5 py-2 text-[12px] font-medium text-ink-900/65 shadow-sm hover:text-ink-900">
          <Download className="size-3.5" /> Export CSV
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Ticket} label="Open Queue" value={s ? String(s.open_total) : "—"}
          sub={s ? `${s.created_today} new today` : undefined} />
        <StatCard icon={Headset} label="Resolved Today" value={s ? String(s.resolved_today) : "—"} tone="ok" />
        <StatCard icon={Timer} label="Avg First Response" value={s ? fmtMins(s.avg_first_response_minutes) : "—"} />
        <StatCard icon={TrendingUp} label="Avg Resolution" value={s ? fmtMins(s.avg_resolution_minutes) : "—"} />
        <StatCard icon={AlarmClockOff} label="SLA Breaches"
          value={s ? String(s.sla_breached_first_response + s.sla_breached_resolution) : "—"}
          tone={s && (s.sla_breached_first_response + s.sla_breached_resolution) > 0 ? "alert" : undefined} />
        <StatCard icon={Star} label="CSAT"
          value={s?.avg_rating ? `${s.avg_rating}/5` : "—"}
          sub={s ? `${s.rating_count} ratings` : undefined} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <PillTabs tabs={BOARD_TABS.map((t) => ({
          ...t,
          badge: t.id === "breached"
            ? (s ? s.sla_breached_first_response + s.sla_breached_resolution : 0) : 0,
        }))} active={tab} onChange={(t) => { setTab(t); setPage(1); }} />

        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-900/35" />
          <input value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search ref, subject, customer…"
            className="w-56 rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40" />
        </div>
        <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-[12px] text-ink-900/65 outline-none">
          <option value="">All priorities</option>
          {meta?.priorities.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-[12px] text-ink-900/65 outline-none">
          <option value="">All categories</option>
          {meta?.categories.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>)}
        </select>
        <button onClick={() => setSortDesc(!sortDesc)}
          className="inline-flex items-center gap-1 rounded-full border border-ink-900/10 bg-white px-3 py-2 text-[12px] text-ink-900/65">
          <ArrowUpDown className="size-3" /> {sortDesc ? "Newest" : "Oldest"}
        </button>
      </div>

      {/* Board */}
      <GlassPanel>
        {isLoading ? (
          <SkeletonRows />
        ) : items.length === 0 ? (
          <EmptyState
            title={tab === "breached" ? "No SLA breaches — great work" : "No tickets here"}
            sub={tab === "active" ? "New customer tickets appear here in real time." : undefined}
            icon={tab === "breached" ? AlarmClockOff : MessageSquareText}
          />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {items.map((t, i) => (
              <TicketLine key={t.id} t={t} index={i} onOpen={() => setOpenTicket(t.id)} />
            ))}
          </div>
        )}
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1}
          total={data?.total ?? 0} unit="tickets" onPage={setPage} />
      </GlassPanel>

      <TicketDrawer ticketId={openTicket} onClose={() => setOpenTicket(null)} />
    </div>
  );
}

function slaBadge(t: TicketRow) {
  if (t.status === "RESOLVED" || t.status === "CLOSED") return null;
  const now = Date.now();
  const frDue = t.first_response_at ? null : t.sla_first_response_due;
  const resDue = t.sla_resolution_due;
  if (frDue && parseUtc(frDue) < now) {
    return <Badge className="bg-rose-50 text-rose-700">FR breach</Badge>;
  }
  if (resDue && parseUtc(resDue) < now) {
    return <Badge className="bg-rose-50 text-rose-700">SLA breach</Badge>;
  }
  if (resDue && parseUtc(resDue) - now < 60 * 60 * 1000) {
    return <Badge className="bg-amber-50 text-amber-700">At risk</Badge>;
  }
  return null;
}

function TicketLine({ t, index, onOpen }: { t: TicketRow; index: number; onOpen: () => void }) {
  const st = STATUS_STYLE[t.status];
  const pr = PRIORITY_STYLE[t.priority];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      onClick={onOpen}
      className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-cream-50/70"
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", st.bg)}>
        <span className={cn("size-2 rounded-full", st.dot)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-semibold text-ink-900">{t.subject}</span>
          {t.unread_for_admin > 0 && (
            <span className="grid min-w-4 shrink-0 place-items-center rounded-full bg-[color:var(--gold)] px-1 text-[9px] font-bold text-white">
              {t.unread_for_admin}
            </span>
          )}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-900/45">
          <span className="font-mono text-[10px]">{t.ticket_ref}</span>
          <span>·</span>
          <span className="truncate">{t.customer_name}</span>
          {t.last_message_preview && (
            <>
              <span>·</span>
              <span className="hidden max-w-[280px] truncate italic lg:inline">{t.last_message_preview}</span>
            </>
          )}
        </span>
      </span>
      <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <span className="flex items-center gap-1.5">
          {slaBadge(t)}
          <Badge className={cn(pr.bg, pr.text)}>{pr.label}</Badge>
          <Badge className={cn(st.bg, st.text)}>{st.label}</Badge>
        </span>
        <span className="text-[10.5px] text-ink-900/40">
          {t.assigned_to_name ? `→ ${t.assigned_to_name}` : "Unassigned"} · {relativeTime(t.updated_at)}
        </span>
      </span>
    </motion.button>
  );
}
