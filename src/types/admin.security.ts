// ── Enterprise Security Center types ─────────────────────────────────────────

export interface SecurityOverview {
  sessions: { active: number; revoked: number; expired: number };
  devices: { total: number; trusted: number; blocked: number; recent: number };
  api_tokens: { active: number; revoked: number };
  failed_logins_24h: number;
  critical_events_7d: number;
  ip_rules: { blocked: number; whitelisted: number };
  two_factor: { enabled_users: number; total_users: number; adoption_pct: number };
  events_by_severity_7d: Record<string, number>;
  events_trend_14d: { date: string; count: number; critical: number }[];
  platform_risk: { score: number; level: RiskLevel };
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SecurityMeta {
  session_statuses: string[];
  device_statuses: string[];
  token_statuses: string[];
  event_types: string[];
  severities: string[];
  ip_rules: string[];
}

export interface SessionRow {
  id: string;
  sid: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null;
  screen_resolution?: string | null;
  ip_address?: string | null;
  country?: string | null;
  city?: string | null;
  login_method?: string | null;
  is_vpn: boolean;
  is_proxy: boolean;
  is_tor: boolean;
  rotation_count: number;
  created_at: string;
  last_seen_at?: string | null;
  expires_at?: string | null;
  access_expires_at?: string | null;
  revoked_at?: string | null;
  revoked_by_name?: string | null;
  revoke_reason?: string | null;
  duration_minutes: number;
}

export interface DeviceRow {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  fingerprint: string;
  status: "RECENT" | "TRUSTED" | "BLOCKED";
  label?: string | null;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null;
  screen_resolution?: string | null;
  timezone?: string | null;
  last_country?: string | null;
  last_city?: string | null;
  login_count: number;
  ips: string[];
  first_seen_at: string;
  last_seen_at?: string | null;
  block_reason?: string | null;
}

export interface TokenRow {
  id: string;
  user_id: string;
  user_name?: string | null;
  name: string;
  token_prefix: string;
  scopes: string[];
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  last_used_at?: string | null;
  last_used_ip?: string | null;
  use_count: number;
  expires_at?: string | null;
  created_at: string;
  revoked_at?: string | null;
  revoke_reason?: string | null;
}

export interface IPRuleRow {
  id: string;
  ip: string;
  rule: "BLOCK" | "WHITELIST";
  reason?: string | null;
  is_active: boolean;
  hits: number;
  last_hit_at?: string | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface SecurityEventRow {
  id: string;
  event_type: string;
  severity: RiskLevel | "INFO";
  description: string;
  user_id?: string | null;
  user_email?: string | null;
  user_name?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  ip_address?: string | null;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null;
  country?: string | null;
  city?: string | null;
  details: Record<string, unknown>;
  risk_delta: number;
  created_at: string;
}

export interface FailedLoginsResponse {
  items: SecurityEventRow[];
  total: number;
  page: number;
  pages: number;
  top_ips: { ip: string; count: number; last_at: string; emails: string[] }[];
}

export interface UserSecurityProfile {
  user: {
    id: string; name: string; email: string; role: string;
    customer_id?: string | null; is_blocked: boolean; is_suspended: boolean;
    failed_login_attempts: number; last_login?: string | null; created_at: string;
  };
  two_factor: {
    totp_enabled: boolean; email_otp_enabled: boolean; sms_otp_enabled: boolean;
    recovery_codes_remaining: number;
  };
  password: {
    last_changed?: string | null; change_required: boolean;
    history_depth: number; recent_changes: string[];
  };
  risk: { score: number; level: RiskLevel; factors: Record<string, { count: number; weight: number }>; window_days: number };
  sessions: Partial<SessionRow>[];
  devices: Partial<DeviceRow>[];
  api_tokens: Partial<TokenRow>[];
  timeline: SecurityEventRow[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

// ── Self-service (customer) security ─────────────────────────────────────────
export interface MySecurity {
  two_factor: {
    totp_enabled: boolean; totp_confirmed_at?: string | null;
    email_otp_enabled: boolean; sms_otp_enabled: boolean;
    recovery_codes_remaining: number; recovery_codes_generated_at?: string | null;
  };
  password: { last_changed?: string | null; change_required: boolean };
  active_sessions: number;
  devices: number;
  api_tokens: number;
  risk: { score: number; level: RiskLevel; factors: Record<string, { count: number; weight: number }> };
  current_sid?: string | null;
}
