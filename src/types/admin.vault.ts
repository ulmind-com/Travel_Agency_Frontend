// ── Document Vault types ─────────────────────────────────────────────────────

export type DocCategory =
  | "PASSPORT" | "VISA" | "AADHAR" | "PAN" | "DRIVING_LICENSE" | "INSURANCE"
  | "TRAVEL_PERMIT" | "GOVERNMENT_ID" | "ADDRESS_PROOF" | "INVOICE" | "TICKET"
  | "QR_IMAGE" | "PAYMENT_RECEIPT" | "TRAVEL_VOUCHER" | "HOTEL_VOUCHER"
  | "FLIGHT_TICKET" | "OTHER";

export interface DocVersion {
  version: number;
  format?: string | null;
  bytes: number;
  resource_type: string;
  original_filename?: string | null;
  sha256?: string | null;
  uploaded_by_name?: string | null;
  uploaded_at: string;
  note?: string | null;
  virus_scan: string;
  is_current: boolean;
}

export interface DocShareLink {
  token: string;
  expires_at: string;
  watermark: boolean;
  max_access?: number | null;
  access_count: number;
  revoked: boolean;
  created_at: string;
  created_by_name?: string | null;
  is_expired?: boolean;
}

export interface DocTimelineEvent {
  id: string;
  action: string;
  description: string;
  actor_name?: string | null;
  actor_role?: string | null;
  ip_address?: string | null;
  created_at: string;
  details: Record<string, unknown>;
}

export interface VaultDoc {
  id: string;
  name: string;
  category: DocCategory;
  status: "ACTIVE" | "DELETED";
  tags: string[];
  description?: string | null;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  booking_reference?: string | null;
  current_version: number;
  versions_count?: number;
  format?: string | null;
  resource_type: string;
  bytes: number;
  is_sensitive: boolean;
  encrypted_metadata: boolean;
  expiry_date?: string | null;
  is_expired: boolean;
  verification: "PENDING" | "VERIFIED" | "REJECTED";
  verified_by_name?: string | null;
  verified_at?: string | null;
  verification_note?: string | null;
  source: string;
  download_count: number;
  active_share_links?: number;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  deleted_by_name?: string | null;
  versions?: DocVersion[];
  share_links?: DocShareLink[];
  timeline?: DocTimelineEvent[];
}

export interface VaultStorage {
  total_documents: number;
  total_versions: number;
  total_bytes: number;
  by_category: { category: string; count: number; bytes: number }[];
}

export interface VaultOverview {
  storage: VaultStorage;
  cloudinary: {
    plan?: string; credits_used?: number; credits_limit?: number;
    storage_bytes?: number; bandwidth_bytes?: number; objects?: number;
  };
  by_status: Record<string, number>;
  by_verification: Record<string, number>;
  expiring_soon: VaultDoc[];
  expired_count: number;
  uploads_trend_30d: { date: string; count: number; bytes: number }[];
  recent_activity: { id: string; action: string; description: string; actor_name?: string | null; created_at: string }[];
}
