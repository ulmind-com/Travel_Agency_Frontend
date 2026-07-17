import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, MapPin, Monitor, Globe, Loader2, Radio, Users2,
  ChevronsRight, ChevronsLeft, GripVertical,
} from "lucide-react";

import { adminActivityFeedQuery } from "@/lib/queries";
import { activityService } from "@/services/realtime.service";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityRow, ActivityType } from "@/types/admin.realtime";
import { ACTIVITY_TYPE_STYLE, relativeTime } from "@/components/admin/qr/qrBadges";

const TYPE_FILTERS: ("ALL" | ActivityType)[] = ["ALL", "SUCCESS", "INFO", "WARNING", "CRITICAL"];

/** Deep-link target for one activity, based on its entity type. */
function entityLink(a: ActivityRow): { to: string; params?: Record<string, string>; search?: Record<string, string> } | null {
  if (!a.entity_id) return null;
  switch (a.entity_type) {
    case "USER": return { to: "/account/admin/users/$id", params: { id: a.entity_id } };
    case "BOOKING": return { to: "/account/admin/bookings" };
    case "PAYMENT": return { to: "/account/admin/payments" };
    case "QR": return { to: "/account/admin/qr", search: { focus: a.entity_id } };
    case "PACKAGE": return { to: "/packages/$id", params: { id: a.entity_id } };
    default: return null;
  }
}

const WIDTH_KEY = "ulmind:activity-width";
const COLLAPSED_KEY = "ulmind:activity-collapsed";
const MIN_W = 280;
const MAX_W = 520;
const DEFAULT_W = 340;

function storedWidth(): number {
  try {
    const w = Number(localStorage.getItem(WIDTH_KEY));
    return Number.isFinite(w) && w >= MIN_W && w <= MAX_W ? w : DEFAULT_W;
  } catch { return DEFAULT_W; }
}
function storedCollapsed(): boolean {
  try { return localStorage.getItem(COLLAPSED_KEY) === "1"; } catch { return false; }
}

/**
 * Live activity feed — newest first, auto-updating (new events are prepended
 * into the cache by useAdminEvents without a refetch), infinite scroll for
 * history. Rendered as the sticky right sidebar on the admin dashboard;
 * `resizable` adds a drag handle (left edge) + collapse-to-rail toggle,
 * both persisted per browser.
 */
export function ActivityFeed({ className, maxHeight = "calc(100vh - 10rem)", resizable = false }: {
  className?: string; maxHeight?: string; resizable?: boolean;
}) {
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]>("ALL");
  const filters = typeFilter === "ALL" ? {} : { activity_type: typeFilter };

  const [width, setWidth] = useState(storedWidth);
  const [collapsed, setCollapsed] = useState(storedCollapsed);
  const dragging = useRef(false);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1"); } catch { /* ignore */ }
      return !c;
    });
  };

  const startDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    const startX = e.clientX;
    const startW = width;
    const onMove = (ev: PointerEvent) => {
      if (!dragging.current) return;
      const w = Math.min(MAX_W, Math.max(MIN_W, startW + (startX - ev.clientX)));
      setWidth(w);
    };
    const onUp = (ev: PointerEvent) => {
      dragging.current = false;
      const w = Math.min(MAX_W, Math.max(MIN_W, startW + (startX - ev.clientX)));
      try { localStorage.setItem(WIDTH_KEY, String(w)); } catch { /* ignore */ }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [width]);

  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading,
  } = useInfiniteQuery(adminActivityFeedQuery(filters));

  const { data: online } = useQuery({
    queryKey: ["admin", "activity", "online"] as const,
    queryFn: activityService.online,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  // infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Collapsed rail — slim vertical strip with a live pulse + expand control
  if (resizable && collapsed) {
    return (
      <aside className={cn("flex w-12 flex-col items-center gap-3 overflow-hidden rounded-3xl border border-ink-900/[0.08] bg-white/70 py-4 shadow-sm backdrop-blur", className)}>
        <button
          onClick={toggleCollapsed}
          title="Expand live activity"
          className="grid size-8 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/55 transition-colors hover:text-ink-900"
        >
          <ChevronsLeft className="size-4" />
        </button>
        <Radio className="size-4 animate-pulse text-emerald-500" />
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-ink-900/35 [writing-mode:vertical-rl]">
          Live Activity
        </p>
        {(online?.count ?? 0) > 0 && (
          <span className="grid size-6 place-items-center rounded-full bg-emerald-50 text-[9px] font-bold text-emerald-700"
            title={`${online!.count} admin(s) online`}>
            {online!.count}
          </span>
        )}
      </aside>
    );
  }

  return (
    <aside
      className={cn("relative overflow-hidden rounded-3xl border border-ink-900/[0.08] bg-white/70 shadow-sm backdrop-blur", className)}
      style={resizable ? { width } : undefined}
    >
      {/* Resize handle — drag the left edge */}
      {resizable && (
        <div
          onPointerDown={startDrag}
          title="Drag to resize"
          className="group absolute inset-y-0 left-0 z-10 flex w-2.5 cursor-col-resize items-center justify-center hover:bg-[color:var(--gold)]/10"
        >
          <GripVertical className="size-3 text-ink-900/15 group-hover:text-[color:var(--gold)]" />
        </div>
      )}
      {/* Header */}
      <div className="relative border-b border-ink-900/5 px-4 py-3.5">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent" />
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/45">
            <Radio className="size-3.5 text-emerald-500" /> Live Activity
          </p>
          <span className="flex items-center gap-1.5">
            {(online?.count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700"
                title={online!.online.map((o) => o.name).join(", ")}>
                <Users2 className="size-3" /> {online!.count} online
              </span>
            )}
            {resizable && (
              <button
                onClick={toggleCollapsed}
                title="Collapse feed"
                className="grid size-6 place-items-center rounded-full text-ink-900/40 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
              >
                <ChevronsRight className="size-3.5" />
              </button>
            )}
          </span>
        </div>
        <div className="no-scrollbar mt-2.5 flex gap-1 overflow-x-auto">
          {TYPE_FILTERS.map((t) => {
            const style = t === "ALL" ? null : ACTIVITY_TYPE_STYLE[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                  typeFilter === t ? "bg-ink-900 text-cream-50" : "bg-ink-900/5 text-ink-900/50 hover:bg-ink-900/10")}
              >
                {style && <span className={cn("size-1.5 rounded-full", style.dot)} />}
                {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="overflow-y-auto px-3 py-3" style={{ maxHeight }} data-lenis-prevent="true">
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink-900/5" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Activity className="mx-auto mb-3 size-8 text-ink-900/10" />
            <p className="font-serif text-ink-900/50">Quiet for now</p>
            <p className="mt-1 text-xs text-ink-900/35">Platform activity streams in here the instant it happens.</p>
          </div>
        ) : (
          <ol className="relative space-y-0.5">
            <AnimatePresence initial={false}>
              {items.map((a, i) => (
                <motion.li
                  key={a._id}
                  layout="position"
                  initial={{ opacity: 0, y: -14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FeedItem a={a} isLast={i === items.length - 1} />
                </motion.li>
              ))}
            </AnimatePresence>
            <div ref={sentinelRef} />
            {isFetchingNextPage && (
              <li className="flex justify-center py-3 text-ink-900/40">
                <Loader2 className="size-4 animate-spin" />
              </li>
            )}
            {!hasNextPage && items.length > 10 && (
              <li className="py-3 text-center text-[10px] uppercase tracking-widest text-ink-900/25">End of history</li>
            )}
          </ol>
        )}
      </div>
    </aside>
  );
}

function FeedItem({ a, isLast }: { a: ActivityRow; isLast: boolean }) {
  const style = ACTIVITY_TYPE_STYLE[a.activity_type] ?? ACTIVITY_TYPE_STYLE.INFO;
  const link = entityLink(a);
  const meta = [
    a.device && a.browser ? `${a.device} · ${a.browser}` : a.device || a.browser,
    [a.city, a.country].filter(Boolean).join(", "),
    a.ip_address,
  ].filter(Boolean);

  const body = (
    <div className="flex gap-3 rounded-2xl p-2.5 transition-colors hover:bg-cream-50/80">
      {/* Timeline gutter: avatar + connector */}
      <div className="relative flex flex-col items-center">
        {a.actor_image ? (
          <img src={a.actor_image} alt="" className={cn("size-8 shrink-0 rounded-full object-cover ring-2", style.ring)} />
        ) : (
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-white font-serif text-xs text-ink-900/60 ring-2", style.ring)}>
            {(a.actor_name ?? "S").charAt(0)}
          </span>
        )}
        <span className={cn("absolute -right-0.5 top-5 size-2 rounded-full border-2 border-white", style.dot)} />
        {!isLast && <span className="mt-1 w-px flex-1 bg-ink-900/[0.07]" />}
      </div>

      <div className="min-w-0 flex-1 pb-1">
        <p className="text-[12.5px] leading-snug text-ink-900/85">
          <span className="font-semibold text-ink-900">{a.actor_name ?? "System"}</span>
          {a.actor_role && (
            <span className="mx-1 rounded bg-ink-900/5 px-1 py-px align-middle text-[8px] font-bold uppercase tracking-wider text-ink-900/45">
              {a.actor_role.replace("_", " ")}
            </span>
          )}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-900/60">{a.description}</p>
        <p className="mt-1 flex items-center gap-2 text-[10px] text-ink-900/40">
          <span className={cn("rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-wider", style.text, "bg-current/0",
            a.activity_type === "SUCCESS" ? "bg-emerald-50" : a.activity_type === "WARNING" ? "bg-amber-50" : a.activity_type === "CRITICAL" ? "bg-rose-50" : "bg-sky-50")}>
            {a.action.replace(/_/g, " ")}
          </span>
          <span title={formatDateTime(a.created_at)}>{relativeTime(a.created_at)}</span>
        </p>
        {meta.length > 0 && (
          <p className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[9.5px] text-ink-900/35">
            {a.device && <span className="inline-flex items-center gap-0.5"><Monitor className="size-2.5" />{a.device}{a.browser ? ` · ${a.browser}` : ""}</span>}
            {(a.city || a.country) && <span className="inline-flex items-center gap-0.5"><MapPin className="size-2.5" />{[a.city, a.country].filter(Boolean).join(", ")}</span>}
            {a.ip_address && <span className="inline-flex items-center gap-0.5 font-mono"><Globe className="size-2.5" />{a.ip_address}</span>}
          </p>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link.to} params={link.params as never} search={(link.search ?? {}) as never} className="block">
        {body}
      </Link>
    );
  }
  return body;
}
