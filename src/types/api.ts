// Shared API types generated from the Ulmind Travel backend OpenAPI spec.
// Kept as hand-written TypeScript types (with a light runtime shape) rather
// than a full codegen because we only touch ~30 endpoints.

export type CloudinaryMedia = {
  url: string;
  public_id: string;
};

export type PackageCategory =
  | "HONEYMOON"
  | "ADVENTURE"
  | "BEACH"
  | "WILDLIFE"
  | "HERITAGE"
  | "FAMILY"
  | "MOUNTAIN"
  | "PILGRIMAGE"
  | "OTHER";

export type VideoType = "YOUTUBE" | "UPLOADED" | "NONE";

export type ItineraryDay = {
  day_number: number;
  title: string;
  timing_details: string;
  plan_description: string;
  day_image?: CloudinaryMedia | null;
};

export type TransportInfo = {
  vehicle_type: string;
  total_vehicles: number;
  seats_per_vehicle: number;
  total_seats?: number;
};

export type Package = {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  destinations: string[];
  category: PackageCategory;
  duration_days: number;
  duration_nights: number;
  valid_from?: string | null;
  valid_upto?: string | null;
  base_price: number;
  discounted_price?: number | null;
  currency: string;
  tax_percent?: number;
  transport_info?: TransportInfo | null;
  gallery_images: CloudinaryMedia[];
  itinerary: ItineraryDay[];
  required_traveler_documents: string[];
  inclusions: string[];
  exclusions: string[];
  thumbnail: CloudinaryMedia;
  video_type?: VideoType;
  video_url?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  average_rating?: number;
  total_reviews?: number;
  seats_available?: number;
  cancellation_policy?: string;
};

export type UserRole = "ADMIN" | "CUSTOMER";

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone_number?: string | null;
  profile_image?: CloudinaryMedia | null;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type SavedTraveler = {
  _id?: string;
  id?: string;
  name: string;
  gender: Gender;
  age: number;
  relation?: string | null;
};

export type TravelerType = "ADULT" | "CHILD";

export type Traveler = {
  traveler_type: TravelerType;
  name: string;
  phone?: string | null;
  email?: string | null;
  photo?: CloudinaryMedia;
  uploaded_documents?: Record<string, CloudinaryMedia>;
};

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "CANCELLATION_REQUESTED"
  | "COMPLETED"
  | "FAILED";

export type Booking = {
  _id?: string;
  id?: string;
  booking_reference: string;
  user_id: string;
  package_id: string;
  travel_start_date: string;
  travelers_count: number;
  total_amount: number;
  status: BookingStatus;
  travelers: Traveler[];
  qr_code_url?: string | null;
  is_checked_in?: boolean;
  tour_end_date?: string | null;
  cancellation_requested_at?: string | null;
  cancelled_at?: string | null;
  refund_amount?: number;
  penalty_amount?: number;
  applied_promo_code?: string | null;
  created_at?: string;
};

export type Review = {
  _id?: string;
  id?: string;
  user_id?: string;
  user_name?: string;
  package_id: string;
  rating: number;
  comment: string;
  created_at?: string;
};

export type DashboardResponse = {
  total_revenue: number;
  total_bookings_count: number;
  total_refunds_processed: number;
  current_month_revenue: number;
  current_month_bookings: number;
  top_packages: Array<{
    package_id: string;
    title: string;
    thumbnail_url?: string | null;
    total_sales: number;
    total_bookings: number;
  }>;
  top_promo_codes: Array<{
    code: string;
    discount_type: string;
    current_uses: number;
  }>;
};

/** Utility to normalize the Mongo `_id` field into a stable `id` on any doc. */
export function withId<T extends { _id?: string; id?: string }>(doc: T): T & { id: string } {
  const id = doc.id ?? doc._id ?? "";
  return { ...doc, id };
}