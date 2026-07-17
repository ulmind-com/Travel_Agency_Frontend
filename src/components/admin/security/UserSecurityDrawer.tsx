import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound, Laptop, Lock, LogOut, RotateCcw, ShieldAlert, ShieldCheck,
  Smartphone, Fingerprint,
} from "lucide-react";
import { toast } from "sonner";

import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { securityAdminService } from "@/services/security.service";
import {
  Badge, DrawerHeader, SectionTitle, SideDrawer, SkeletonRows, fmtDateTime,
  relativeTime,
} from "@/components/admin/enterprise/ui";
import { RiskGauge } from "./RiskGauge";

const SEV_STYLE: Record<string, string> = {
  INFO: "bg-sky-50 text-sky-700", LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700", HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-rose-50 text-rose-700",
};

export function UserSecurityDrawer({ userId, onClose, isSuperAdmin }: {
  userId: string | null; onClose: () => void; isSuperAdmin: boolean;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "security", "user", userId],
    queryFn: () => securityAdminService.userProfile(userId!),
    enabled: !!userId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "security"] });

  const forceLogout = useMutation({
    mutationFn: () => securityAdminService.forceLogout(userId!, "Force logout from Security Center"),
    onSuccess: (r: { sessions_revoked: number }) => { toast.success(`Logged out ${r.sessions_revoked} session(s)`); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const requirePw = useMutation({
    mutationFn: () => securityAdminService.requirePasswordChange(userId!, "Required from Security Center"),
    onSuccess: () => { toast.success("Password change required on next login"); invalidate(); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  const resetSec = useMutation({
    mutationFn: () => securityAdminService.resetSecurity(userId!, "Full security reset from Security Center"),
    onSuccess: (r: { sessions_revoked: number; tokens_revoked: number }) => {
      toast.success(`Security reset · ${r.sessions_revoked} sessions, ${r.tokens_revoked} tokens revoked`); invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <SideDrawer open={!!userId} onClose={onClose} width="max-w-2xl">
      {data && (
        <DrawerHeader
          title={data.user.name}
          sub={<span>{data.user.email} · {data.user.role}</span>}
          onClose={onClose}
        />
      )}
      <div className="flex-1 overflow-y-auto" data-lenis-prevent>
        {isLoading || !data ? <SkeletonRows count={6} /> : (
          <div className="space-y-6 p-6">
            {/* Risk + 2FA */}
            <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-ink-900/[0.07] bg-white/70 p-5">
              <RiskGauge score={data.risk.score} level={data.risk.level} size={110} />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {data.two_factor.totp_enabled
                    ? <Badge className="bg-emerald-50 text-emerald-700"><ShieldCheck className="size-3" /> Authenticator</Badge>
                    : <Badge className="bg-ink-900/5 text-ink-900/50">No Authenticator</Badge>}
                  {data.two_factor.email_otp_enabled && <Badge className="bg-sky-50 text-sky-700">Email OTP</Badge>}
                  <Badge className="bg-ink-900/5 text-ink-900/60">{data.two_factor.recovery_codes_remaining} recovery codes</Badge>
                </div>
                <p className="text-[12px] text-ink-900/55">
                  Password changed {data.password.last_changed ? relativeTime(data.password.last_changed) : "—"}
                  {data.password.change_required && <span className="ml-1 text-amber-600">· change required</span>}
                </p>
                <p className="text-[11px] text-ink-900/40">
                  {data.user.failed_login_attempts} failed attempts · joined {fmtDateTime(data.user.created_at)}
                </p>
              </div>
            </div>

            {/* Actions */}
            {isSuperAdmin && (
              <div>
                <SectionTitle>Security Actions</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  <ActionBtn icon={LogOut} label="Force logout all" tone="warn"
                    onClick={() => forceLogout.mutate()} loading={forceLogout.isPending} />
                  <ActionBtn icon={Lock} label="Require password change"
                    onClick={() => requirePw.mutate()} loading={requirePw.isPending} />
                  <ActionBtn icon={RotateCcw} label="Reset security" tone="alert"
                    onClick={() => { if (confirm("Reset 2FA, revoke all sessions & tokens, clear trusted devices?")) resetSec.mutate(); }}
                    loading={resetSec.isPending} />
                </div>
              </div>
            )}

            {/* Sessions */}
            <div>
              <SectionTitle>Recent Sessions ({data.sessions.length})</SectionTitle>
              <div className="space-y-1.5">
                {data.sessions.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-xl border border-ink-900/[0.06] bg-white/60 px-3 py-2">
                    {s.device_type === "Mobile" ? <Smartphone className="size-3.5 text-ink-900/40" /> : <Laptop className="size-3.5 text-ink-900/40" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] text-ink-900">{s.browser} · {s.os}</p>
                      <p className="truncate text-[10px] text-ink-900/40">{s.ip_address} · {[s.city, s.country].filter(Boolean).join(", ") || "—"}</p>
                    </div>
                    <Badge className={s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-ink-900/5 text-ink-900/50"}>{s.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Devices */}
            {data.devices.length > 0 && (
              <div>
                <SectionTitle>Devices ({data.devices.length})</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {data.devices.map((d) => (
                    <div key={d.id} className="rounded-xl border border-ink-900/[0.06] bg-white/60 px-3 py-2">
                      <p className="text-[12px] text-ink-900">{d.browser} · {d.os}</p>
                      <p className="text-[10px] text-ink-900/40">{d.login_count} logins · {d.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tokens */}
            {data.api_tokens.length > 0 && (
              <div>
                <SectionTitle>API Tokens ({data.api_tokens.length})</SectionTitle>
                <div className="space-y-1.5">
                  {data.api_tokens.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 rounded-xl border border-ink-900/[0.06] bg-white/60 px-3 py-2">
                      <KeyRound className="size-3.5 text-ink-900/40" />
                      <span className="flex-1 truncate text-[12px] text-ink-900">{t.name}</span>
                      <Badge className={t.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-ink-900/5 text-ink-900/50"}>{t.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <SectionTitle>Security Timeline</SectionTitle>
              <div className="relative space-y-3 pl-4">
                <div className="absolute inset-y-1 left-[5px] w-px bg-ink-900/10" />
                {data.timeline.slice(0, 20).map((e) => (
                  <div key={e.id} className="relative">
                    <div className={cn("absolute -left-[13px] top-1 size-2 rounded-full ring-2 ring-cream-50",
                      e.severity === "CRITICAL" || e.severity === "HIGH" ? "bg-rose-500" : "bg-ink-900/30")} />
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12px] text-ink-900">{e.description}</p>
                        <p className="text-[10px] text-ink-900/40">{e.ip_address} · {[e.city, e.country].filter(Boolean).join(", ")}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <Badge className={SEV_STYLE[e.severity] ?? "bg-ink-900/5"}>{e.severity}</Badge>
                        <span className="text-[10px] text-ink-900/35">{relativeTime(e.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}

function ActionBtn({ icon: Icon, label, onClick, loading, tone }: {
  icon: typeof LogOut; label: string; onClick: () => void; loading?: boolean;
  tone?: "warn" | "alert";
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-medium transition-colors disabled:opacity-40",
        tone === "alert" ? "border-rose-200 text-rose-600 hover:bg-rose-50"
          : tone === "warn" ? "border-amber-200 text-amber-700 hover:bg-amber-50"
            : "border-ink-900/10 text-ink-900/65 hover:bg-ink-900/5")}>
      <Icon className="size-3.5" /> {label}
    </button>
  );
}
