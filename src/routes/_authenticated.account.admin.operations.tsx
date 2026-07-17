import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, BadgeCheck, Building2, Bus, CalendarClock, Car,
  ClipboardList, Compass, Loader2, MapPin, Phone, PhoneCall, Plus, Search,
  ShieldCheck, Star, User2, UserCog, Users2,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { staffService } from "@/services/enterprise.service";
import type { Availability, LiveStatus, StaffRow, StaffType } from "@/types/admin.enterprise";
import {
  Badge, DrawerHeader, EmptyState, GlassPanel, Pagination, SectionTitle,
  SideDrawer, SkeletonRows, StatCard, fmtDateTime, relativeTime,
} from "@/components/admin/enterprise/ui";

export const Route = createFileRoute("/_authenticated/account/admin/operations")({
  component: OperationsPage,
});

export const STAFF_ICON: Record<StaffType, typeof User2> = {
  TOUR_GUIDE: Compass, DRIVER: Car, TOUR_MANAGER: UserCog, COORDINATOR: ClipboardList,
  HOTEL: Building2, TRANSPORT_VENDOR: Bus, LOCAL_VENDOR: MapPin,
  EMERGENCY_CONTACT: PhoneCall, SUPPORT_EXECUTIVE: Users2,
};

export const STAFF_LABEL: Record<StaffType, string> = {
  TOUR_GUIDE: "Tour Guide", DRIVER: "Driver", TOUR_MANAGER: "Tour Manager",
  COORDINATOR: "Coordinator", HOTEL: "Hotel", TRANSPORT_VENDOR: "Transport Vendor",
  LOCAL_VENDOR: "Local Vendor", EMERGENCY_CONTACT: "Emergency Contact",
  SUPPORT_EXECUTIVE: "Support Executive",
};

export const AVAIL_STYLE: Record<Availability, { bg: string; text: string; label: string }> = {
  AVAILABLE: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Available" },
  ON_DUTY: { bg: "bg-sky-50", text: "text-sky-700", label: "On duty" },
  ON_LEAVE: { bg: "bg-amber-50", text: "text-amber-700", label: "On leave" },
  UNAVAILABLE: { bg: "bg-stone-100", text: "text-stone-600", label: "Unavailable" },
};

export const LIVE_STYLE: Record<LiveStatus, { dot: string; label: string }> = {
  IDLE: { dot: "bg-stone-400", label: "Idle" },
  EN_ROUTE: { dot: "bg-amber-500", label: "En route" },
  WITH_GROUP: { dot: "bg-emerald-500", label: "With group" },
  OFF_SHIFT: { dot: "bg-stone-300", label: "Off shift" },
};

function OperationsPage() {
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState<false | "new" | StaffRow>(false);

  const { data: summary } = useQuery({
    queryKey: ["admin", "staff", "summary"],
    queryFn: staffService.opsSummary,
    refetchInterval: 60_000,
  });
  const { data: meta } = useQuery({
    queryKey: ["admin", "staff", "meta"],
    queryFn: staffService.meta,
    staleTime: 10 * 60_000,
  });

  const params = useMemo(() => ({
    page, page_size: 20,
    ...(search.trim() ? { q: search.trim() } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    include_inactive: true,
  }), [search, typeFilter, page]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "staff", "list", params],
    queryFn: () => staffService.list(params),
    placeholderData: keepPreviousData,
  });

  const s = summary;
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-ink-900">Operations Center</h2>
          <p className="mt-1 text-sm text-ink-900/55">
            Staff registry, live availability and per-booking assignments — fully tracked.
          </p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setEditorOpen("new")}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2.5 text-[12px] font-semibold text-cream-50 shadow-sm transition-transform hover:scale-[1.02]">
            <Plus className="size-3.5" /> Add staff
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users2} label="Active Staff" value={s ? String(s.total_staff) : "—"} />
        <StatCard icon={Activity} label="Active Assignments" value={s ? String(s.active_assignments) : "—"} />
        <StatCard icon={BadgeCheck} label="Available Now"
          value={s ? String(s.by_availability.AVAILABLE ?? 0) : "—"} tone="ok" />
        <StatCard icon={AlertTriangle} label="Unstaffed Trips (14d)"
          value={s ? String(s.unstaffed_upcoming.length) : "—"}
          tone={s && s.unstaffed_upcoming.length > 0 ? "warn" : undefined} />
      </div>

      {/* Unstaffed alert strip */}
      {(s?.unstaffed_upcoming.length ?? 0) > 0 && (
        <GlassPanel className="border-amber-200/70 p-4">
          <SectionTitle>Upcoming trips without any staff assigned</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {s!.unstaffed_upcoming.map((b) => (
              <span key={b.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-[11px] text-amber-800">
                <CalendarClock className="size-3" />
                <span className="font-mono">{b.booking_reference}</span>
                {b.package_title && <span className="hidden sm:inline">· {b.package_title}</span>}
                <span>· {new Date(b.travel_start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </span>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-900/35" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search staff, code, phone…"
            className="w-56 rounded-full border border-ink-900/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-full border border-ink-900/10 bg-white px-3 py-2 text-[12px] text-ink-900/65 outline-none">
          <option value="">All roles</option>
          {meta?.types.map((t) => <option key={t} value={t}>{STAFF_LABEL[t as StaffType] ?? t}</option>)}
        </select>
        {data && (
          <span className="ml-auto text-[11px] text-ink-900/40">
            {data.total} staff member{data.total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Registry */}
      <GlassPanel>
        {isLoading ? (
          <SkeletonRows />
        ) : items.length === 0 ? (
          <EmptyState icon={Users2} title="No staff in the registry yet"
            sub={isSuperAdmin ? "Add guides, drivers, hotels and vendors to start assigning them to bookings."
              : "A super admin needs to add staff members first."} />
        ) : (
          <div className="divide-y divide-ink-900/[0.05]">
            {items.map((m, i) => {
              const Icon = STAFF_ICON[m.type] ?? User2;
              const av = AVAIL_STYLE[m.availability];
              const lv = LIVE_STYLE[m.live_status];
              return (
                <motion.button key={m.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                  onClick={() => setDetailId(m.id)}
                  className={cn("flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-cream-50/70",
                    !m.is_active && "opacity-45")}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-900/5">
                    <Icon className="size-4.5 text-ink-900/55" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-ink-900">{m.name}</span>
                      <span className="font-mono text-[9.5px] text-ink-900/35">{m.staff_code}</span>
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-900/45">
                      <span>{STAFF_LABEL[m.type] ?? m.type}</span>
                      {m.city && <><span>·</span><span>{m.city}</span></>}
                      {m.phone && <><span>·</span><span className="inline-flex items-center gap-0.5"><Phone className="size-2.5" />{m.phone}</span></>}
                    </span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-3 sm:flex">
                    {m.average_rating > 0 && (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-900">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {m.average_rating.toFixed(1)}
                      </span>
                    )}
                    <span className="text-[11px] text-ink-900/40">
                      {m.active_assignments}/{m.total_assignments} active
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-900/50">
                      <span className={cn("size-1.5 rounded-full", lv.dot)} /> {lv.label}
                    </span>
                    <Badge className={cn(av.bg, av.text)}>{av.label}</Badge>
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
        <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1}
          total={data?.total ?? 0} unit="staff" onPage={setPage} />
      </GlassPanel>

      <StaffDetailDrawer staffId={detailId} onClose={() => setDetailId(null)}
        onEdit={(m) => { setDetailId(null); setEditorOpen(m); }} />
      <StaffEditorModal state={editorOpen} onClose={() => setEditorOpen(false)}
        types={meta?.types ?? []} />
    </div>
  );
}

// ─── Staff detail drawer ─────────────────────────────────────────────────────
function StaffDetailDrawer({ staffId, onClose, onEdit }: {
  staffId: string | null; onClose: () => void; onEdit: (m: StaffRow) => void;
}) {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: m, isLoading } = useQuery({
    queryKey: ["admin", "staff", "detail", staffId],
    queryFn: () => staffService.detail(staffId!),
    enabled: !!staffId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });

  const liveMutation = useMutation({
    mutationFn: (v: { live_status: string; availability?: string }) =>
      staffService.setLiveStatus(staffId!, v.live_status, v.availability),
    onSuccess: () => { toast.success("Status updated"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const rateMutation = useMutation({
    mutationFn: () => staffService.rate(staffId!, rating, comment.trim() || undefined),
    onSuccess: () => {
      toast.success("Rating recorded");
      setRateOpen(false); setRating(0); setComment("");
      invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <SideDrawer open={!!staffId} onClose={onClose}>
      {isLoading || !m ? (
        <div className="grid flex-1 place-items-center">
          <Loader2 className="size-6 animate-spin text-ink-900/30" />
        </div>
      ) : (
        <>
          <DrawerHeader onClose={onClose}
            title={m.name}
            sub={<span className="flex items-center gap-2">
              <span className="font-mono">{m.staff_code}</span>
              <span>· {STAFF_LABEL[m.type] ?? m.type}</span>
              <Badge className={cn(AVAIL_STYLE[m.availability].bg, AVAIL_STYLE[m.availability].text)}>
                {AVAIL_STYLE[m.availability].label}
              </Badge>
            </span>}>
            {isSuperAdmin && (
              <button onClick={() => onEdit(m)}
                className="rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-900/65 hover:text-ink-900">
                Edit
              </button>
            )}
          </DrawerHeader>

          <div data-lenis-prevent="true" className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
            {/* Contact + performance */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-ink-900/[0.08] bg-white/70 p-4">
                <SectionTitle>Contact</SectionTitle>
                <div className="space-y-1 text-[12.5px] text-ink-900/70">
                  {m.phone && <p className="flex items-center gap-1.5"><Phone className="size-3 text-ink-900/35" />{m.phone}</p>}
                  {m.email && <p className="truncate">{m.email}</p>}
                  {m.company && <p className="flex items-center gap-1.5"><Building2 className="size-3 text-ink-900/35" />{m.company}</p>}
                  {(m.city || m.country) && (
                    <p className="flex items-center gap-1.5"><MapPin className="size-3 text-ink-900/35" />
                      {[m.city, m.state, m.country].filter(Boolean).join(", ")}</p>
                  )}
                  {m.languages.length > 0 && <p className="text-[11px] text-ink-900/45">Languages: {m.languages.join(", ")}</p>}
                  {m.skills.length > 0 && <p className="text-[11px] text-ink-900/45">Skills: {m.skills.join(", ")}</p>}
                </div>
              </div>
              <div className="rounded-2xl border border-ink-900/[0.08] bg-white/70 p-4">
                <SectionTitle>Performance</SectionTitle>
                <p className="flex items-center gap-1.5 font-serif text-2xl text-ink-900">
                  <Star className="size-5 fill-amber-400 text-amber-400" />
                  {m.average_rating > 0 ? m.average_rating.toFixed(1) : "—"}
                  <span className="text-[11px] font-sans text-ink-900/40">({m.rating_count} ratings)</span>
                </p>
                <p className="mt-1 text-[11.5px] text-ink-900/50">
                  {m.total_assignments} total assignments · {m.active_assignments} active now
                </p>
                <button onClick={() => setRateOpen(true)}
                  className="mt-2 rounded-full border border-ink-900/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-900/65 hover:text-ink-900">
                  Rate performance
                </button>
              </div>
            </div>

            {/* Live status control */}
            <div>
              <SectionTitle>Live status</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(LIVE_STYLE) as LiveStatus[]).map((ls) => (
                  <button key={ls}
                    onClick={() => liveMutation.mutate({ live_status: ls })}
                    className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                      m.live_status === ls
                        ? "border-ink-900 bg-ink-900 text-cream-50"
                        : "border-ink-900/10 bg-white text-ink-900/55 hover:text-ink-900")}>
                    <span className={cn("size-1.5 rounded-full", LIVE_STYLE[ls].dot)} />
                    {LIVE_STYLE[ls].label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(Object.keys(AVAIL_STYLE) as Availability[]).map((av) => (
                  <button key={av}
                    onClick={() => liveMutation.mutate({ live_status: m.live_status, availability: av })}
                    className={cn("rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                      m.availability === av
                        ? cn("border-transparent", AVAIL_STYLE[av].bg, AVAIL_STYLE[av].text)
                        : "border-ink-900/10 bg-white text-ink-900/45 hover:text-ink-900")}>
                    {AVAIL_STYLE[av].label}
                  </button>
                ))}
              </div>
              {m.live_status_updated_at && (
                <p className="mt-1.5 text-[10.5px] text-ink-900/35">
                  Last updated {relativeTime(m.live_status_updated_at)}
                </p>
              )}
            </div>

            {/* Assignment history */}
            <div>
              <SectionTitle>Assignment history</SectionTitle>
              {m.assignments.length === 0 ? (
                <p className="text-[12px] text-ink-900/40">Never assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {m.assignments.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-ink-900/[0.07] bg-white/70 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11.5px] font-semibold text-ink-900">{a.booking_reference}</span>
                        <Badge className={cn(
                          a.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700"
                            : a.status === "REPLACED" ? "bg-amber-50 text-amber-700"
                              : "bg-stone-100 text-stone-600")}>
                          {a.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-900/45">
                        {STAFF_LABEL[a.role] ?? a.role} · assigned {fmtDateTime(a.assigned_at)}
                        {a.assigned_by_name ? ` by ${a.assigned_by_name}` : ""}
                      </p>
                      {a.ended_reason && (
                        <p className="mt-0.5 text-[11px] italic text-ink-900/40">Ended: {a.ended_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent ratings */}
            {m.ratings.length > 0 && (
              <div>
                <SectionTitle>Recent ratings</SectionTitle>
                <div className="space-y-2">
                  {[...m.ratings].reverse().map((r, i) => (
                    <div key={i} className="rounded-2xl border border-ink-900/[0.07] bg-white/70 px-4 py-2.5">
                      <span className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={cn("size-3",
                            j < r.rating ? "fill-amber-400 text-amber-400" : "text-ink-900/15")} />
                        ))}
                        <span className="ml-1.5 text-[10.5px] text-ink-900/40">
                          {r.rated_by_name} · {relativeTime(r.at)}
                        </span>
                      </span>
                      {r.comment && <p className="mt-1 text-[12px] text-ink-900/60">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rate modal */}
          {rateOpen && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-ink-900/30 p-6 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-3xl border border-ink-900/10 bg-cream-50 p-6 shadow-2xl">
                <h4 className="font-serif text-lg text-ink-900">Rate {m.name}</h4>
                <div className="mt-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} onClick={() => setRating(i + 1)}>
                      <Star className={cn("size-7 transition-colors",
                        i < rating ? "fill-amber-400 text-amber-400" : "text-ink-900/15 hover:text-amber-300")} />
                    </button>
                  ))}
                </div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                  placeholder="Optional comment…"
                  className="mt-3 w-full resize-none rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setRateOpen(false)}
                    className="rounded-full border border-ink-900/10 px-4 py-2 text-[12px] text-ink-900/60">Cancel</button>
                  <button disabled={rating === 0 || rateMutation.isPending}
                    onClick={() => rateMutation.mutate()}
                    className="rounded-full bg-ink-900 px-4 py-2 text-[12px] font-semibold text-cream-50 disabled:opacity-30">
                    Save rating
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

// ─── Staff editor (create / edit) ────────────────────────────────────────────
function StaffEditorModal({ state, onClose, types }: {
  state: false | "new" | StaffRow; onClose: () => void; types: string[];
}) {
  const queryClient = useQueryClient();
  const editing = state !== false && state !== "new" ? state : null;
  const open = state !== false;

  const [form, setForm] = useState<Record<string, string>>({});
  const f = (k: string, fallback = "") =>
    form[k] ?? (editing ? String((editing as unknown as Record<string, unknown>)[k] ?? "") : fallback);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: f("name"), phone: f("phone") || null, email: f("email") || null,
        company: f("company") || null, city: f("city") || null,
        state: f("state") || null, country: f("country") || null,
        notes: f("notes") || null,
        languages: f("languages").split(",").map((x) => x.trim()).filter(Boolean),
        skills: f("skills").split(",").map((x) => x.trim()).filter(Boolean),
      };
      if (editing) {
        if (form.is_active !== undefined) body.is_active = form.is_active === "true";
        return staffService.update(editing.id, body);
      }
      return staffService.create({ ...body, type: f("type", types[0] ?? "TOUR_GUIDE") });
    },
    onSuccess: () => {
      toast.success(editing ? "Staff updated" : "Staff member added");
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      setForm({});
      onClose();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-ink-900/10 bg-cream-50 p-6 shadow-2xl">
        <h3 className="font-serif text-xl text-ink-900">
          {editing ? `Edit ${editing.name}` : "Add staff member"}
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <input value={f("name")} onChange={set("name")} placeholder="Full name *"
            className="col-span-2 rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[color:var(--gold)]/40" />
          {!editing && (
            <select value={f("type", types[0] ?? "")} onChange={set("type")}
              className="col-span-2 rounded-2xl border border-ink-900/10 bg-white px-3 py-2.5 text-[13px] outline-none">
              {types.map((t) => <option key={t} value={t}>{STAFF_LABEL[t as StaffType] ?? t}</option>)}
            </select>
          )}
          <input value={f("phone")} onChange={set("phone")} placeholder="Phone"
            className="rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
          <input value={f("email")} onChange={set("email")} placeholder="Email"
            className="rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
          <input value={f("company")} onChange={set("company")} placeholder="Company / property"
            className="col-span-2 rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
          <input value={f("city")} onChange={set("city")} placeholder="City"
            className="rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
          <input value={f("country")} onChange={set("country")} placeholder="Country"
            className="rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
          <input value={f("languages")} onChange={set("languages")}
            placeholder="Languages (comma separated)"
            className="col-span-2 rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
          <input value={f("skills")} onChange={set("skills")}
            placeholder="Skills (comma separated)"
            className="col-span-2 rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
          <textarea value={f("notes")} onChange={set("notes")} rows={2} placeholder="Internal notes"
            className="col-span-2 resize-none rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
          {editing && (
            <label className="col-span-2 flex items-center gap-2 text-[12.5px] text-ink-900/60">
              <input type="checkbox"
                checked={(form.is_active ?? String(editing.is_active)) === "true"}
                onChange={(e) => setForm((p) => ({ ...p, is_active: String(e.target.checked) }))}
                className="size-3.5 accent-ink-900" />
              Active in the registry
            </label>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose}
            className="rounded-full border border-ink-900/10 px-4 py-2 text-[12px] text-ink-900/60">Cancel</button>
          <button disabled={f("name").trim().length < 2 || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-5 py-2 text-[12px] font-semibold text-cream-50 disabled:opacity-30">
            {saveMutation.isPending && <Loader2 className="size-3 animate-spin" />}
            {editing ? "Save changes" : "Add to registry"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
