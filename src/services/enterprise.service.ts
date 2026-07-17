/**
 * API layer for the Enterprise Operations & Analytics Suite.
 * Every call hits the real FastAPI backend — no mocks anywhere.
 */
import { api } from "@/lib/api";
import type {
  AuditFilters, AuditListParams, AuditRow, AuditStats, BookingAssignments,
  EndpointMetric, MonitoringOverview, OpsSummary, PackageAnalyticsDetail,
  PackageAnalyticsList, Paged, ProfitMonth, ReportJob, ReportsMeta,
  RevenueBreakdownRow, RevenueDimension, RevenuePoint, RevenueSummary,
  ScheduledReport, StaffDetail, StaffRow, SupportMeta, SupportSummary,
  TicketDetail, TicketMessage, TicketRow, TopCustomer,
} from "@/types/admin.enterprise";

// ─── Module 1 · Support (admin) ──────────────────────────────────────────────
export const supportAdminService = {
  summary: async (): Promise<SupportSummary> =>
    (await api.get("/admin/support/summary")).data,

  list: async (params: Record<string, unknown>): Promise<Paged<TicketRow>> =>
    (await api.get("/admin/support/tickets", { params })).data,

  meta: async (): Promise<SupportMeta> =>
    (await api.get("/admin/support/meta")).data,

  detail: async (id: string): Promise<TicketDetail> =>
    (await api.get(`/admin/support/tickets/${id}`)).data,

  sendMessage: async (id: string, body: {
    body: string; type?: string; call_meta?: Record<string, unknown>; set_waiting?: boolean;
  }): Promise<TicketMessage> =>
    (await api.post(`/admin/support/tickets/${id}/messages`, body)).data,

  setStatus: async (id: string, status: string, note?: string) =>
    (await api.patch(`/admin/support/tickets/${id}/status`, { status, note })).data,

  assign: async (id: string, assigned_to: string | null, assigned_team?: string) =>
    (await api.patch(`/admin/support/tickets/${id}/assign`, { assigned_to, assigned_team })).data,

  escalate: async (id: string, reason: string, to_priority?: string) =>
    (await api.post(`/admin/support/tickets/${id}/escalate`, { reason, to_priority })).data,

  setPriority: async (id: string, priority: string, reason?: string) =>
    (await api.patch(`/admin/support/tickets/${id}/priority`, { priority, reason })).data,

  exportUrl: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    return `/admin/support/export${qs ? `?${qs}` : ""}`;
  },
};

// ─── Module 1 · Support (customer) ───────────────────────────────────────────
export const supportCustomerService = {
  meta: async () => (await api.get("/support/meta")).data,

  list: async (params: Record<string, unknown>): Promise<Paged<TicketRow>> =>
    (await api.get("/support/tickets", { params })).data,

  detail: async (id: string): Promise<TicketDetail> =>
    (await api.get(`/support/tickets/${id}`)).data,

  create: async (body: {
    subject: string; description: string; category: string;
    priority?: string; booking_id?: string | null;
  }) => (await api.post("/support/tickets", body)).data,

  reply: async (id: string, body: string): Promise<TicketMessage> =>
    (await api.post(`/support/tickets/${id}/messages`, { body })).data,

  rate: async (id: string, rating: number, feedback?: string) =>
    (await api.post(`/support/tickets/${id}/rate`, { rating, feedback })).data,

  reopen: async (id: string, reason?: string) =>
    (await api.post(`/support/tickets/${id}/reopen`, { reason })).data,
};

// ─── Module 2 · Staff / Operations ───────────────────────────────────────────
export const staffService = {
  list: async (params: Record<string, unknown>): Promise<Paged<StaffRow> & { by_type: Record<string, number> }> =>
    (await api.get("/admin/staff", { params })).data,

  meta: async (): Promise<{ types: string[]; availability: string[]; live_statuses: string[] }> =>
    (await api.get("/admin/staff/meta")).data,

  detail: async (id: string): Promise<StaffDetail> =>
    (await api.get(`/admin/staff/${id}`)).data,

  create: async (body: Record<string, unknown>): Promise<StaffRow> =>
    (await api.post("/admin/staff", body)).data,

  update: async (id: string, body: Record<string, unknown>): Promise<StaffRow> =>
    (await api.patch(`/admin/staff/${id}`, body)).data,

  setLiveStatus: async (id: string, live_status: string, availability?: string) =>
    (await api.patch(`/admin/staff/${id}/live-status`, { live_status, availability })).data,

  rate: async (id: string, rating: number, comment?: string) =>
    (await api.post(`/admin/staff/${id}/rate`, { rating, comment })).data,

  opsSummary: async (): Promise<OpsSummary> =>
    (await api.get("/admin/assignments/summary")).data,

  recentAssignments: async (): Promise<{ items: BookingAssignments["active"] }> =>
    (await api.get("/admin/assignments/recent")).data,

  bookingAssignments: async (bookingId: string): Promise<BookingAssignments> =>
    (await api.get(`/admin/bookings/${bookingId}/assignments`)).data,

  assign: async (bookingId: string, role: string, staff_id: string, note?: string) =>
    (await api.post(`/admin/bookings/${bookingId}/assignments`, { role, staff_id, note })).data,

  replace: async (assignmentId: string, staff_id: string, reason: string) =>
    (await api.post(`/admin/assignments/${assignmentId}/replace`, { staff_id, reason })).data,

  remove: async (assignmentId: string, reason: string) =>
    (await api.post(`/admin/assignments/${assignmentId}/remove`, { reason })).data,
};

// ─── Module 3 · Package Analytics ────────────────────────────────────────────
export const analyticsService = {
  packages: async (days: number): Promise<PackageAnalyticsList> =>
    (await api.get("/admin/analytics/packages", { params: { days } })).data,

  packageDetail: async (id: string, days: number): Promise<PackageAnalyticsDetail> =>
    (await api.get(`/admin/analytics/packages/${id}`, { params: { days } })).data,
};

// ─── Module 4 · Revenue Analytics ────────────────────────────────────────────
export const revenueService = {
  summary: async (days: number): Promise<RevenueSummary> =>
    (await api.get("/admin/revenue/summary", { params: { days } })).data,

  timeseries: async (granularity: string, days?: number): Promise<{ series: RevenuePoint[] }> =>
    (await api.get("/admin/revenue/timeseries", { params: { granularity, days } })).data,

  breakdown: async (dimension: RevenueDimension, days: number): Promise<{ rows: RevenueBreakdownRow[] }> =>
    (await api.get("/admin/revenue/breakdown", { params: { dimension, days } })).data,

  profitTrend: async (months: number): Promise<{ months: ProfitMonth[] }> =>
    (await api.get("/admin/revenue/profit-trend", { params: { months } })).data,

  topCustomers: async (days: number): Promise<{ rows: TopCustomer[] }> =>
    (await api.get("/admin/revenue/top-customers", { params: { days } })).data,
};

// ─── Module 5 · Audit Center ─────────────────────────────────────────────────
export const auditService = {
  list: async (params: AuditListParams): Promise<Paged<AuditRow>> =>
    (await api.get("/admin/audit", { params })).data,

  stats: async (days = 30): Promise<AuditStats> =>
    (await api.get("/admin/audit/stats", { params: { days } })).data,

  filters: async (): Promise<AuditFilters> =>
    (await api.get("/admin/audit/filters")).data,

  timeline: async (params: Record<string, unknown>): Promise<{ days: { date: string; entries: AuditRow[] }[] }> =>
    (await api.get("/admin/audit/timeline", { params })).data,

  detail: async (id: string): Promise<AuditRow> =>
    (await api.get(`/admin/audit/${id}`)).data,

  export: async (format: "csv" | "json", params: Record<string, unknown>) => {
    const res = await api.get("/admin/audit/export", {
      params: { ...params, format }, responseType: "blob",
    });
    return res.data as Blob;
  },
};

// ─── Module 6 · System Monitoring ────────────────────────────────────────────
export const monitoringService = {
  overview: async (): Promise<MonitoringOverview> =>
    (await api.get("/admin/monitoring/overview")).data,

  endpoints: async (): Promise<{ rows: EndpointMetric[] }> =>
    (await api.get("/admin/monitoring/endpoints")).data,
};

// ─── Module 7 · Report Center ────────────────────────────────────────────────
export const reportsService = {
  meta: async (): Promise<ReportsMeta> =>
    (await api.get("/admin/reports/meta")).data,

  create: async (body: {
    type: string; format: string; filters?: Record<string, unknown>; email_to?: string[];
  }): Promise<ReportJob> => (await api.post("/admin/reports", body)).data,

  history: async (params: Record<string, unknown>): Promise<Paged<ReportJob>> =>
    (await api.get("/admin/reports", { params })).data,

  download: async (id: string): Promise<Blob> =>
    (await api.get(`/admin/reports/${id}/download`, { responseType: "blob" })).data,

  retry: async (id: string): Promise<ReportJob> =>
    (await api.post(`/admin/reports/${id}/retry`)).data,

  schedules: async (): Promise<{ items: ScheduledReport[] }> =>
    (await api.get("/admin/reports/scheduled/list")).data,

  createSchedule: async (body: Record<string, unknown>): Promise<ScheduledReport> =>
    (await api.post("/admin/reports/scheduled", body)).data,

  updateSchedule: async (id: string, body: Record<string, unknown>): Promise<ScheduledReport> =>
    (await api.patch(`/admin/reports/scheduled/${id}`, body)).data,

  deleteSchedule: async (id: string) =>
    (await api.delete(`/admin/reports/scheduled/${id}`)).data,

  runNow: async (id: string): Promise<ReportJob> =>
    (await api.post(`/admin/reports/scheduled/${id}/run-now`)).data,
};

/** Trigger a browser download for a blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
