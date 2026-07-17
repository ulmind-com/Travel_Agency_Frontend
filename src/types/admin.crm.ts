// ── Enterprise CRM & Customer Intelligence types ─────────────────────────

export type SearchEntityType =
  | "USER" | "ADMIN" | "BOOKING" | "PAYMENT" | "INVOICE"
  | "PACKAGE" | "COUPON" | "QR";

export interface SearchResult {
  type: SearchEntityType;
  id: string;
  title: string | null;
  subtitle: string | null;
  status: string | null;
  preview: string;
  image?: string | null;
  link: string;
}

export interface GlobalSearchResponse {
  query: string;
  fuzzy: boolean;
  total: number;
  results: SearchResult[];
  grouped: Partial<Record<SearchEntityType, SearchResult[]>>;
}

export interface SearchSuggestions {
  popular: string[];
  entities: string[];
}

export interface FilterFacets {
  geo: { countries: string[]; states: string[]; cities: string[] };
  travel: { destinations: string[]; packages: string[]; guides: string[]; hotels: string[]; vehicles: string[] };
  commerce: {
    coupons: string[]; payment_methods: string[]; payment_statuses: string[];
    booking_statuses: string[]; refund_statuses: string[]; qr_statuses: string[];
    invoice_statuses: string[]; verification_statuses: string[];
  };
  crm: {
    roles: string[]; registration_sources: string[]; tiers: string[];
    health_categories: string[]; fraud_levels: string[]; max_lifetime_spending: number;
  };
}

export type HealthCategory = "VIP" | "PREMIUM" | "REGULAR" | "INACTIVE" | "RISK" | "FRAUD_SUSPECTED";
export type LoyaltyTier = "REGULAR" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
export type FraudLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IntelUser {
  _id: string;
  name: string;
  email: string;
  customer_id?: string | null;
  phone_number?: string | null;
  profile_image?: { url: string } | null;
  country?: string | null;
  city?: string | null;
  created_at?: string;
  dob?: string | null;
  last_login?: string | null;
  registration_source?: string | null;
  is_blocked?: boolean;
  is_suspended?: boolean;
}

export interface HealthInfo {
  score: number;
  category: HealthCategory;
  trend: "UP" | "DOWN" | "FLAT";
  reasons: string[];
  components: Record<string, number>;
}

export interface LoyaltyInfo {
  tier: LoyaltyTier;
  tier_overridden: boolean;
  tier_override?: { tier: string; reason: string; by: string; at: string } | null;
  lifetime_spending: number;
  points: { earned: number; redeemed: number; expired: number; available: number };
  next_tier: LoyaltyTier | null;
  next_tier_progress: number;
  next_tier_amount_needed: number;
  tier_since?: string | null;
  points_expiry?: string | null;
  coupons_earned: number;
  coupons_used: number;
  cashback: number;
  referral_points: number;
  thresholds: Record<string, number>;
}

export interface FraudSignal { code: string; weight: number; detail: string }

export interface FraudInfo {
  score: number;
  level: FraudLevel;
  overridden: boolean;
  override?: { level: string; reason: string; by: string; at: string } | null;
  signals: FraudSignal[];
  reasons: string[];
  recommended_action: string;
}

export interface IntelFacts {
  bookings: number;
  completed_trips: number;
  cancelled: number;
  payments: number;
  failed_payments: number;
  refunds: number;
  reviews: number;
  avg_rating?: number | null;
  last_activity?: string | null;
  devices: number;
  countries: string[];
}

export interface IntelRow {
  user: IntelUser;
  user_id: string;
  health: HealthInfo;
  loyalty: LoyaltyInfo;
  fraud: FraudInfo;
  facts: IntelFacts;
  computed_at: string;
}

export interface IntelListResponse {
  items: IntelRow[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  summary: {
    total_customers: number;
    categories: Partial<Record<HealthCategory, number>>;
    tiers: Partial<Record<LoyaltyTier, number>>;
    fraud_levels: Partial<Record<FraudLevel, number>>;
    avg_health: number;
    total_points_available: number;
    total_lifetime_spending: number;
    alerts: number;
  };
}

export interface LedgerEntry {
  _id: string;
  entry_type: "REDEEM" | "EXPIRE" | "GRANT" | "ADJUST";
  points: number;
  reason: string;
  reference?: string | null;
  created_at: string;
}

export interface IntelDetail extends IntelRow {
  ledger?: LedgerEntry[];
}

export interface CrmListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  tier?: string;
  fraud_level?: string;
  min_score?: number;
  max_score?: number;
  min_spend?: number;
  max_spend?: number;
  country?: string;
  registration_source?: string;
  user_ids?: string;
  sort?: "score" | "spend" | "fraud" | "points" | "recent";
}
