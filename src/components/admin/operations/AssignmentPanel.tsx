/**
 * Per-booking staff assignment panel — used inside the booking drawer's
 * "Staff" tab. Assign / replace / remove per role with full history.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, History, Loader2, Phone, Plus, UserX } from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { staffService } from "@/services/enterprise.service";
import type { AssignmentRow, StaffType } from "@/types/admin.enterprise";
import { Badge, SectionTitle, fmtDateTime } from "@/components/admin/enterprise/ui";
import { STAFF_ICON, STAFF_LABEL } from "@/routes/_authenticated.account.admin.operations";

const ASSIGNABLE: StaffType[] = [
  "TOUR_GUIDE", "DRIVER", "TOUR_MANAGER", "COORDINATOR", "HOTEL",
  "TRANSPORT_VENDOR", "LOCAL_VENDOR", "EMERGENCY_CONTACT", "SUPPORT_EXECUTIVE",
];

export function AssignmentPanel({ bookingId }: { bookingId: string }) {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [picking, setPicking] = useState<StaffType | null>(null);
  const [replacing, setReplacing] = useState<AssignmentRow | null>(null);
  const [reason, setReason] = useState("");
  const [pickedStaff, setPickedStaff] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "staff", "booking-assignments", bookingId],
    queryFn: () => staffService.bookingAssignments(bookingId),
  });

  const role = picking ?? replacing?.role ?? null;
  const { data: candidates } = useQuery({
    queryKey: ["admin", "staff", "candidates", role],
    queryFn: () => staffService.list({ type: role, page: 1, page_size: 100 }),
    enabled: !!role,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
  };
  const closeModal = () => {
    setPicking(null); setReplacing(null); setReason(""); setPickedStaff("");
  };

  const assignMutation = useMutation({
    mutationFn: () => staffService.assign(bookingId, picking!, pickedStaff, reason.trim() || undefined),
    onSuccess: () => { toast.success("Staff assigned"); closeModal(); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const replaceMutation = useMutation({
    mutationFn: () => staffService.replace(replacing!.id, pickedStaff, reason.trim()),
    onSuccess: () => { toast.success("Assignment replaced"); closeModal(); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const removeMutation = useMutation({
    mutationFn: (a: AssignmentRow) => staffService.remove(a.id, "Removed from booking drawer"),
    onSuccess: () => { toast.success("Assignment removed"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  if (isLoading || !data) {
    return <div className="grid h-40 place-items-center"><Loader2 className="size-5 animate-spin text-ink-900/30" /></div>;
  }

  const activeByRole = new Map(data.active.map((a) => [a.role, a]));
  const modalOpen = picking !== null || replacing !== null;
  const isReplacing = replacing !== null;

  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Assigned crew & vendors</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {ASSIGNABLE.map((r) => {
            const a = activeByRole.get(r);
            const Icon = STAFF_ICON[r];
            return (
              <div key={r} className={cn("rounded-2xl border px-4 py-3",
                a ? "border-ink-900/[0.08] bg-white/70" : "border-dashed border-ink-900/15 bg-transparent")}>
                <div className="flex items-center gap-2.5">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full",
                    a ? "bg-emerald-50" : "bg-ink-900/[0.04]")}>
                    <Icon className={cn("size-3.5", a ? "text-emerald-600" : "text-ink-900/30")} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-900/40">
                      {STAFF_LABEL[r]}
                    </span>
                    {a ? (
                      <span className="block truncate text-[13px] font-semibold text-ink-900">
                        {a.staff_name}
                        {a.staff_phone && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10.5px] font-normal text-ink-900/45">
                            <Phone className="size-2.5" />{a.staff_phone}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="block text-[12px] italic text-ink-900/35">Not assigned</span>
                    )}
                  </span>
                  {isSuperAdmin && (
                    a ? (
                      <span className="flex shrink-0 gap-1">
                        <button title="Replace" onClick={() => setReplacing(a)}
                          className="grid size-7 place-items-center rounded-full border border-ink-900/10 text-ink-900/45 hover:text-ink-900">
                          <ArrowLeftRight className="size-3" />
                        </button>
                        <button title="Remove" onClick={() => removeMutation.mutate(a)}
                          className="grid size-7 place-items-center rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50">
                          <UserX className="size-3" />
                        </button>
                      </span>
                    ) : (
                      <button onClick={() => setPicking(r)}
                        className="grid size-7 shrink-0 place-items-center rounded-full border border-ink-900/10 text-ink-900/45 hover:bg-ink-900 hover:text-cream-50">
                        <Plus className="size-3.5" />
                      </button>
                    )
                  )}
                </div>
                {a && (
                  <p className="mt-1.5 text-[10px] text-ink-900/35">
                    Assigned {fmtDateTime(a.assigned_at)}{a.assigned_by_name ? ` by ${a.assigned_by_name}` : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {!isSuperAdmin && (
          <p className="mt-2 text-[10.5px] text-ink-900/35">
            Assignment management requires SUPER_ADMIN access.
          </p>
        )}
      </div>

      {/* History (replacements & removals) */}
      {data.history.length > 0 && (
        <div>
          <SectionTitle>Assignment history</SectionTitle>
          <div className="space-y-1.5">
            {data.history.map((h) => (
              <div key={h.id} className="flex items-center gap-2.5 rounded-xl bg-ink-900/[0.03] px-3.5 py-2">
                <History className="size-3 shrink-0 text-ink-900/30" />
                <span className="min-w-0 flex-1 text-[11.5px] text-ink-900/60">
                  <b>{h.staff_name}</b> · {STAFF_LABEL[h.role] ?? h.role}
                  {h.ended_reason ? ` — ${h.ended_reason}` : ""}
                </span>
                <Badge className={cn(h.status === "REPLACED" ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-600")}>
                  {h.status}
                </Badge>
                <span className="shrink-0 text-[10px] text-ink-900/35">{fmtDateTime(h.ended_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pick-staff modal */}
      {modalOpen && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-ink-900/30 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-ink-900/10 bg-cream-50 p-6 shadow-2xl">
            <h4 className="font-serif text-lg text-ink-900">
              {isReplacing ? `Replace ${replacing!.staff_name}` : `Assign ${STAFF_LABEL[picking!]}`}
            </h4>
            <select value={pickedStaff} onChange={(e) => setPickedStaff(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-ink-900/10 bg-white px-3 py-2.5 text-[13px] outline-none">
              <option value="">Choose {STAFF_LABEL[role!]}…</option>
              {(candidates?.items ?? [])
                .filter((c) => c.is_active && c.id !== replacing?.staff_id)
                .map((c) => (
                  <option key={c.id} value={c.id}
                    disabled={c.availability === "ON_LEAVE" || c.availability === "UNAVAILABLE"}>
                    {c.name} · {c.availability.replaceAll("_", " ").toLowerCase()}
                    {c.average_rating > 0 ? ` · ★${c.average_rating.toFixed(1)}` : ""}
                  </option>
                ))}
            </select>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder={isReplacing ? "Replacement reason (required)…" : "Note (optional)…"}
              className="mt-2.5 w-full resize-none rounded-2xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm outline-none" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeModal}
                className="rounded-full border border-ink-900/10 px-4 py-2 text-[12px] text-ink-900/60">Cancel</button>
              <button
                disabled={!pickedStaff || (isReplacing && reason.trim().length < 3)
                  || assignMutation.isPending || replaceMutation.isPending}
                onClick={() => (isReplacing ? replaceMutation.mutate() : assignMutation.mutate())}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[12px] font-semibold text-cream-50 disabled:opacity-30">
                {(assignMutation.isPending || replaceMutation.isPending) && <Loader2 className="size-3 animate-spin" />}
                {isReplacing ? "Replace" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
