import { api } from "@/lib/api";
import type {
  QRListResponse, QRDetail, QRSummary, QRAnalytics, QRHistoryResponse, QRVerifyResponse,
  NotificationListResponse, NotificationPreferences, ActivityFeedResponse,
} from "@/types/admin.realtime";

function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "" && v !== "ALL") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ── Enterprise QR Management ─────────────────────────────────────────────
export const qrService = {
  summary: async (): Promise<QRSummary> => {
    const { data } = await api.get("/admin/qr/summary");
    return data;
  },
  list: async (params: Record<string, unknown>): Promise<QRListResponse> => {
    const { data } = await api.get(`/admin/qr${qs(params)}`);
    return data;
  },
  detail: async (id: string): Promise<QRDetail> => {
    const { data } = await api.get(`/admin/qr/${id}`);
    return data;
  },
  history: async (id: string, page = 1): Promise<QRHistoryResponse> => {
    const { data } = await api.get(`/admin/qr/${id}/history?page=${page}`);
    return data;
  },
  analytics: async (id: string): Promise<QRAnalytics> => {
    const { data } = await api.get(`/admin/qr/${id}/analytics`);
    return data;
  },
  verify: async (payload: string, gps?: { latitude: number; longitude: number }): Promise<QRVerifyResponse> => {
    const { data } = await api.post("/admin/qr/verify", { payload, ...gps });
    return data;
  },
  regenerate: async (id: string, body: { reason?: string; extend_days?: number }) => {
    const { data } = await api.post(`/admin/qr/${id}/regenerate`, body);
    return data;
  },
  setStatus: async (id: string, status: "ACTIVE" | "REVOKED" | "BLOCKED", reason?: string) => {
    const { data } = await api.patch(`/admin/qr/${id}/status`, { status, reason });
    return data;
  },
  download: async (id: string, format: "png" | "svg" | "pdf"): Promise<Blob> => {
    const { data } = await api.get(`/admin/qr/${id}/download?format=${format}`, { responseType: "blob" });
    return data;
  },
  exportCsv: async (): Promise<Blob> => {
    const { data } = await api.get("/admin/qr/export", { responseType: "blob" });
    return data;
  },
};

// ── Notification Center ──────────────────────────────────────────────────
export const notificationsService = {
  list: async (params: Record<string, unknown>): Promise<NotificationListResponse> => {
    const { data } = await api.get(`/admin/notifications${qs(params)}`);
    return data;
  },
  unreadCount: async (): Promise<{ unread_count: number }> => {
    const { data } = await api.get("/admin/notifications/unread-count");
    return data;
  },
  markRead: async (id: string) => {
    const { data } = await api.patch(`/admin/notifications/${id}/read`);
    return data;
  },
  markUnread: async (id: string) => {
    const { data } = await api.patch(`/admin/notifications/${id}/unread`);
    return data;
  },
  markAllRead: async () => {
    const { data } = await api.patch("/admin/notifications/read-all");
    return data;
  },
  archive: async (id: string) => {
    const { data } = await api.patch(`/admin/notifications/${id}/archive`);
    return data;
  },
  pin: async (id: string): Promise<{ status: string; is_pinned: boolean }> => {
    const { data } = await api.patch(`/admin/notifications/${id}/pin`);
    return data;
  },
  getPreferences: async (): Promise<NotificationPreferences> => {
    const { data } = await api.get("/admin/notifications/preferences");
    return data;
  },
  updatePreferences: async (patch: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const { data } = await api.patch("/admin/notifications/preferences", patch);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/admin/notifications/${id}`);
    return data;
  },
  exportCsv: async (): Promise<Blob> => {
    const { data } = await api.get("/admin/notifications/export", { responseType: "blob" });
    return data;
  },
};

// ── Live Activity Feed ───────────────────────────────────────────────────
export const activityService = {
  feed: async (params: Record<string, unknown>): Promise<ActivityFeedResponse> => {
    const { data } = await api.get(`/admin/activity${qs(params)}`);
    return data;
  },
  online: async (): Promise<{ online: { admin_id: string; name: string }[]; count: number }> => {
    const { data } = await api.get("/admin/activity/online");
    return data;
  },
};
