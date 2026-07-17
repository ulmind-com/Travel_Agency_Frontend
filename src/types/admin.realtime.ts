// ── Enterprise QR Management ─────────────────────────────────────────────
export type QRVerificationStatus = "PENDING" | "VERIFIED" | "EXPIRED" | "REVOKED" | "BLOCKED";
export type QRScanResult =
  | "VERIFIED" | "EXPIRED" | "REVOKED" | "INVALID"
  | "TAMPERED" | "DUPLICATE" | "UNAUTHORIZED" | "BLOCKED";

export interface QRBookingLite {
  _id: string;
  booking_reference: string;
  user_id?: string;
  package_id?: string;
  status?: string;
  package_snapshot?: { title?: string | null; destination?: string | null; thumbnail?: { url: string } | null };
  travel_start_date?: string;
  tour_end_date?: string;
  travelers_count?: number;
  net_amount?: number;
  qr_code_url?: string | null;
  is_checked_in?: boolean;
  check_in_time?: string | null;
}

export interface QRUserLite {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  profile_image?: { url: string } | null;
}

export interface QRRow {
  _id: string;
  booking_id: string;
  qr_hash: string;
  expiry?: string | null;
  download_count: number;
  scan_count: number;
  successful_scans: number;
  failed_scans: number;
  invalid_attempts: number;
  version: number;
  status: "ACTIVE" | "REVOKED" | "BLOCKED";
  verification_status: QRVerificationStatus;
  history_count: number;
  last_scan_time?: string | null;
  last_scan_device?: string | null;
  last_scan_browser?: string | null;
  last_scan_location?: string | null;
  last_scan_ip?: string | null;
  last_scan_result?: string | null;
  created_at: string;
  updated_at?: string;
  booking?: QRBookingLite | null;
  user?: QRUserLite | null;
}

export interface QRDetail extends QRRow {
  recent_scans: QRScanLogRow[];
  history: QRVersionHistory[];
}

export interface QRScanLogRow {
  _id: string;
  qr_id: string;
  booking_reference?: string | null;
  qr_version?: number | null;
  result: QRScanResult;
  failure_reason?: string | null;
  scanner_name?: string | null;
  scanner_role?: string | null;
  ip_address?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gps_source?: string | null;
  scanned_at: string;
}

export interface QRVersionHistory {
  version: number;
  qr_hash: string;
  signature?: string | null;
  qr_code_url?: string | null;
  expiry?: string | null;
  invalidated_at: string;
  invalidated_by?: string;
  invalidated_by_name?: string;
  reason?: string | null;
}

export interface QRListResponse {
  items: QRRow[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface QRSummary {
  total_qr: number;
  active: number;
  expired: number;
  revoked: number;
  blocked: number;
  total_scans: number;
  successful_scans: number;
  failed_scans: number;
  invalid_attempts: number;
  downloads: number;
  verification_rate: number;
  daily_scans: { date: string; scans: number; verified: number }[];
  generated_at: string;
}

export interface QRAnalytics {
  total_scans: number;
  successful_scans: number;
  failed_scans: number;
  invalid_attempts: number;
  downloads: number;
  verification_rate: number;
  by_result: Record<string, number>;
  by_device: Record<string, number>;
  top_locations: { city: string; country: string; count: number; latitude?: number; longitude?: number }[];
  timeline: { date: string; scans: number; verified: number }[];
}

export interface QRHistoryResponse {
  versions: QRVersionHistory[];
  current_version: number;
  scans: QRScanLogRow[];
  total_scans: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface QRVerifyResponse {
  result: QRScanResult;
  verified: boolean;
  failure_reason?: string | null;
  booking_reference?: string | null;
  booking_id?: string | null;
  qr_id?: string | null;
  checked_in_at?: string | null;
  scan_log_id: string;
  scanned_at: string;
}

// ── Notification Center ──────────────────────────────────────────────────
export type NotificationCategory =
  | "BOOKINGS" | "PAYMENTS" | "USERS" | "QR" | "INVOICES"
  | "SECURITY" | "SYSTEM" | "MARKETING" | "TRAVEL" | "SUPPORT";
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface NotificationRow {
  _id: string;
  event: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  link?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  actor_id?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  actor_image?: string | null;
  is_read: boolean;
  read_at?: string | null;
  is_archived: boolean;
  is_pinned?: boolean;
  pinned_at?: string | null;
  created_at: string;
}

/** Per-admin notification preferences, persisted server-side. */
export interface NotificationPreferences {
  sound_enabled: boolean;
  desktop_enabled: boolean;
  toast_enabled: boolean;
  muted_categories: NotificationCategory[];
  min_toast_priority: NotificationPriority;
  updated_at: string;
}

export interface NotificationListResponse {
  items: NotificationRow[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
  pages: number;
}

// ── Live Activity Feed ───────────────────────────────────────────────────
export type ActivityType = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";

export interface ActivityRow {
  _id: string;
  user_id?: string | null;
  admin_id?: string | null;
  action: string;
  description: string;
  entity_id?: string | null;
  entity_type?: string | null;
  ip_address?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  country?: string | null;
  city?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  actor_image?: string | null;
  activity_type: ActivityType;
  created_at: string;
}

export interface ActivityFeedResponse {
  items: ActivityRow[];
  has_more: boolean;
  next_cursor?: string | null;
}

// ── Unified SSE events (Redis admin:events channel) ─────────────────────
export interface AdminEvent {
  kind: "activity" | "notification" | "qr" | "notification_state" | "crm" | "support" | "staff" | "assignment" | "report" | "audit" | "payments" | "security" | "marketing" | "documents" | "map";
  at: string;
  action?: string;
  activity?: ActivityRow & { id: string };
  notification?: Pick<NotificationRow, "event" | "title" | "message" | "category" | "priority" | "link" | "created_at"> & { id: string };
  [key: string]: unknown;
}
