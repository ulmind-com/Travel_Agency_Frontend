import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, X, Search, CheckCheck, Archive, Trash2, Download, Volume2, VolumeX,
  MonitorDot, Inbox, ArchiveRestore, Circle, CheckCircle2, Pin, PinOff,
  SlidersHorizontal, BellOff,
} from "lucide-react";
import { toast } from "sonner";

import {
  adminNotificationsQuery, adminUnreadCountQuery, adminNotificationPrefsQuery,
} from "@/lib/queries";
import { notificationsService } from "@/services/realtime.service";
import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationPreferences, NotificationRow } from "@/types/admin.realtime";
import {
  soundEnabled, setSoundEnabled, desktopEnabled, setDesktopEnabled, applyPreferences,
} from "@/hooks/useAdminEvents";
import { PRIORITY_STYLE, CATEGORY_STYLE, badgeOf, relativeTime } from "@/components/admin/qr/qrBadges";

const CATEGORIES = [
  "ALL", "BOOKINGS", "PAYMENTS", "USERS", "QR", "INVOICES",
  "SECURITY", "SYSTEM", "MARKETING", "TRAVEL", "SUPPORT",
] as const;
const PRIORITIES = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const MUTABLE_CATEGORIES = CATEGORIES.filter((c) => c !== "ALL");

/** True when the keystroke happened while typing in a field. */
function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Bell button with live unread badge — opens the sliding notification panel. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useQuery(adminUnreadCountQuery());
  const unread = data?.unread_count ?? 0;

  // Keyboard shortcut: `n` toggles the panel anywhere in the admin area
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e)) {
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
        className="relative grid size-10 place-items-center rounded-full border border-ink-900/10 bg-white/70 text-ink-900/60 shadow-sm backdrop-blur transition-colors hover:text-ink-900"
        title="Notifications"
        aria-label={`Notifications — ${unread} unread`}
      >
        <Bell className="size-4.5" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]"
            >
              {unread > 99 ? "99+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim(), 300);
  const [category, setCategory] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [sound, setSound] = useState(soundEnabled);
  const [desktop, setDesktop] = useState(desktopEnabled);
  const [showPrefs, setShowPrefs] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Server-persisted preferences (drives sound/desktop/mute state everywhere)
  const { data: prefs } = useQuery({ ...adminNotificationPrefsQuery(), enabled: open });
  useEffect(() => {
    if (prefs) {
      applyPreferences(prefs);
      setSound(prefs.sound_enabled);
      setDesktop(prefs.desktop_enabled);
    }
  }, [prefs]);

  const params = useMemo(() => ({
    search: q, category, priority, unread_only: unreadOnly || undefined,
    archived: archived || undefined, page, page_size: 20,
  }), [q, category, priority, unreadOnly, archived, page]);

  const { data, isLoading } = useQuery({ ...adminNotificationsQuery(params), enabled: open });
  useEffect(() => { setPage(1); }, [q, category, priority, unreadOnly, archived]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
  const onError = (e: unknown) => toast.error(apiErrorMessage(e));

  const readM = useMutation({ mutationFn: notificationsService.markRead, onSuccess: invalidate, onError });
  const unreadM = useMutation({ mutationFn: notificationsService.markUnread, onSuccess: invalidate, onError });
  const readAllM = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: (r) => { toast.success(`${r.marked_read} notification(s) marked read`); invalidate(); },
    onError,
  });
  const archiveM = useMutation({ mutationFn: notificationsService.archive, onSuccess: invalidate, onError });
  const pinM = useMutation({
    mutationFn: notificationsService.pin,
    onSuccess: (r) => { toast.success(r.is_pinned ? "Pinned to top" : "Unpinned"); invalidate(); },
    onError,
  });
  const prefsM = useMutation({
    mutationFn: notificationsService.updatePreferences,
    onSuccess: (p) => {
      applyPreferences(p);
      queryClient.setQueryData(["admin", "notifications", "preferences"], p);
    },
    onError,
  });
  const patchPrefs = (patch: Partial<NotificationPreferences>) => prefsM.mutate(patch);
  const deleteM = useMutation({
    mutationFn: notificationsService.remove,
    onSuccess: () => { toast.success("Notification deleted"); invalidate(); },
    onError,
  });

  const doExport = async () => {
    try {
      const blob = await notificationsService.exportCsv();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `notifications_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success("Notification history exported");
    } catch (e) { onError(e); }
  };

  const openItem = (n: NotificationRow) => {
    if (!n.is_read) readM.mutate(n._id);
    if (n.link) {
      onClose();
      // Links may carry query params (e.g. /account/admin/qr?focus=<id>)
      const [pathname, queryString] = n.link.split("?");
      navigate({
        to: pathname as never,
        search: (queryString
          ? Object.fromEntries(new URLSearchParams(queryString))
          : {}) as never,
      });
    }
  };

  const items = data?.items ?? [];

  // Panel shortcuts: Esc close · `/` focus search · `m` mark all read
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (isTyping(e)) return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key.toLowerCase() === "m" && !e.metaKey && !e.ctrlKey) readAllM.mutate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream-50 shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
          >
            {/* Header */}
            <div className="relative border-b border-ink-900/10 px-5 py-4">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[color:var(--gold)] to-transparent" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink-900/40">Notification Center</p>
                  <h3 className="font-serif text-2xl text-ink-900">
                    {archived ? "Archive" : "Inbox"}
                    {(data?.unread_count ?? 0) > 0 && !archived && (
                      <span className="ml-2 align-middle text-sm font-sans text-rose-500">{data!.unread_count} unread</span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconBtn
                    title={sound ? "Mute notification sound" : "Enable notification sound"}
                    onClick={() => {
                      const next = !sound;
                      setSound(next); setSoundEnabled(next);
                      patchPrefs({ sound_enabled: next });
                    }}
                  >
                    {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4 text-ink-900/30" />}
                  </IconBtn>
                  <IconBtn
                    title={desktop ? "Disable desktop notifications" : "Enable desktop notifications"}
                    onClick={async () => {
                      const next = await setDesktopEnabled(!desktop);
                      setDesktop(next);
                      patchPrefs({ desktop_enabled: next });
                      if (!desktop && !next) toast.error("Desktop notifications were blocked by the browser");
                    }}
                  >
                    <MonitorDot className={cn("size-4", !desktop && "text-ink-900/30")} />
                  </IconBtn>
                  <IconBtn title="Notification preferences" onClick={() => setShowPrefs((v) => !v)}>
                    <SlidersHorizontal className={cn("size-4", showPrefs && "text-[color:var(--gold)]")} />
                  </IconBtn>
                  <IconBtn title="Export history (CSV)" onClick={doExport}><Download className="size-4" /></IconBtn>
                  <IconBtn title="Close (Esc)" onClick={onClose}><X className="size-4" /></IconBtn>
                </div>
              </div>

              {/* Search */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-900/35" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notifications…  ( / )"
                  className="w-full rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40"
                />
              </div>

              {/* Preferences — server-persisted, follows the admin across devices */}
              <AnimatePresence initial={false}>
                {showPrefs && prefs && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-2xl border border-ink-900/[0.08] bg-white/70 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-900/40">Alert Preferences</p>
                        <label className="flex items-center gap-1.5 text-[11px] text-ink-900/60">
                          <BellOff className="size-3" /> Min toast priority
                          <select
                            value={prefs.min_toast_priority}
                            onChange={(e) => patchPrefs({ min_toast_priority: e.target.value as NotificationPreferences["min_toast_priority"] })}
                            className="rounded-full border border-ink-900/10 bg-white px-2 py-0.5 text-[11px] outline-none"
                          >
                            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => (
                              <option key={p} value={p}>{badgeOf(PRIORITY_STYLE, p).label}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <p className="mt-2 text-[10px] text-ink-900/40">Muted categories (still stored — no live toast/sound)</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {MUTABLE_CATEGORIES.map((c) => {
                          const muted = prefs.muted_categories.includes(c);
                          return (
                            <button
                              key={c}
                              onClick={() => patchPrefs({
                                muted_categories: muted
                                  ? prefs.muted_categories.filter((x) => x !== c)
                                  : [...prefs.muted_categories, c],
                              })}
                              className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                                muted ? "bg-rose-500/10 text-rose-600 line-through" : "bg-ink-900/5 text-ink-900/55 hover:bg-ink-900/10")}
                              title={muted ? `Unmute ${c}` : `Mute ${c}`}
                            >
                              {badgeOf(CATEGORY_STYLE, c).label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Category chips */}
              <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn("shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                      category === c ? "bg-ink-900 text-cream-50" : "bg-ink-900/5 text-ink-900/55 hover:bg-ink-900/10")}
                  >
                    {c === "ALL" ? "All" : badgeOf(CATEGORY_STYLE, c).label}
                  </button>
                ))}
              </div>

              {/* Toolbar row */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="rounded-full border border-ink-900/10 bg-white px-2.5 py-1 outline-none"
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p === "ALL" ? "All priorities" : badgeOf(PRIORITY_STYLE, p).label}</option>)}
                </select>
                <Chip active={unreadOnly} onClick={() => setUnreadOnly((v) => !v)}><Circle className="size-2.5" /> Unread</Chip>
                <Chip active={archived} onClick={() => setArchived((v) => !v)}><Archive className="size-3" /> Archived</Chip>
                <button
                  onClick={() => readAllM.mutate()}
                  disabled={readAllM.isPending || (data?.unread_count ?? 0) === 0}
                  className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-ink-900/55 transition-colors hover:bg-ink-900/5 hover:text-ink-900 disabled:opacity-30"
                >
                  <CheckCheck className="size-3.5" /> Mark all read
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 py-3" data-lenis-prevent="true">
              {isLoading ? (
                <div className="space-y-2 px-2">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink-900/5" />)}
                </div>
              ) : items.length === 0 ? (
                <div className="grid h-full place-items-center px-6 text-center">
                  <div>
                    <Inbox className="mx-auto mb-3 size-10 text-ink-900/10" />
                    <p className="font-serif text-lg text-ink-900/50">
                      {archived ? "Nothing archived" : q || category !== "ALL" || priority !== "ALL" || unreadOnly ? "No matches" : "All caught up"}
                    </p>
                    <p className="mt-1 text-xs text-ink-900/35">
                      {archived ? "Archived notifications will appear here." : "Live platform events land here the moment they happen."}
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((n) => (
                    <motion.div
                      key={n._id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NotificationItem
                        n={n}
                        isSuperAdmin={isSuperAdmin}
                        onOpen={() => openItem(n)}
                        onToggleRead={() => (n.is_read ? unreadM.mutate(n._id) : readM.mutate(n._id))}
                        onArchive={() => archiveM.mutate(n._id)}
                        onPin={() => pinM.mutate(n._id)}
                        onDelete={() => deleteM.mutate(n._id)}
                        archived={archived}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Keyboard shortcut hints */}
            <div className="flex items-center justify-center gap-3 border-t border-ink-900/5 px-5 py-1.5 text-[9px] uppercase tracking-widest text-ink-900/30">
              <span><Kbd>N</Kbd> toggle</span>
              <span><Kbd>/</Kbd> search</span>
              <span><Kbd>M</Kbd> read all</span>
              <span><Kbd>Esc</Kbd> close</span>
            </div>

            {/* Footer pagination */}
            {(data?.pages ?? 1) > 1 && (
              <div className="flex items-center justify-between border-t border-ink-900/5 px-5 py-2.5 text-xs text-ink-900/45">
                <span>Page {data!.page} of {data!.pages} · {data!.total} total</span>
                <div className="flex gap-1.5">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-ink-900/10 px-3 py-1.5 disabled:opacity-30">Prev</button>
                  <button disabled={page >= (data?.pages ?? 1)} onClick={() => setPage(page + 1)} className="rounded-lg border border-ink-900/10 px-3 py-1.5 disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function NotificationItem({ n, isSuperAdmin, onOpen, onToggleRead, onArchive, onPin, onDelete, archived }: {
  n: NotificationRow;
  isSuperAdmin: boolean;
  onOpen: () => void;
  onToggleRead: () => void;
  onArchive: () => void;
  onPin: () => void;
  onDelete: () => void;
  archived: boolean;
}) {
  const pr = badgeOf(PRIORITY_STYLE, n.priority);
  const cat = badgeOf(CATEGORY_STYLE, n.category);
  return (
    <div
      className={cn(
        "group relative mb-2 cursor-pointer rounded-2xl border p-3.5 transition-colors",
        n.is_read ? "border-ink-900/[0.06] bg-white/60" : "border-[color:var(--gold)]/25 bg-white shadow-sm",
        n.is_pinned && "border-[color:var(--gold)]/40 bg-[color:var(--gold)]/[0.04]",
      )}
      onClick={onOpen}
    >
      {!n.is_read && <span className="absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[color:var(--gold)]" />}
      {n.is_pinned && (
        <Pin className="absolute -left-1 -top-1 size-3.5 rotate-[-35deg] fill-[color:var(--gold)] text-[color:var(--gold)]" />
      )}
      <div className="flex items-start gap-3 pl-1.5">
        {n.actor_image ? (
          <img src={n.actor_image} alt="" className="size-9 shrink-0 rounded-full object-cover ring-1 ring-ink-900/10" />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-900/5 font-serif text-sm text-ink-900/50">
            {(n.actor_name ?? n.title).charAt(0)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={cn("truncate text-[13px]", n.is_read ? "font-medium text-ink-900/70" : "font-semibold text-ink-900")}>{n.title}</p>
            <span className="shrink-0 text-[10px] text-ink-900/35" title={formatDateTime(n.created_at)}>{relativeTime(n.created_at)}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-900/55">{n.message}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={cn("inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider", cat.bg, cat.text)}>{cat.label}</span>
            <span className={cn("inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider", pr.bg, pr.text)}>{pr.label}</span>
            {n.actor_name && <span className="truncate text-[10px] text-ink-900/35">by {n.actor_name}</span>}
          </div>
        </div>
      </div>
      {/* Row actions */}
      <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <RowBtn title={n.is_pinned ? "Unpin" : "Pin to top"} onClick={(e) => { e.stopPropagation(); onPin(); }}>
          {n.is_pinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
        </RowBtn>
        <RowBtn title={n.is_read ? "Mark unread" : "Mark read"} onClick={(e) => { e.stopPropagation(); onToggleRead(); }}>
          {n.is_read ? <Circle className="size-3" /> : <CheckCircle2 className="size-3" />}
        </RowBtn>
        <RowBtn title={archived ? "Restore" : "Archive"} onClick={(e) => { e.stopPropagation(); onArchive(); }}>
          {archived ? <ArchiveRestore className="size-3" /> : <Archive className="size-3" />}
        </RowBtn>
        {isSuperAdmin && (
          <RowBtn title="Delete (Super Admin)" danger onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="size-3" />
          </RowBtn>
        )}
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-ink-900/15 bg-white px-1 py-px font-sans text-[9px] font-semibold text-ink-900/50 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
      {children}
    </kbd>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title}
      className="grid size-8 place-items-center rounded-full border border-ink-900/10 bg-white text-ink-900/55 transition-colors hover:text-ink-900">
      {children}
    </button>
  );
}

function RowBtn({ children, onClick, title, danger }: {
  children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string; danger?: boolean;
}) {
  return (
    <button onClick={onClick} title={title}
      className={cn("grid size-6.5 place-items-center rounded-lg border border-ink-900/10 bg-white shadow-sm transition-colors",
        danger ? "text-rose-500 hover:bg-rose-50" : "text-ink-900/45 hover:text-ink-900")}>
      {children}
    </button>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-colors",
        active ? "bg-ink-900 text-cream-50" : "bg-ink-900/5 text-ink-900/55 hover:bg-ink-900/10")}>
      {children}
    </button>
  );
}
