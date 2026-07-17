// ── Marketing CRM types ──────────────────────────────────────────────────────

export interface CampaignRates {
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  conversion_rate: number;
  ctr: number;
}

export interface CampaignRow {
  id: string;
  name: string;
  channel: "EMAIL" | "SMS" | "PUSH";
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "PAUSED" | "FAILED" | "CANCELLED";
  subject?: string | null;
  segment?: string;
  audience_size: number;
  sent_count: number;
  delivered_count: number;
  open_count: number;
  unique_open_count: number;
  click_count: number;
  unique_click_count: number;
  bounce_count: number;
  conversion_count: number;
  revenue_generated: number;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_by_name?: string | null;
  created_at: string;
  rates: CampaignRates;
  recipient_breakdown?: Record<string, number>;
  conversions?: { name?: string; email?: string; amount: number; at?: string }[];
}

export interface MarketingDashboard {
  campaigns: { total: number; sent: number; scheduled: number };
  performance: {
    sent: number; delivered: number; opens: number; clicks: number;
    conversions: number; revenue: number;
    open_rate: number; click_rate: number; delivery_rate: number;
    bounce_rate: number; conversion_rate: number;
  };
  newsletter: { subscribers: number };
  referrals: { programs: number; signups: number; converted: number; earnings: number; revenue: number };
  coupons: { active: number; total_uses: number };
  top_campaign?: CampaignRow | null;
}

export interface MarketingMeta {
  channels: string[];
  segments: string[];
  statuses: string[];
  segment_sizes: Record<string, number>;
}

export interface EmailTemplateRow {
  id: string;
  name: string;
  category?: string | null;
  subject?: string | null;
  body_html: string;
  is_system: boolean;
  created_at: string;
}

export interface SubscriberRow {
  id: string;
  email: string;
  name?: string | null;
  status: string;
  source?: string | null;
  subscribed_at?: string | null;
}

export interface ReferralRow {
  id: string;
  user_name?: string | null;
  user_email?: string | null;
  code: string;
  signups: number;
  converted: number;
  conversion_rate: number;
  earnings: number;
  revenue: number;
  is_active: boolean;
}

export interface CouponRow {
  id: string;
  code: string;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  current_uses: number;
  max_uses: number;
  usage_rate: number;
  is_active: boolean;
  valid_until?: string | null;
  bookings_generated: number;
  revenue_generated: number;
  total_discount_given: number;
}

export interface CouponResponse {
  items: CouponRow[];
  top_coupon?: CouponRow | null;
  totals: { active: number; uses: number; revenue: number };
}
