/**
 * Marketing CRM — API layer. Read: ADMIN+. Create/send/manage: SUPER_ADMIN.
 */
import { api } from "@/lib/api";
import type {
  CampaignRow, CouponResponse, EmailTemplateRow, MarketingDashboard,
  MarketingMeta, ReferralRow, SubscriberRow,
} from "@/types/admin.marketing";
import type { Paged } from "@/types/admin.security";

export interface CampaignPayload {
  name: string;
  channel: "EMAIL" | "SMS" | "PUSH";
  subject?: string;
  preheader?: string;
  body_html?: string;
  body_text?: string;
  template_id?: string | null;
  segment: string;
  custom_user_ids?: string[];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_url?: string;
  scheduled_at?: string | null;
}

export const marketingService = {
  dashboard: async (): Promise<MarketingDashboard> =>
    (await api.get("/admin/marketing/dashboard")).data,

  meta: async (): Promise<MarketingMeta> =>
    (await api.get("/admin/marketing/meta")).data,

  campaigns: async (params: Record<string, unknown>): Promise<Paged<CampaignRow>> =>
    (await api.get("/admin/marketing/campaigns", { params })).data,

  campaignDetail: async (id: string): Promise<CampaignRow> =>
    (await api.get(`/admin/marketing/campaigns/${id}`)).data,

  campaignRecipients: async (id: string, params: Record<string, unknown>) =>
    (await api.get(`/admin/marketing/campaigns/${id}/recipients`, { params })).data,

  createCampaign: async (body: CampaignPayload): Promise<CampaignRow> =>
    (await api.post("/admin/marketing/campaigns", body)).data,

  updateCampaign: async (id: string, body: CampaignPayload): Promise<CampaignRow> =>
    (await api.patch(`/admin/marketing/campaigns/${id}`, body)).data,

  sendCampaign: async (id: string, scheduled_at?: string | null) =>
    (await api.post(`/admin/marketing/campaigns/${id}/send`, { scheduled_at })).data,

  deleteCampaign: async (id: string) =>
    (await api.delete(`/admin/marketing/campaigns/${id}`)).data,

  previewSegment: async (segment: string): Promise<{ size: number; sample: { name?: string; email?: string }[] }> =>
    (await api.get(`/admin/marketing/segments/${segment}/preview`)).data,

  templates: async (): Promise<{ items: EmailTemplateRow[] }> =>
    (await api.get("/admin/marketing/templates")).data,

  createTemplate: async (body: { name: string; category?: string; subject?: string; body_html: string }) =>
    (await api.post("/admin/marketing/templates", body)).data,

  deleteTemplate: async (id: string) =>
    (await api.delete(`/admin/marketing/templates/${id}`)).data,

  subscribers: async (params: Record<string, unknown>): Promise<Paged<SubscriberRow>> =>
    (await api.get("/admin/marketing/subscribers", { params })).data,

  syncSubscribers: async () =>
    (await api.post("/admin/marketing/subscribers/sync-users")).data,

  referrals: async (params: Record<string, unknown>): Promise<Paged<ReferralRow>> =>
    (await api.get("/admin/marketing/referrals", { params })).data,

  backfillReferrals: async () =>
    (await api.post("/admin/marketing/referrals/backfill")).data,

  coupons: async (): Promise<CouponResponse> =>
    (await api.get("/admin/marketing/coupons")).data,
};
