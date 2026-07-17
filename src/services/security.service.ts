/**
 * Enterprise Security Center — API layer.
 * Read surfaces: ADMIN+. Mutations: SUPER_ADMIN (enforced server-side).
 * Also exposes the self-service ("my security") endpoints used by the
 * customer/admin profile panel.
 */
import { api } from "@/lib/api";
import type {
  DeviceRow, FailedLoginsResponse, IPRuleRow, MySecurity, Paged,
  SecurityEventRow, SecurityMeta, SecurityOverview, SessionRow, TokenRow,
  UserSecurityProfile,
} from "@/types/admin.security";

export const securityAdminService = {
  overview: async (): Promise<SecurityOverview> =>
    (await api.get("/admin/security/overview")).data,

  meta: async (): Promise<SecurityMeta> =>
    (await api.get("/admin/security/meta")).data,

  sessions: async (params: Record<string, unknown>): Promise<Paged<SessionRow>> =>
    (await api.get("/admin/security/sessions", { params })).data,

  terminateSession: async (id: string, reason?: string) =>
    (await api.delete(`/admin/security/sessions/${id}`, { params: { reason } })).data,

  forceLogout: async (userId: string, reason?: string) =>
    (await api.post(`/admin/security/users/${userId}/force-logout`, { reason })).data,

  devices: async (params: Record<string, unknown>): Promise<Paged<DeviceRow>> =>
    (await api.get("/admin/security/devices", { params })).data,

  deviceAction: async (id: string, action: "TRUST" | "BLOCK" | "UNBLOCK", reason?: string, label?: string) =>
    (await api.patch(`/admin/security/devices/${id}`, { action, reason, label })).data,

  tokens: async (params: Record<string, unknown>): Promise<Paged<TokenRow>> =>
    (await api.get("/admin/security/tokens", { params })).data,

  revokeToken: async (id: string, reason?: string) =>
    (await api.delete(`/admin/security/tokens/${id}`, { params: { reason } })).data,

  ipRules: async (includeInactive = false): Promise<{ items: IPRuleRow[] }> =>
    (await api.get("/admin/security/ip-rules", { params: { include_inactive: includeInactive } })).data,

  createIpRule: async (ip: string, rule: "BLOCK" | "WHITELIST", reason?: string) =>
    (await api.post("/admin/security/ip-rules", { ip, rule, reason })).data,

  removeIpRule: async (id: string) =>
    (await api.delete(`/admin/security/ip-rules/${id}`)).data,

  events: async (params: Record<string, unknown>): Promise<Paged<SecurityEventRow>> =>
    (await api.get("/admin/security/events", { params })).data,

  failedLogins: async (params: Record<string, unknown>): Promise<FailedLoginsResponse> =>
    (await api.get("/admin/security/failed-logins", { params })).data,

  userProfile: async (userId: string): Promise<UserSecurityProfile> =>
    (await api.get(`/admin/security/users/${userId}`)).data,

  requirePasswordChange: async (userId: string, reason?: string) =>
    (await api.post(`/admin/security/users/${userId}/require-password-change`, { reason })).data,

  resetSecurity: async (userId: string, reason?: string) =>
    (await api.post(`/admin/security/users/${userId}/reset-security`, { reason })).data,
};

// ── Self-service (own account) ───────────────────────────────────────────────
export const mySecurityService = {
  me: async (): Promise<MySecurity> => (await api.get("/security/me")).data,

  setupTotp: async (): Promise<{ secret: string; otpauth_uri: string; qr_image: string }> =>
    (await api.post("/security/2fa/setup")).data,

  enableTotp: async (code: string): Promise<{ status: string; recovery_codes: string[] }> =>
    (await api.post("/security/2fa/enable", { code })).data,

  disableTotp: async (password: string) =>
    (await api.post("/security/2fa/disable", { password })).data,

  toggleEmailOtp: async (enabled: boolean) =>
    (await api.post("/security/2fa/email-otp", { enabled })).data,

  regenerateRecoveryCodes: async (): Promise<{ recovery_codes: string[] }> =>
    (await api.post("/security/recovery-codes")).data,

  sessions: async (): Promise<{ items: SessionRow[] }> =>
    (await api.get("/security/sessions")).data,

  revokeSession: async (id: string) => (await api.delete(`/security/sessions/${id}`)).data,

  revokeAllSessions: async () => (await api.post("/security/sessions/revoke-all")).data,

  devices: async (): Promise<{ items: DeviceRow[] }> =>
    (await api.get("/security/devices")).data,

  tokens: async (): Promise<{ items: TokenRow[]; scopes: string[] }> =>
    (await api.get("/security/tokens")).data,

  createToken: async (name: string, scopes: string[], expires_in_days?: number): Promise<TokenRow & { token: string }> =>
    (await api.post("/security/tokens", { name, scopes, expires_in_days })).data,

  revokeToken: async (id: string) => (await api.delete(`/security/tokens/${id}`)).data,

  changePassword: async (current_password: string, new_password: string) =>
    (await api.post("/security/password", { current_password, new_password })).data,
};
