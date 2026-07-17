/** Types for the Enterprise Operations & Analytics Suite (7 modules). */

// ─── Shared ──────────────────────────────────────────────────────────────────
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// ─── Module 1 · Support Center ───────────────────────────────────────────────
export type TicketStatus =
  | "OPEN" | "PENDING" | "WAITING_FOR_CUSTOMER" | "RESOLVED" | "CLOSED" | "ESCALATED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type MessageType =
  | "MESSAGE" | "INTERNAL_NOTE" | "PRIVATE_ADMIN_NOTE" | "CALL_NOTE"
  | "VOICE_CALL_LOG" | "MEETING_NOTE" | "SYSTEM";

export interface SlaLeg {
  status: "MET" | "BREACHED" | "AT_RISK" | "ON_TRACK" | "PENDING";
  due: string | null;
  completed_at: string | null;
  minutes_remaining?: number;
}

export interface SlaState {
  first_response: SlaLeg;
  resolution: SlaLeg;
  first_response_minutes: number | null;
  resolution_minutes: number | null;
}

export interface TicketRow {
  id: string;
  ticket_ref: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  customer_name: string | null;
  customer_email: string | null;
  user_id: string;
  booking_id: string | null;
  booking_reference: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  assigned_team: string | null;
  rating: number | null;
  message_count: number;
  unread_for_admin: number;
  unread_for_customer: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  sla_first_response_due: string | null;
  sla_resolution_due: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  escalation_count: number;
  reopen_count: number;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  type: MessageType;
  body: string;
  sender_id: string | null;
  sender_name: string | null;
  sender_role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN" | "SYSTEM";
  sender_image: string | null;
  attachments: { url: string; file_name?: string }[];
  call_meta: Record<string, unknown> | null;
  created_at: string;
}

export interface TimelineEvent {
  event: string;
  description: string;
  actor_name: string | null;
  actor_role: string | null;
  meta: Record<string, unknown>;
  at: string;
}

export interface TicketDetail extends TicketRow {
  description: string | null;
  timeline: TimelineEvent[];
  escalations: {
    escalated_by_name: string | null; reason: string;
    from_priority: string | null; to_priority: string | null; at: string;
  }[];
  reopens: {
    reopened_by_name: string | null; reason: string | null;
    previous_status: string | null; at: string;
  }[];
  feedback: string | null;
  sla: SlaState;
  messages: TicketMessage[];
  customer?: {
    id: string; name: string; email: string; phone: string | null;
    customer_id: string | null; profile_image: string | null;
    booking_count: number; lifetime_spending: number;
    country: string | null; city: string | null;
  } | null;
}

export interface SupportSummary {
  open_total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  created_today: number;
  resolved_today: number;
  sla_breached_first_response: number;
  sla_breached_resolution: number;
  avg_rating: number | null;
  rating_count: number;
  avg_first_response_minutes: number | null;
  avg_resolution_minutes: number | null;
  trend: { date: string; count: number }[];
}

export interface SupportMeta {
  executives: { id: string; name: string; email: string; role: string }[];
  teams: string[];
  statuses: TicketStatus[];
  priorities: TicketPriority[];
  categories: string[];
}

// ─── Module 2 · Staff / Operations ───────────────────────────────────────────
export type StaffType =
  | "TOUR_GUIDE" | "DRIVER" | "TOUR_MANAGER" | "COORDINATOR" | "HOTEL"
  | "TRANSPORT_VENDOR" | "LOCAL_VENDOR" | "EMERGENCY_CONTACT" | "SUPPORT_EXECUTIVE";
export type Availability = "AVAILABLE" | "ON_DUTY" | "ON_LEAVE" | "UNAVAILABLE";
export type LiveStatus = "IDLE" | "EN_ROUTE" | "WITH_GROUP" | "OFF_SHIFT";

export interface StaffRow {
  id: string;
  staff_code: string;
  name: string;
  type: StaffType;
  phone: string | null;
  email: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  languages: string[];
  skills: string[];
  notes: string | null;
  availability: Availability;
  live_status: LiveStatus;
  live_status_updated_at: string | null;
  average_rating: number;
  rating_count: number;
  total_assignments: number;
  active_assignments: number;
  is_active: boolean;
  created_at: string;
}

export interface AssignmentRow {
  id: string;
  booking_id: string;
  booking_reference: string | null;
  role: StaffType;
  staff_id: string;
  staff_name: string | null;
  staff_phone: string | null;
  staff_company: string | null;
  status: "ACTIVE" | "REPLACED" | "REMOVED" | "COMPLETED";
  assigned_by_name: string | null;
  assigned_at: string;
  ended_at: string | null;
  ended_reason: string | null;
  meta: Record<string, unknown>;
}

export interface StaffDetail extends StaffRow {
  ratings: { rating: number; comment: string | null; rated_by_name: string | null; at: string }[];
  assignments: AssignmentRow[];
}

export interface OpsSummary {
  total_staff: number;
  by_type: Record<string, number>;
  by_availability: Record<string, number>;
  top_rated: { id: string; name: string; type: string; average_rating: number }[];
  active_assignments: number;
  unstaffed_upcoming: {
    id: string; booking_reference: string; travel_start_date: string;
    package_title: string | null; travelers_count: number | null;
  }[];
}

export interface BookingAssignments {
  booking_id: string;
  booking_reference: string;
  package_title: string | null;
  travel_start_date: string;
  active: AssignmentRow[];
  history: AssignmentRow[];
}

// ─── Module 3 · Package Analytics ────────────────────────────────────────────
export interface PackageAnalyticsRow {
  id: string;
  title: string;
  category: string;
  thumbnail: string | null;
  destinations: string[];
  is_active: boolean;
  views: number;
  unique_visitors: number;
  wishlist_count: number;
  bookings: number;
  confirmed_bookings: number;
  revenue: number;
  conversion_rate: number;
  avg_booking_value: number;
  cancellation_rate: number;
  refund_rate: number;
  review_rating: number;
  review_count: number;
  repeat_customers: number;
}

export interface PackageAnalyticsList {
  items: PackageAnalyticsRow[];
  totals: { views: number; bookings: number; revenue: number; wishlists: number };
  window_days: number;
}

export interface PackageAnalyticsDetail {
  package: {
    id: string; title: string; category: string; thumbnail: string | null;
    destinations: string[]; base_price: number; discounted_price: number | null;
    is_active: boolean;
  };
  kpis: PackageAnalyticsRow & {
    returning_customers: number; revenue_growth_pct: number;
  };
  views_daily: { date: string; views: number }[];
  revenue_monthly: { month: string; bookings: number; revenue: number }[];
  popular_months: { month: string; bookings: number }[];
  traffic_sources: { source: string; count: number }[];
  booking_sources: { source: string; count: number }[];
  top_countries: { country: string; count: number }[];
  top_cities: { city: string; count: number }[];
  top_devices: { device: string; count: number }[];
  top_browsers: { browser: string; count: number }[];
  heatmap: { dow: string; dow_index: number; hour: number; count: number }[];
  rating_distribution: { rating: number; count: number }[];
  window_days: number;
}

// ─── Module 4 · Revenue Analytics ────────────────────────────────────────────
export interface RevenueSummary {
  window_days: number;
  gross_revenue: number;
  net_revenue: number;
  tax_collected: number;
  gst: number;
  discounts_given: number;
  refund_loss: number;
  refund_count: number;
  pending_revenue: number;
  pending_count: number;
  failed_amount: number;
  failed_count: number;
  transactions: number;
  paying_customers: number;
  avg_order_value: number;
  customer_lifetime_value: number;
  growth_pct: number;
  previous_net: number;
  all_time_net: number;
  all_time_transactions: number;
}

export interface RevenuePoint {
  period: string;
  gross: number;
  net: number;
  gst: number;
  refunds: number;
  profit: number;
  transactions: number;
}

export type RevenueDimension =
  | "country" | "state" | "city" | "package" | "payment_method" | "admin" | "coupon";

export interface RevenueBreakdownRow {
  label: string;
  net: number;
  gross: number;
  transactions: number;
  share_pct: number;
  discount?: number;
}

export interface ProfitMonth {
  month: string;
  gross: number;
  net: number;
  gst: number;
  gateway_fees: number;
  refunded: number;
  profit: number;
}

export interface TopCustomer {
  user_id: string;
  name: string;
  email: string | null;
  customer_id: string | null;
  profile_image: string | null;
  country: string | null;
  city: string | null;
  net: number;
  transactions: number;
}

// ─── Module 5 · Audit Center ─────────────────────────────────────────────────
export interface AuditRow {
  _id: string;
  admin_id: string;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  session_id: string | null;
  request_id: string | null;
  api_endpoint: string | null;
  http_method: string | null;
  response_code: number | null;
  execution_time_ms: number | null;
  timezone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  created_at: string;
}

export interface AuditStats {
  total_records: number;
  window_records: number;
  avg_execution_ms: number | null;
  daily: { date: string; count: number }[];
  top_actions: { action: string; count: number }[];
  top_admins: { id: string; name: string; role: string | null; count: number }[];
}

export interface AuditFilters {
  actions: string[];
  entity_types: string[];
  admins: { id: string; name: string; count: number }[];
  methods: string[];
}

export interface AuditListParams {
  q?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  admin_id?: string;
  method?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

// ─── Module 6 · System Monitoring ────────────────────────────────────────────
export interface ServiceStatus {
  status: "UP" | "DOWN" | "DEGRADED" | "UNKNOWN";
  error?: string;
  latency_ms?: number;
  [k: string]: unknown;
}

export interface MonitoringOverview {
  generated_at: string;
  overall: "HEALTHY" | "DEGRADED" | "CRITICAL";
  services: {
    mongodb: ServiceStatus & { storage_mb?: number; data_mb?: number; collections?: number; objects?: number };
    redis: ServiceStatus & { memory_used_mb?: number; connected_clients?: number; ops_per_sec?: number; version?: string };
    fastapi: ServiceStatus & { uptime_seconds?: number; process_memory_mb?: number; process_cpu_percent?: number; threads?: number };
    cloudinary: ServiceStatus & { storage_used_mb?: number; credits_used?: number; credits_limit?: number; plan?: string };
    razorpay: ServiceStatus & { mode?: string };
    email: ServiceStatus & { provider?: string; configured?: boolean };
    webhooks: ServiceStatus & { last_received?: string; failed_24h?: number };
  };
  resources: {
    cpu_percent: number;
    ram_percent: number;
    ram_used_gb: number;
    ram_total_gb: number;
    disk_percent: number;
    disk_used_gb: number;
    disk_total_gb: number;
  };
  api: {
    requests_15m?: number;
    errors_15m?: number;
    success_rate?: number;
    avg_latency_ms?: number;
    p50_ms?: number | null;
    p95_ms?: number | null;
    p99_ms?: number | null;
    per_minute?: { minute: string; count: number; errors: number; avg_ms: number }[];
  };
  queues: Record<string, number | null>;
  realtime: { online_users: number; online_admins: number; websocket_connections: number };
  background_jobs: { id: string; name: string; next_run: string | null }[];
}

export interface EndpointMetric {
  endpoint: string;
  count: number;
  errors: number;
  avg_ms: number;
}

// ─── Module 7 · Report Center ────────────────────────────────────────────────
export type ReportType =
  | "USERS" | "BOOKINGS" | "PAYMENTS" | "REVENUE" | "REFUNDS" | "PACKAGES"
  | "STAFF" | "SUPPORT_TICKETS" | "AUDIT_LOGS" | "FRAUD" | "LOYALTY" | "HEALTH_SCORE";
export type ReportFormat = "CSV" | "XLSX" | "PDF" | "JSON";
export type ReportStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export type ScheduleFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface ReportJob {
  id: string;
  report_ref: string;
  type: ReportType;
  format: ReportFormat;
  filters: Record<string, unknown>;
  status: ReportStatus;
  error: string | null;
  requested_by_name: string | null;
  scheduled: boolean;
  row_count: number | null;
  file_name: string | null;
  file_size: number | null;
  emailed_to: string[];
  queued_at: string;
  completed_at: string | null;
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  filters: Record<string, unknown>;
  frequency: ScheduleFrequency;
  email_to: string[];
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  created_by_name: string | null;
  created_at: string;
}

export interface ReportsMeta {
  types: ReportType[];
  formats: ReportFormat[];
  frequencies: ScheduleFrequency[];
}
