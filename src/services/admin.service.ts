import { api } from "@/lib/api";
import type { EnterpriseDashboardResponse } from "@/types/api";
import type { AdminUserListResponse, AdminUserProfileResponse, AdminUserFilters } from "@/types/admin.users";

export const adminService = {
  getDashboard: async (timeframe: string = "last_30_days"): Promise<EnterpriseDashboardResponse> => {
    const { data } = await api.get(`/admin/dashboard/overview?timeframe=${timeframe}`);
    return data;
  },
  listUsers: async (filters: AdminUserFilters): Promise<AdminUserListResponse> => {
    const searchParams = new URLSearchParams();
    if (filters.skip !== undefined) searchParams.set("skip", filters.skip.toString());
    if (filters.limit !== undefined) searchParams.set("limit", filters.limit.toString());
    if (filters.search) searchParams.set("search", filters.search);
    if (filters.role && filters.role !== "ALL") searchParams.set("role", filters.role);
    if (filters.status && filters.status !== "ALL") searchParams.set("status", filters.status);
    
    const { data } = await api.get(`/admin/users?${searchParams.toString()}`);
    return data;
  },
  exportUsers: async (): Promise<any[]> => {
    const { data } = await api.get(`/admin/users/export`);
    return data;
  },
  getUserProfile: async (id: string): Promise<AdminUserProfileResponse> => {
    const { data } = await api.get(`/admin/users/${id}`);
    return data;
  },
  getUserActivity: async (id: string, skip = 0, limit = 50): Promise<any[]> => {
    const { data } = await api.get(`/admin/users/${id}/activity?skip=${skip}&limit=${limit}`);
    return data;
  },
  getUserTimeline: async (id: string): Promise<any[]> => {
    const { data } = await api.get(`/admin/users/${id}/timeline`);
    return data;
  },
  getUserDocuments: async (id: string): Promise<any> => {
    const { data } = await api.get(`/admin/users/${id}/documents`);
    return data;
  },
  getUserSessions: async (id: string): Promise<any[]> => {
    const { data } = await api.get(`/admin/users/${id}/sessions`);
    return data;
  },
  updateUser: async (id: string, payload: any): Promise<any> => {
    const { data } = await api.patch(`/admin/users/${id}`, payload);
    return data;
  },
  verifyUser: async (id: string): Promise<any> => {
    const { data } = await api.post(`/admin/users/${id}/verify`);
    return data;
  },
  suspendUser: async (id: string, reason: string): Promise<any> => {
    const { data } = await api.post(`/admin/users/${id}/suspend`, { reason });
    return data;
  },
  blockUser: async (id: string, reason: string): Promise<any> => {
    const { data } = await api.post(`/admin/users/${id}/block`, { reason });
    return data;
  },
  deleteUser: async (id: string, reason: string): Promise<any> => {
    const { data } = await api.delete(`/admin/users/${id}`, { data: { reason } });
    return data;
  },
  restoreUser: async (id: string): Promise<any> => {
    const { data } = await api.post(`/admin/users/${id}/restore`);
    return data;
  },
  impersonateUser: async (id: string): Promise<{ access_token: string; token_type: string }> => {
    const { data } = await api.post(`/admin/users/${id}/impersonate`);
    return data;
  },
  notifyUser: async (id: string, message: string): Promise<any> => {
    const { data } = await api.post(`/admin/users/${id}/notify`, { message });
    return data;
  },
  listBookings: async (skip = 0, limit = 50): Promise<any[]> => {
    const { data } = await api.get(`/admin/bookings?skip=${skip}&limit=${limit}`);
    return data;
  },
  // ── Booking Intelligence ───────────────────────────────────────────────
  getUserBookings: async (userId: string): Promise<any> => {
    const { data } = await api.get(`/admin/users/${userId}/bookings`);
    return data;
  },
  getBookingDetail: async (bookingId: string): Promise<any> => {
    const { data } = await api.get(`/admin/bookings/${bookingId}`);
    return data;
  },
  getBookingTimeline: async (bookingId: string): Promise<any[]> => {
    const { data } = await api.get(`/admin/bookings/${bookingId}/timeline`);
    return data;
  },
  getBookingPayment: async (bookingId: string): Promise<any> => {
    const { data } = await api.get(`/admin/bookings/${bookingId}/payment`);
    return data;
  },
  getBookingQr: async (bookingId: string): Promise<any> => {
    const { data } = await api.get(`/admin/bookings/${bookingId}/qr`);
    return data;
  },
  updateBooking: async (bookingId: string, payload: Record<string, unknown>): Promise<any> => {
    const { data } = await api.patch(`/admin/bookings/${bookingId}`, payload);
    return data;
  },
  cancelBooking: async (bookingId: string, reason: string): Promise<any> => {
    const { data } = await api.post(`/admin/bookings/${bookingId}/cancel`, { reason });
    return data;
  },
  assignManager: async (bookingId: string, name: string): Promise<any> => {
    const { data } = await api.post(`/admin/bookings/${bookingId}/assign-manager`, { name });
    return data;
  },
  assignGuide: async (bookingId: string, name: string): Promise<any> => {
    const { data } = await api.post(`/admin/bookings/${bookingId}/assign-guide`, { name });
    return data;
  },
  generateInvoice: async (bookingId: string): Promise<any> => {
    const { data } = await api.post(`/admin/bookings/${bookingId}/generate-invoice`);
    return data;
  },
  resendEmail: async (bookingId: string): Promise<any> => {
    const { data } = await api.post(`/admin/bookings/${bookingId}/resend-email`);
    return data;
  },
  regenerateQr: async (bookingId: string): Promise<any> => {
    const { data } = await api.post(`/admin/bookings/${bookingId}/regenerate-qr`);
    return data;
  },

  // ── Enterprise Payment Center ──────────────────────────────────────────
  getPaymentsDashboard: async (): Promise<any> => {
    const { data } = await api.get(`/admin/payments/dashboard`);
    return data;
  },
  getPaymentsStatistics: async (months = 6): Promise<any> => {
    const { data } = await api.get(`/admin/payments/statistics?months=${months}`);
    return data;
  },
  listPaymentsAdvanced: async (params: Record<string, unknown>): Promise<any> => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "ALL") sp.set(k, String(v));
    });
    const { data } = await api.get(`/admin/payments?${sp.toString()}`);
    return data;
  },
  getPaymentDetail: async (paymentId: string): Promise<any> => {
    const { data } = await api.get(`/admin/payments/${paymentId}`);
    return data;
  },
  getPaymentTimeline: async (paymentId: string): Promise<any[]> => {
    const { data } = await api.get(`/admin/payments/${paymentId}/timeline`);
    return data;
  },
  getPaymentWebhooks: async (paymentId: string): Promise<any[]> => {
    const { data } = await api.get(`/admin/payments/${paymentId}/webhooks`);
    return data;
  },
  paymentRefundAction: async (
    paymentId: string,
    body: { action: "request" | "approve" | "reject"; amount?: number; reason?: string; refund_id?: string },
  ): Promise<any> => {
    const { data } = await api.post(`/admin/payments/${paymentId}/refund`, body);
    return data;
  },
  retryPaymentWebhook: async (paymentId: string): Promise<any> => {
    const { data } = await api.post(`/admin/payments/${paymentId}/retry-webhook`);
    return data;
  },
  settlePayment: async (paymentId: string, settlementId?: string): Promise<any> => {
    const { data } = await api.post(`/admin/payments/${paymentId}/settle`, { settlement_id: settlementId });
    return data;
  },
  exportPayments: async (format: "csv" | "json", params: Record<string, unknown>): Promise<Blob> => {
    const sp = new URLSearchParams({ format });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "ALL") sp.set(k, String(v));
    });
    const { data } = await api.get(`/admin/payments/export?${sp.toString()}`, { responseType: "blob" });
    return data as Blob;
  },
};
